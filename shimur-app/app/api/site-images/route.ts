import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { T, SITE_IMAGES_BUCKET } from '@/lib/supabase/config';
import { adminOrError, jsonError, zodMessage } from '@/lib/api';

// תמונות אתר: העלאה לדלי ציבורי, ושיבוץ כתמונה ראשית (shimur_buildings.image_url)
// או כתמונה נוספת בגלריה (shimur_documents מסוג image). שום תמונה לא נמחקת:
// תמונה ראשית שהוחלפה עוברת לגלריה, ותמונה שהוסרה מסומנת removed_at.

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const UploadInput = z.object({
  site: z.string().regex(/^\d+$/, 'מספר אתר חסר'),
  title: z.string().trim().max(200).optional(),
  primary: z.enum(['0', '1']).optional(),
});

async function siteRow(admin: SupabaseClient, siteNo: string) {
  const { data } = await admin.from(T.buildings).select('id, name, image_url').eq('site_no', Number(siteNo)).maybeSingle();
  return data as { id: string; name: string; image_url: string | null } | null;
}

/** קובע תמונה ראשית. התמונה הקודמת, אם יש, נשמרת בגלריה. */
async function setPrimary(admin: SupabaseClient, site: { id: string; name: string; image_url: string | null }, url: string) {
  if (site.image_url && site.image_url !== url) {
    const { error } = await admin.from(T.documents).insert({ kind: 'image', title: `${site.name} — תמונה קודמת`, url: site.image_url, building_id: site.id });
    if (error) return 'שמירת התמונה הקודמת בגלריה נכשלה: ' + error.message;
  }
  const { error } = await admin.from(T.buildings).update({ image_url: url, updated_at: new Date().toISOString() }).eq('id', site.id);
  return error ? 'עדכון התמונה הראשית נכשל: ' + error.message : null;
}

export async function POST(request: NextRequest) {
  const { admin, error: authError } = await adminOrError(request);
  if (authError) return authError;

  const form = await request.formData();
  const parsed = UploadInput.safeParse({
    site: form.get('site'),
    title: form.get('title') || undefined,
    primary: form.get('primary') || undefined,
  });
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return jsonError('לא התקבלה תמונה. גררי, הדביקי או בחרי קובץ ונסי שוב.', 400);
  const ext = TYPES[file.type];
  if (!ext) return jsonError('סוג הקובץ אינו נתמך. העלי JPG, PNG או WEBP.', 400);
  if (file.size > MAX_BYTES) return jsonError('התמונה גדולה מ-8MB גם אחרי הקטנה. בחרי תמונה קטנה יותר.', 400);

  const site = await siteRow(admin, parsed.data.site);
  if (!site) return jsonError('האתר לא נמצא במאגר. רענני את הדף ונסי שוב.', 404);

  const path = `site-${parsed.data.site}/${Date.now()}.${ext}`;
  const { error: upErr } = await admin.storage.from(SITE_IMAGES_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: '31536000' });
  if (upErr) return jsonError('העלאת התמונה נכשלה: ' + upErr.message, 500);
  const url = admin.storage.from(SITE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;

  const asPrimary = parsed.data.primary === '1' || !site.image_url;
  if (asPrimary) {
    const err = await setPrimary(admin, site, url);
    if (err) return jsonError(err, 500);
  } else {
    const { error } = await admin.from(T.documents).insert({ kind: 'image', title: parsed.data.title || site.name, url, building_id: site.id });
    if (error) return jsonError('התמונה הועלתה, אך הוספתה לגלריה נכשלה: ' + error.message, 500);
  }
  return NextResponse.json({ success: true, url, placed: asPrimary ? 'primary' : 'gallery' });
}

const PrimaryInput = z.object({
  site: z.string().regex(/^\d+$/, 'מספר אתר חסר'),
  url: z.string().trim().min(1, 'כתובת תמונה חסרה'),
});

/** תמונה מהגלריה הופכת לראשית; הראשית הקודמת עוברת לגלריה */
export async function PATCH(request: NextRequest) {
  const { admin, error: authError } = await adminOrError(request);
  if (authError) return authError;
  const parsed = PrimaryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

  const site = await siteRow(admin, parsed.data.site);
  if (!site) return jsonError('האתר לא נמצא במאגר. רענני את הדף ונסי שוב.', 404);
  const err = await setPrimary(admin, site, parsed.data.url);
  if (err) return jsonError(err, 500);
  const { error: delErr } = await admin.from(T.documents).delete().eq('building_id', site.id).eq('kind', 'image').eq('url', parsed.data.url);
  if (delErr) return jsonError('התמונה נקבעה כראשית, אך הסרתה מהגלריה נכשלה: ' + delErr.message, 500);
  return NextResponse.json({ success: true });
}

/**
 * הסרת תמונה לא רצויה. שום דבר לא נמחק: הקובץ נשאר, והרשומה מסומנת removed_at.
 * תמונה ראשית שהוסרה: התמונה הראשונה בגלריה תופסת את מקומה, ואם אין — משטח הצבע.
 */
export async function DELETE(request: NextRequest) {
  const { admin, error: authError } = await adminOrError(request);
  if (authError) return authError;
  const parsed = PrimaryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

  const site = await siteRow(admin, parsed.data.site);
  if (!site) return jsonError('האתר לא נמצא במאגר. רענני את הדף ונסי שוב.', 404);
  const now = new Date().toISOString();

  if (site.image_url !== parsed.data.url) {
    const { data, error } = await admin.from(T.documents).update({ removed_at: now })
      .eq('building_id', site.id).eq('kind', 'image').eq('url', parsed.data.url).is('removed_at', null).select('id');
    if (error) return jsonError('הסרת התמונה נכשלה: ' + error.message, 500);
    if (!data?.length) return jsonError('התמונה לא נמצאה באתר. רענני את הדף ונסי שוב.', 404);
    return NextResponse.json({ success: true });
  }

  // התמונה הראשית: נשמרת כרשומה מוסרת, כדי שאפשר יהיה לשחזר
  const { error: keepErr } = await admin.from(T.documents)
    .insert({ kind: 'image', title: `${site.name} — תמונה שהוסרה`, url: site.image_url, building_id: site.id, removed_at: now });
  if (keepErr) return jsonError('הסרת התמונה נכשלה: ' + keepErr.message, 500);

  const { data: next } = await admin.from(T.documents).select('id, url')
    .eq('building_id', site.id).eq('kind', 'image').is('removed_at', null)
    .order('created_at', { ascending: true }).limit(1).maybeSingle();
  const { error: upErr } = await admin.from(T.buildings)
    .update({ image_url: (next?.url as string | undefined) ?? null, updated_at: now }).eq('id', site.id);
  if (upErr) return jsonError('הסרת התמונה הראשית נכשלה: ' + upErr.message, 500);
  if (next) await admin.from(T.documents).delete().eq('id', next.id);
  return NextResponse.json({ success: true, replacedBy: next?.url ?? null });
}

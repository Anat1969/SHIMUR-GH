import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { T, FINDINGS_BUCKET } from '@/lib/supabase/config';
import { getFileId, photoUrl } from '@/lib/data/files';
import { adminOrError, jsonError, zodMessage } from '@/lib/api';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const FindingInput = z.object({
  city_registry_id: z.string().min(1, 'מספר רישום חסר'),
  location_desc: z.string().trim().min(1, 'מיקום הממצא חסר — תארי היכן במבנה נמצא הממצא'),
  notes: z.string().max(5000).optional(),
});

export async function POST(request: NextRequest) {
  const { admin, error: keyError } = adminOrError();
  if (keyError) return keyError;

  const form = await request.formData();
  const parsed = FindingInput.safeParse({
    city_registry_id: form.get('city_registry_id'),
    location_desc: form.get('location_desc'),
    notes: form.get('notes') ?? undefined,
  });
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { city_registry_id, location_desc, notes } = parsed.data;

  const fileId = await getFileId(admin, city_registry_id);
  if (!fileId) return jsonError('האתר לא נמצא במאגר. רענני את הדף ונסי שוב.', 404);

  let photoIds: string[] = [];
  let photoWarning: string | null = null;
  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return jsonError('התמונה גדולה מ-10MB. צלמי שוב באיכות נמוכה יותר.', 400);
    if (!photo.type.startsWith('image/')) return jsonError('הקובץ אינו תמונה.', 400);
    const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${fileId}/${Date.now()}.${ext}`;
    const { error: upErr } = await admin.storage
      .from(FINDINGS_BUCKET)
      .upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type });
    if (upErr) {
      photoWarning = 'הממצא נשמר, אך העלאת התמונה נכשלה: ' + upErr.message;
    } else {
      const { data: rec, error: recErr } = await admin
        .from(T.photos).insert({ file_id: fileId, storage_path: path, caption: notes ?? null })
        .select('id').single();
      if (recErr) photoWarning = 'הממצא נשמר, אך רישום התמונה נכשל: ' + recErr.message;
      else photoIds = [rec.id as string];
    }
  }

  const { data: finding, error } = await admin
    .from(T.findings)
    .insert({ file_id: fileId, location_desc, notes: notes || null, photo_ids: photoIds })
    .select('id, location_desc, notes, created_at')
    .single();
  if (error) return jsonError('שמירת הממצא נכשלה: ' + error.message, 500);

  await admin.from(T.buildings).update({ status: 'בתהליך' })
    .eq('city_registry_id', city_registry_id).eq('status', 'לא_התחיל');

  return NextResponse.json({ success: true, finding, warning: photoWarning });
}

export async function GET(request: NextRequest) {
  const cityRegistryId = new URL(request.url).searchParams.get('city_registry_id');
  const admin = getAdminClient();
  if (!admin || !cityRegistryId) return NextResponse.json({ findings: [] });

  const fileId = await getFileId(admin, cityRegistryId);
  if (!fileId) return NextResponse.json({ findings: [] });

  const { data: findings, error } = await admin
    .from(T.findings)
    .select('id, location_desc, notes, created_at, photo_ids')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false });
  if (error) return jsonError('טעינת הממצאים נכשלה: ' + error.message, 500);

  const ids = (findings ?? []).flatMap(f => (f.photo_ids as string[]).slice(0, 1));
  const paths: Record<string, string> = {};
  if (ids.length) {
    const { data: photos } = await admin.from(T.photos).select('id, storage_path').in('id', ids);
    (photos ?? []).forEach(p => { paths[p.id as string] = p.storage_path as string; });
  }
  const enriched = (findings ?? []).map(f => {
    const first = (f.photo_ids as string[])[0];
    return { ...f, photo_url: first && paths[first] ? photoUrl(paths[first]) : null };
  });
  return NextResponse.json({ findings: enriched });
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { T } from '@/lib/supabase/config';
import { adminOrError, jsonError, zodMessage } from '@/lib/api';

const RouteInput = z.object({
  title: z.string().trim().min(2, 'שם המסלול חסר — תני למסלול שם קצר'),
  description: z.string().trim().max(2000).optional().default(''),
  theme: z.string().trim().max(50).optional().default(''),
  sites: z.array(z.object({
    building_id: z.string().min(1),
    narrative_text: z.string().max(2000).optional().default(''),
  })).min(2, 'מסלול צריך לפחות שני אתרים — הוסיפי אתר נוסף'),
});

export async function POST(request: NextRequest) {
  const { admin, error: keyError } = await adminOrError(request);
  if (keyError) return keyError;

  const parsed = RouteInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { title, description, theme, sites } = parsed.data;

  const siteNos = sites.map(s => Number(s.building_id));
  const { data: rows, error: bErr } = await admin.from(T.buildings).select('id, site_no').in('site_no', siteNos);
  if (bErr) return jsonError('טעינת האתרים נכשלה: ' + bErr.message, 500);
  const idBySite = new Map((rows ?? []).map(r => [String(r.site_no), r.id as string]));
  if (sites.some(s => !idBySite.has(s.building_id))) return jsonError('אחד האתרים במסלול לא נמצא במאגר.', 400);

  const slug = `r-${Date.now().toString(36)}`;
  const { data: route, error } = await admin
    .from(T.routes)
    .insert({ slug, title, description: description || null, theme: theme || null })
    .select('id')
    .single();
  if (error) return jsonError('יצירת המסלול נכשלה: ' + error.message, 500);

  const { error: sErr } = await admin.from(T.routeSites).insert(
    sites.map((s, i) => ({
      route_id: route.id,
      building_id: idBySite.get(s.building_id),
      position: i + 1,
      narrative_text: s.narrative_text || null,
    })),
  );
  if (sErr) {
    await admin.from(T.routes).delete().eq('id', route.id);
    return jsonError('שמירת אתרי המסלול נכשלה: ' + sErr.message, 500);
  }
  return NextResponse.json({ success: true, id: slug });
}

export async function DELETE(request: NextRequest) {
  const { admin, error: keyError } = await adminOrError(request);
  if (keyError) return keyError;
  const slug = new URL(request.url).searchParams.get('id');
  if (!slug) return jsonError('מזהה מסלול חסר', 400);
  const { error } = await admin.from(T.routes).delete().eq('slug', slug);
  if (error) return jsonError('מחיקת המסלול נכשלה: ' + error.message, 500);
  return NextResponse.json({ success: true });
}

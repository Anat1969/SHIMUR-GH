import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { T } from '@/lib/supabase/config';
import { getDocuments } from '@/lib/data';
import { adminOrError, jsonError, siteDbId, zodMessage } from '@/lib/api';

export async function GET() {
  return NextResponse.json({ documents: await getDocuments() });
}

const DocInput = z.object({
  kind: z.enum(['link', 'note', 'image']),
  title: z.string().trim().min(1, 'כותרת חסרה — הוסיפי כותרת קצרה'),
  url: z.string().trim().url('הקישור אינו תקין — הדביקי כתובת מלאה שמתחילה ב-https://').or(z.literal('')).optional(),
  note: z.string().max(5000).optional(),
  building_id: z.string().optional(),
}).refine(d => d.kind === 'note' || !!d.url, { message: 'קישור חסר — הדביקי כתובת URL' });

async function toRow(admin: Parameters<typeof siteDbId>[0], d: z.infer<typeof DocInput>) {
  return {
    kind: d.kind,
    title: d.title,
    url: d.url || null,
    note: d.note?.trim() || null,
    building_id: d.building_id ? await siteDbId(admin, d.building_id) : null,
  };
}

export async function POST(request: NextRequest) {
  const { admin, error: keyError } = await adminOrError(request);
  if (keyError) return keyError;
  const parsed = DocInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { error } = await admin.from(T.documents).insert(await toRow(admin, parsed.data));
  if (error) return jsonError('השמירה נכשלה: ' + error.message, 500);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const { admin, error: keyError } = await adminOrError(request);
  if (keyError) return keyError;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('מזהה מסמך חסר', 400);
  const parsed = DocInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { error } = await admin.from(T.documents).update(await toRow(admin, parsed.data)).eq('id', id);
  if (error) return jsonError('העדכון נכשל: ' + error.message, 500);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { admin, error: keyError } = await adminOrError(request);
  if (keyError) return keyError;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('מזהה מסמך חסר', 400);
  const { error } = await admin.from(T.documents).delete().eq('id', id);
  if (error) return jsonError('המחיקה נכשלה: ' + error.message, 500);
  return NextResponse.json({ success: true });
}

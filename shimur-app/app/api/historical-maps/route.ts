import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { T } from '@/lib/supabase/config';
import { getHistoricalMaps } from '@/lib/data';
import { adminOrError, jsonError, zodMessage } from '@/lib/api';

export async function GET() {
  return NextResponse.json({ maps: await getHistoricalMaps() });
}

const lat = z.number().min(29).max(34);
const lng = z.number().min(33).max(37);

const MapInput = z.object({
  title: z.string().trim().min(1, 'שם המפה חסר'),
  url: z.string().trim().url('קישור התמונה אינו תקין — הדביקי כתובת מלאה של קובץ תמונה'),
  year: z.string().trim().max(20).optional(),
  description: z.string().trim().max(1000).optional(),
  bounds: z.tuple([z.tuple([lat, lng]), z.tuple([lat, lng])]),
});

export async function POST(request: NextRequest) {
  const { admin, error: keyError } = adminOrError();
  if (keyError) return keyError;
  const parsed = MapInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const d = parsed.data;
  const { data, error } = await admin.from(T.historicalMaps)
    .insert({ title: d.title, url: d.url, year: d.year || null, description: d.description || null, bounds: d.bounds })
    .select('id, title, url, year, description, bounds').single();
  if (error) return jsonError('שמירת המפה נכשלה: ' + error.message, 500);
  return NextResponse.json({ success: true, map: data });
}

export async function DELETE(request: NextRequest) {
  const { admin, error: keyError } = adminOrError();
  if (keyError) return keyError;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonError('מזהה מפה חסר', 400);
  const { error } = await admin.from(T.historicalMaps).delete().eq('id', id);
  if (error) return jsonError('מחיקת המפה נכשלה: ' + error.message, 500);
  return NextResponse.json({ success: true });
}

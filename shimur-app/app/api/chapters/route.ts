import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { T } from '@/lib/supabase/config';
import { getFileId } from '@/lib/data/files';
import { adminOrError, jsonError, zodMessage } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityRegistryId = searchParams.get('city_registry_id');
  const chapterKey = searchParams.get('chapter_key');
  const admin = getAdminClient();
  if (!admin || !cityRegistryId || !chapterKey) return NextResponse.json({ content: {} });

  const fileId = await getFileId(admin, cityRegistryId);
  if (!fileId) return NextResponse.json({ content: {} });

  const { data, error } = await admin
    .from(T.chapters).select('content, status').eq('file_id', fileId).eq('chapter_key', chapterKey).maybeSingle();
  if (error) return jsonError('טעינת הפרק נכשלה: ' + error.message, 500);
  return NextResponse.json({ content: data?.content ?? {}, status: data?.status ?? 'ריק' });
}

const ChapterInput = z.object({
  city_registry_id: z.string().min(1, 'מספר רישום חסר'),
  chapter_key: z.string().min(1, 'מזהה פרק חסר'),
  chapter_title: z.string().optional(),
  content: z.record(z.string(), z.string().max(20000, 'שדה ארוך מדי')),
});

export async function POST(request: NextRequest) {
  const { admin, error: keyError } = await adminOrError(request);
  if (keyError) return keyError;

  const parsed = ChapterInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { city_registry_id, chapter_key, chapter_title, content } = parsed.data;

  const fileId = await getFileId(admin, city_registry_id);
  if (!fileId) return jsonError('האתר לא נמצא במאגר. רענני את הדף ונסי שוב.', 404);

  const values = Object.values(content);
  const filled = values.filter(v => v.trim()).length;
  const status = filled === 0 ? 'ריק' : filled === values.length ? 'מושלם' : 'בתהליך';
  const word_count = values.join(' ').split(/\s+/).filter(Boolean).length;

  const { error } = await admin.from(T.chapters).upsert(
    { file_id: fileId, chapter_key, title: chapter_title ?? chapter_key, content, status, word_count },
    { onConflict: 'file_id,chapter_key' },
  );
  if (error) return jsonError('השמירה נכשלה: ' + error.message, 500);

  // אתר שהחל בו תיעוד — מסומן "בתהליך"
  if (filled > 0) {
    await admin.from(T.buildings).update({ status: 'בתהליך' })
      .eq('city_registry_id', city_registry_id).eq('status', 'לא_התחיל');
  }
  return NextResponse.json({ success: true, status });
}

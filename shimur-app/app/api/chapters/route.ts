import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getOrCreateFile(admin: ReturnType<typeof getAdminClient>, city_registry_id: string, building_name: string, building_address: string) {
  const { data: building } = await admin
    .from('buildings')
    .upsert({ city_registry_id, name: building_name, address: building_address, status: 'בתהליך' }, { onConflict: 'city_registry_id' })
    .select('id')
    .single();
  if (!building) return null;

  const { data: existing } = await admin
    .from('documentation_files')
    .select('id')
    .eq('building_id', building.id)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: newFile } = await admin
    .from('documentation_files')
    .insert({ building_id: building.id, file_type: 'מבנה', created_by: SYSTEM_USER_ID })
    .select('id')
    .single();
  return newFile?.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return NextResponse.json({ content: {} });
    const { searchParams } = new URL(request.url);
    const city_registry_id = searchParams.get('city_registry_id');
    const chapter_key      = searchParams.get('chapter_key');
    if (!city_registry_id || !chapter_key) return NextResponse.json({ content: {} });

    const admin = getAdminClient();
    const { data: building } = await admin
      .from('buildings').select('id').eq('city_registry_id', city_registry_id).maybeSingle();
    if (!building) return NextResponse.json({ content: {} });

    const { data: file } = await admin
      .from('documentation_files').select('id').eq('building_id', building.id).maybeSingle();
    if (!file) return NextResponse.json({ content: {} });

    const { data: chapter } = await admin
      .from('chapters').select('content, status').eq('file_id', file.id).eq('chapter_key', chapter_key).maybeSingle();

    return NextResponse.json({ content: chapter?.content ?? {}, status: chapter?.status ?? 'ריק' });
  } catch {
    return NextResponse.json({ content: {} });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY חסר' }, { status: 500 });
    }

    const { city_registry_id, building_name, building_address, chapter_key, chapter_title, content } = await request.json();
    if (!city_registry_id || !chapter_key || !content) {
      return NextResponse.json({ error: 'נתונים חסרים' }, { status: 400 });
    }

    const admin = getAdminClient();
    const fileId = await getOrCreateFile(admin, city_registry_id, building_name, building_address);
    if (!fileId) return NextResponse.json({ error: 'שגיאה ביצירת תיק' }, { status: 500 });

    // Determine status
    const values = Object.values(content as Record<string, string>);
    const filled = values.filter(v => v?.trim()).length;
    const status = filled === 0 ? 'ריק' : filled === values.length ? 'מושלם' : 'בתהליך';

    const { error } = await admin
      .from('chapters')
      .upsert(
        { file_id: fileId, chapter_key, title: chapter_title ?? chapter_key, content, status, updated_at: new Date().toISOString() },
        { onConflict: 'file_id,chapter_key' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'שגיאה' }, { status: 500 });
  }
}

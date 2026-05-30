import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const city_registry_id = formData.get('city_registry_id') as string;
    const building_name    = formData.get('building_name') as string;
    const building_address = formData.get('building_address') as string;
    const location_desc    = formData.get('location_desc') as string;
    const notes            = formData.get('notes') as string;
    const photo            = formData.get('photo') as File | null;

    if (!location_desc?.trim()) {
      return NextResponse.json({ error: 'תיאור הממצא חסר' }, { status: 400 });
    }

    // 1. Upsert building into Supabase (demo buildings may not exist there yet)
    const { data: building, error: buildingError } = await getAdminClient()
      .from('buildings')
      .upsert({ city_registry_id, name: building_name, address: building_address, status: 'בתהליך' },
               { onConflict: 'city_registry_id', ignoreDuplicates: false })
      .select('id')
      .single();

    if (buildingError) {
      return NextResponse.json({ error: 'שגיאה ברישום המבנה: ' + buildingError.message }, { status: 500 });
    }

    // 2. Find or create documentation_file for this building
    let fileId: string;
    const { data: existingFile } = await getAdminClient()
      .from('documentation_files')
      .select('id')
      .eq('building_id', building.id)
      .single();

    if (existingFile) {
      fileId = existingFile.id;
    } else {
      const { data: newFile, error: fileError } = await getAdminClient()
        .from('documentation_files')
        .insert({ building_id: building.id, file_type: 'מבנה', created_by: SYSTEM_USER_ID })
        .select('id')
        .single();

      if (fileError) {
        return NextResponse.json({ error: 'שגיאה ביצירת תיק: ' + fileError.message }, { status: 500 });
      }
      fileId = newFile.id;
    }

    // 3. Upload photo to Storage if provided
    let photoIds: string[] = [];
    let photoUrl: string | null = null;

    if (photo && photo.size > 0) {
      const ext      = photo.name.split('.').pop() || 'jpg';
      const fileName = `${fileId}/${Date.now()}.${ext}`;
      const buffer   = Buffer.from(await photo.arrayBuffer());

      const { error: uploadError } = await getAdminClient().storage
        .from('findings-photos')
        .upload(fileName, buffer, { contentType: photo.type, upsert: false });

      if (!uploadError) {
        const { data: urlData } = getAdminClient().storage
          .from('findings-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;

        // Save photo record
        const { data: photoRecord } = await getAdminClient()
          .from('photos')
          .insert({ file_id: fileId, storage_path: fileName, storage_bucket: 'findings-photos', caption: notes })
          .select('id')
          .single();

        if (photoRecord) photoIds = [photoRecord.id];
      }
    }

    // 4. Save finding
    const { data: finding, error: findingError } = await getAdminClient()
      .from('findings')
      .insert({ file_id: fileId, location_desc, notes, photo_ids: photoIds })
      .select('id, location_desc, notes, created_at')
      .single();

    if (findingError) {
      return NextResponse.json({ error: 'שגיאה בשמירת הממצא: ' + findingError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, finding, photoUrl });

  } catch (err) {
    return NextResponse.json({ error: 'שגיאה לא צפויה' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city_registry_id = searchParams.get('city_registry_id');

  if (!city_registry_id) {
    return NextResponse.json({ findings: [] });
  }

  const { data: building } = await getAdminClient()
    .from('buildings')
    .select('id')
    .eq('city_registry_id', city_registry_id)
    .single();

  if (!building) return NextResponse.json({ findings: [] });

  const { data: file } = await getAdminClient()
    .from('documentation_files')
    .select('id')
    .eq('building_id', building.id)
    .single();

  if (!file) return NextResponse.json({ findings: [] });

  const { data: findings } = await getAdminClient()
    .from('findings')
    .select('id, location_desc, notes, created_at')
    .eq('file_id', file.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ findings: findings || [] });
}

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const BUCKET = 'findings-photos';

async function ensureBucket() {
  const admin = getAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    await admin.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check env vars
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY חסר — הוסיפי אותו ב-Vercel Environment Variables' }, { status: 500 });
    }

    const formData = await request.formData();
    const city_registry_id = formData.get('city_registry_id') as string;
    const building_name    = formData.get('building_name') as string;
    const building_address = formData.get('building_address') as string;
    const location_desc    = formData.get('location_desc') as string;
    const notes            = formData.get('notes') as string;
    const photo            = formData.get('photo') as File | null;

    if (!location_desc?.trim()) {
      return NextResponse.json({ error: 'מיקום הממצא חסר' }, { status: 400 });
    }

    const admin = getAdminClient();

    // 1. Upsert building
    const { data: building, error: buildingError } = await admin
      .from('buildings')
      .upsert(
        { city_registry_id, name: building_name, address: building_address, status: 'בתהליך' },
        { onConflict: 'city_registry_id' }
      )
      .select('id')
      .single();

    if (buildingError || !building) {
      return NextResponse.json({ error: 'שגיאה ברישום המבנה: ' + (buildingError?.message ?? 'לא נמצא') }, { status: 500 });
    }

    // 2. Find or create documentation_file
    let fileId: string;
    const { data: existingFile } = await admin
      .from('documentation_files')
      .select('id')
      .eq('building_id', building.id)
      .maybeSingle();

    if (existingFile) {
      fileId = existingFile.id;
    } else {
      const { data: newFile, error: fileError } = await admin
        .from('documentation_files')
        .insert({ building_id: building.id, file_type: 'מבנה', created_by: SYSTEM_USER_ID })
        .select('id')
        .single();

      if (fileError || !newFile) {
        return NextResponse.json({ error: 'שגיאה ביצירת תיק: ' + (fileError?.message ?? '') }, { status: 500 });
      }
      fileId = newFile.id;
    }

    // 3. Upload photo
    let photoIds: string[] = [];
    if (photo && photo.size > 0) {
      try {
        await ensureBucket();
        const ext      = photo.name.split('.').pop() || 'jpg';
        const fileName = `${fileId}/${Date.now()}.${ext}`;
        const buffer   = Buffer.from(await photo.arrayBuffer());

        const { error: uploadError } = await admin.storage
          .from(BUCKET)
          .upload(fileName, buffer, { contentType: photo.type });

        if (!uploadError) {
          const { data: photoRecord } = await admin
            .from('photos')
            .insert({ file_id: fileId, storage_path: fileName, storage_bucket: BUCKET, caption: notes })
            .select('id')
            .single();
          if (photoRecord) photoIds = [photoRecord.id];
        }
      } catch (_) {
        // Photo upload failure is non-fatal — still save the finding
      }
    }

    // 4. Save finding
    const { data: finding, error: findingError } = await admin
      .from('findings')
      .insert({ file_id: fileId, location_desc, notes: notes || null, photo_ids: photoIds })
      .select('id, location_desc, notes, created_at')
      .single();

    if (findingError || !finding) {
      return NextResponse.json({ error: 'שגיאה בשמירת הממצא: ' + (findingError?.message ?? '') }, { status: 500 });
    }

    return NextResponse.json({ success: true, finding });

  } catch (err: any) {
    return NextResponse.json({ error: 'שגיאה: ' + (err?.message ?? String(err)) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ findings: [] });
    }

    const { searchParams } = new URL(request.url);
    const city_registry_id = searchParams.get('city_registry_id');
    if (!city_registry_id) return NextResponse.json({ findings: [] });

    const admin = getAdminClient();

    const { data: building } = await admin
      .from('buildings')
      .select('id')
      .eq('city_registry_id', city_registry_id)
      .maybeSingle();

    if (!building) return NextResponse.json({ findings: [] });

    const { data: file } = await admin
      .from('documentation_files')
      .select('id')
      .eq('building_id', building.id)
      .maybeSingle();

    if (!file) return NextResponse.json({ findings: [] });

    const { data: findings } = await admin
      .from('findings')
      .select('id, location_desc, notes, created_at')
      .eq('file_id', file.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ findings: findings || [] });
  } catch {
    return NextResponse.json({ findings: [] });
  }
}

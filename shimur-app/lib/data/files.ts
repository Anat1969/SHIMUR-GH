import type { SupabaseClient } from '@supabase/supabase-js';
import { T, SUPABASE_URL, FINDINGS_BUCKET } from '@/lib/supabase/config';

/** מזהה תיק התיעוד של אתר לפי מספר הרישום העירוני. יוצר תיק אם חסר. */
export async function getFileId(admin: SupabaseClient, cityRegistryId: string): Promise<string | null> {
  const { data: building, error: bErr } = await admin
    .from(T.buildings).select('id, is_complex').eq('city_registry_id', cityRegistryId).maybeSingle();
  if (bErr) console.error('[files] building lookup:', bErr.message);
  if (!building) return null;

  const { data: file } = await admin.from(T.files).select('id').eq('building_id', building.id).maybeSingle();
  if (file) return file.id as string;

  const { data: created, error } = await admin
    .from(T.files)
    .insert({ building_id: building.id, file_type: building.is_complex ? 'מתחם' : 'מבנה' })
    .select('id')
    .single();
  if (error) console.error('[files] create file:', error.message);
  return (created?.id as string | undefined) ?? null;
}

export function photoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${FINDINGS_BUCKET}/${storagePath}`;
}

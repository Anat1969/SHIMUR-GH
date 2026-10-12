import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, getServiceRoleKey } from './config';

let _admin: SupabaseClient | null = null;

/** לקוח שרת עם הרשאות כתיבה. מחזיר null כשהמפתח חסר. */
export function getAdminClient(): SupabaseClient | null {
  const key = getServiceRoleKey();
  if (!key) return null;
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return _admin;
}

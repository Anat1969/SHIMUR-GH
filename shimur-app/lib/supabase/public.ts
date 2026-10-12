import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';

let _public: SupabaseClient | null = null;

/** לקוח קריאה בלבד (מפתח פומבי, כפוף ל-RLS). */
export function getPublicClient(): SupabaseClient {
  if (!_public) {
    _public = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _public;
}

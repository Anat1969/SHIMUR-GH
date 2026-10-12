import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ZodError } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { MISSING_KEY_ERROR, T } from '@/lib/supabase/config';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** לקוח כתיבה, או תגובת שגיאה ברורה אם המפתח לא הוגדר */
export function adminOrError(): { admin: SupabaseClient; error?: undefined } | { admin?: undefined; error: NextResponse } {
  const admin = getAdminClient();
  if (!admin) return { error: jsonError(MISSING_KEY_ERROR, 503) };
  return { admin };
}

export function zodMessage(err: ZodError): string {
  return err.issues.map(i => i.message).join(' · ');
}

/** מספר אתר (site_no) → מזהה רשומה במאגר */
export async function siteDbId(admin: SupabaseClient, siteNo: string): Promise<string | null> {
  const n = Number(siteNo);
  if (!Number.isInteger(n)) return null;
  const { data } = await admin.from(T.buildings).select('id').eq('site_no', n).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

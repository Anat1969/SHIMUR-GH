import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ZodError } from 'zod';
import { getAdminClient } from '@/lib/supabase/admin';
import { MISSING_KEY_ERROR, T } from '@/lib/supabase/config';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** העורך המחובר (קישור כניסה אישי, או אסימון Supabase ורשימת shimur_admins), או null */
export async function editorFromRequest(request: Request): Promise<{ email: string } | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  // קישור כניסה אישי: המפתח שמור בדפדפן ונבדק מול הגיבוב במאגר. העורכת חייבת להיות ברשימת המורשים.
  const key = request.headers.get('x-editor-key');
  if (key) {
    const hash = createHash('sha256').update(key).digest('hex');
    const { data: k } = await admin.from(T.editorKeys).select('email').eq('key_hash', hash).is('revoked_at', null).maybeSingle();
    const keyEmail = (k?.email as string | undefined)?.toLowerCase();
    if (keyEmail) {
      const { data: row } = await admin.from(T.admins).select('email').eq('email', keyEmail).maybeSingle();
      if (row) return { email: keyEmail };
    }
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return null;
  const { data: row } = await admin.from(T.admins).select('email').eq('email', email).maybeSingle();
  return row ? { email } : null;
}

/** לקוח כתיבה לעורך מורשה בלבד, או תגובת שגיאה ברורה */
export async function adminOrError(request: Request): Promise<{ admin: SupabaseClient; error?: undefined } | { admin?: undefined; error: NextResponse }> {
  const admin = getAdminClient();
  if (!admin) return { error: jsonError(MISSING_KEY_ERROR, 503) };
  const editor = await editorFromRequest(request);
  if (!editor) return { error: jsonError('נדרשת כניסה כעורכת של יחידת השימור. לחצי "כניסה לעריכה" ונסי שוב.', 401) };
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

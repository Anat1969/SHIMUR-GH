'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';

let _browser: SupabaseClient | null = null;

/** לקוח דפדפן — לכניסה בלבד. קריאת נתונים וכתיבה עוברות דרך השרת. */
export function getBrowserClient(): SupabaseClient {
  if (!_browser) {
    _browser = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'shimur-auth' },
    });
  }
  return _browser;
}

/** fetch שמצרף את אסימון הכניסה — לכל פעולת כתיבה */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await getBrowserClient().auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  const key = getEditorKey();
  if (key) headers.set('x-editor-key', key);
  return fetch(input, { ...init, headers });
}

const EDITOR_KEY = 'shimur-editor-key';

/** מפתח קישור הכניסה האישי, אם נשמר בדפדפן הזה */
export function getEditorKey(): string | null {
  try { return localStorage.getItem(EDITOR_KEY); } catch { return null; }
}

export function setEditorKey(key: string | null) {
  try {
    if (key) localStorage.setItem(EDITOR_KEY, key);
    else localStorage.removeItem(EDITOR_KEY);
  } catch { /* הדפדפן חוסם אחסון: הכניסה תחזיק עד סגירת הדף */ }
}

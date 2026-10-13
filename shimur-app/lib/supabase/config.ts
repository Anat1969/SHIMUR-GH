// חיבור לפרויקט ASHDODMAP ב-Supabase.
// כתובת ומפתח פומבי — ציבוריים מעצם הגדרתם (מוגנים ב-RLS: קריאה בלבד).
// מפתח service role — רק ממשתני סביבה, רק בשרת.

export const SUPABASE_URL =
  process.env.ASHDODMAP_SUPABASE_URL ?? 'https://cbhexpybdggwzyakgagd.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.ASHDODMAP_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_1KSwG6rqTzBSHmI2RxX6Fw_EEcuKzk3';

export function getServiceRoleKey(): string | undefined {
  return process.env.ASHDODMAP_SERVICE_ROLE_KEY;
}

export const FINDINGS_BUCKET = 'shimur-findings';
/** תמונות אתרים שהעורכת מעלה (דלי ציבורי, כתיבה רק מהשרת) */
export const SITE_IMAGES_BUCKET = 'shimur-site-images';

export const T = {
  buildings: 'shimur_buildings',
  files: 'shimur_documentation_files',
  chapters: 'shimur_chapters',
  findings: 'shimur_findings',
  photos: 'shimur_photos',
  routes: 'shimur_routes',
  routeSites: 'shimur_route_sites',
  documents: 'shimur_documents',
  historicalMaps: 'shimur_historical_maps',
  admins: 'shimur_admins',
} as const;

export const MISSING_KEY_ERROR =
  'שמירה אינה זמינה: חסר המפתח ASHDODMAP_SERVICE_ROLE_KEY בהגדרות Vercel. הוסיפי אותו ופרסי מחדש.';

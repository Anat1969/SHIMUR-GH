# SHIMUR.ASHDOD — הקמה והפעלה

## מאגר הנתונים

הנתונים נמצאים בפרויקט **ASHDODMAP** ב-Supabase (`cbhexpybdggwzyakgagd`).
הפרויקט משותף עם אפליקציות אחרות, ולכן כל טבלאות השימור בקידומת `shimur_`:

| טבלה | תוכן | קריאה ציבורית |
|------|------|---------------|
| `shimur_buildings` | 14 אתרי השימור | כן |
| `shimur_routes`, `shimur_route_sites` | מסלולי סיור | כן (ציבוריים בלבד) |
| `shimur_documents` | קישורים, הערות, גלריה | כן |
| `shimur_historical_maps` | שכבות מפה היסטוריות | כן |
| `shimur_documentation_files`, `shimur_chapters`, `shimur_findings`, `shimur_photos` | תיקי תיעוד וממצאי שטח | לא — רק דרך השרת |

תמונות ממצאים: bucket `shimur-findings`.

קבצי ההקמה: `supabase/migrations/` (סכמה ותיקוני עובדות) ו-`supabase/seed/` (נתוני פתיחה).

## משתני סביבה (Vercel)

| משתנה | חובה | הערה |
|-------|------|------|
| `ASHDODMAP_SERVICE_ROLE_KEY` | לשמירה | Supabase → ASHDODMAP → Project Settings → API Keys → `service_role`. בלעדיו האתר מוצג, אך שמירה חסומה עם הודעה ברורה |
| `ASHDODMAP_SUPABASE_URL` | לא | ברירת מחדל: כתובת ASHDODMAP |
| `ASHDODMAP_SUPABASE_PUBLISHABLE_KEY` | לא | ברירת מחדל: המפתח הפומבי של ASHDODMAP |

המשתנים הישנים (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) הצביעו על SHIMUR-SB ואינם בשימוש עוד.

## גיבוי

אם המאגר אינו זמין, האפליקציה מציגה את נתוני הגיבוי שב-`lib/demo/` ופס הודעה צהוב. המצגת לעולם לא נשברת.

## הרצה מקומית

```bash
npm install
npm run dev
```

## מצב מצגת

`/tour` — סיור מודרך במסך מלא. `/tour?route=route-1` — סיור במסלול. `/tour?site=5` — פתיחה באתר מסוים.
מקשים: חיצים, F למסך מלא, P לניגון אוטומטי, Esc ליציאה.

## עריכה: עורכים בלבד

- קריאה: ציבורית. כתיבה (פרקים, ממצאים, מסלולים, מסמכים, מפות): רק למי שמחובר עם Google והאימייל שלו בטבלה `shimur_admins`.
- הוספת עורך: `INSERT INTO shimur_admins (email) VALUES ('name@example.com');` (באותיות קטנות).
- הפעלה חד-פעמית ב-Supabase (ASHDODMAP):
  1. Authentication → Sign In / Providers → Google: להפעיל ולהזין Client ID ו-Secret מ-Google Cloud Console (OAuth client מסוג Web, עם Redirect URI: `https://cbhexpybdggwzyakgagd.supabase.co/auth/v1/callback`).
  2. Authentication → URL Configuration → Redirect URLs: להוסיף `https://shimur-gh-fnng.vercel.app/**` ו-`https://*-shtanat5-gmailcoms-projects.vercel.app/**`.
- עד ההפעלה: האתר מוצג במלואו, וכפתור "כניסה לעריכה" מציג הודעה ברורה.

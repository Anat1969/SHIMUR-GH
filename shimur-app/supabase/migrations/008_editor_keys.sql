-- קישור כניסה אישי לעורכת, בלי סיסמה (באישור ענת, 13.10.2026).
-- נשמר רק גיבוב (sha256) של המפתח. המפתח עצמו נמצא רק בקישור של העורכת.
-- המפתח נותן הרשאת עריכה באפליקציית השימור בלבד (דרך ה-API בשרת), לא כניסה לחשבון במאגר.
-- ביטול: למלא revoked_at. אין מדיניות RLS ללקוח: קריאה רק מהשרת (service role).
create table if not exists shimur_editor_keys (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  key_hash text not null unique,
  label text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table shimur_editor_keys enable row level security;

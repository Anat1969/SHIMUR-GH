-- שדות רשימת הוועדה לשימור אתרים 2016 — כולם אופציונליים, בלי שינוי במזהים קיימים
-- גיבוי הפיך לפני השינוי. לשחזור: TRUNCATE לא נדרש, אפשר UPDATE מטבלת הגיבוי לפי site_no
CREATE TABLE IF NOT EXISTS shimur_buildings_backup_20261012 AS SELECT * FROM shimur_buildings;
ALTER TABLE shimur_buildings_backup_20261012 ENABLE ROW LEVEL SECURITY;

ALTER TABLE shimur_buildings
  ADD COLUMN IF NOT EXISTS committee_no TEXT,
  ADD COLUMN IF NOT EXISTS list_status TEXT CHECK (list_status IN ('committee_2016','texture','archaeology','added_by_plan')),
  ADD COLUMN IF NOT EXISTS statutory_ref TEXT,
  ADD COLUMN IF NOT EXISTS coords_approx BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_conflict TEXT,
  ADD COLUMN IF NOT EXISTS components TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_note TEXT,
  ADD COLUMN IF NOT EXISTS grade_note TEXT;

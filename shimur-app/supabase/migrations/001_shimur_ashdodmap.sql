-- SHIMUR.ASHDOD — מאגר הנתונים בפרויקט ASHDODMAP
-- הפרויקט משותף עם אפליקציות אחרות, לכן כל הטבלאות בקידומת shimur_
-- קריאה ציבורית: אתרים, מסלולים, מפות היסטוריות, מסמכים
-- כתיבה: רק דרך השרת (service role) — אין מדיניות כתיבה ל-anon

-- ===== אתרים =====
CREATE TABLE IF NOT EXISTS shimur_buildings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_no               INTEGER NOT NULL UNIQUE,
  city_registry_id      TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  address               TEXT NOT NULL DEFAULT '',
  neighborhood          TEXT,
  parcel                TEXT,
  is_complex            BOOLEAN NOT NULL DEFAULT false,
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  year_built            INTEGER,
  year_built_verified   BOOLEAN NOT NULL DEFAULT false,
  architect             TEXT,
  architect_verified    BOOLEAN NOT NULL DEFAULT false,
  style                 TEXT,
  historical_periods    TEXT[] NOT NULL DEFAULT '{}',
  protection_level      TEXT CHECK (protection_level IN ('א','ב','ג','מונומנט')),
  floors                INTEGER,
  total_built_area      NUMERIC,
  construction_type     TEXT,
  documentation_reason  TEXT,
  owner                 TEXT,
  current_use           TEXT,
  original_use          TEXT,
  building_type         TEXT,
  preservation_reasons  TEXT[] NOT NULL DEFAULT '{}',
  priority_level        TEXT CHECK (priority_level IN ('גבוהה','בינונית','נמוכה')),
  full_description      TEXT,
  additional_info       TEXT,
  iaa_reference         TEXT,
  gov_sources           TEXT[] NOT NULL DEFAULT '{}',
  image_url             TEXT,
  image_old_url         TEXT,
  status                TEXT NOT NULL DEFAULT 'לא_התחיל'
                        CHECK (status IN ('לא_התחיל','בתהליך','הוגש','אושר','הוחזר')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== תיקי תיעוד =====
CREATE TABLE IF NOT EXISTS shimur_documentation_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL UNIQUE REFERENCES shimur_buildings(id) ON DELETE CASCADE,
  file_type       TEXT NOT NULL DEFAULT 'מבנה' CHECK (file_type IN ('מבנה','מתחם')),
  phase           TEXT NOT NULL DEFAULT 'ארכיון'
                  CHECK (phase IN ('ארכיון','סיור','מדידות','חומרים','כתיבה','הגשה')),
  completion_pct  INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shimur_chapters (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id      UUID NOT NULL REFERENCES shimur_documentation_files(id) ON DELETE CASCADE,
  chapter_key  TEXT NOT NULL,
  title        TEXT NOT NULL,
  content      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'ריק' CHECK (status IN ('ריק','בתהליך','מושלם')),
  word_count   INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (file_id, chapter_key)
);

CREATE TABLE IF NOT EXISTS shimur_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id         UUID NOT NULL REFERENCES shimur_documentation_files(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  storage_bucket  TEXT NOT NULL DEFAULT 'shimur-findings',
  caption         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shimur_findings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id        UUID NOT NULL REFERENCES shimur_documentation_files(id) ON DELETE CASCADE,
  location_desc  TEXT NOT NULL,
  notes          TEXT,
  photo_ids      UUID[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== מסלולים =====
CREATE TABLE IF NOT EXISTS shimur_routes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  theme        TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shimur_route_sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id        UUID NOT NULL REFERENCES shimur_routes(id) ON DELETE CASCADE,
  building_id     UUID NOT NULL REFERENCES shimur_buildings(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL,
  narrative_text  TEXT,
  UNIQUE (route_id, position)
);

-- ===== מסמכים, קישורים וגלריה =====
CREATE TABLE IF NOT EXISTS shimur_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind         TEXT NOT NULL CHECK (kind IN ('link','note','image')),
  title        TEXT NOT NULL,
  url          TEXT,
  note         TEXT,
  building_id  UUID REFERENCES shimur_buildings(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== מפות היסטוריות (שכבות על המפה) =====
CREATE TABLE IF NOT EXISTS shimur_historical_maps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  year         TEXT,
  description  TEXT,
  -- [[south, west], [north, east]]
  bounds       JSONB NOT NULL DEFAULT '[[31.76, 34.60], [31.84, 34.70]]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shimur_chapters_file  ON shimur_chapters(file_id);
CREATE INDEX IF NOT EXISTS idx_shimur_findings_file  ON shimur_findings(file_id);
CREATE INDEX IF NOT EXISTS idx_shimur_photos_file    ON shimur_photos(file_id);
CREATE INDEX IF NOT EXISTS idx_shimur_route_sites_r  ON shimur_route_sites(route_id);
CREATE INDEX IF NOT EXISTS idx_shimur_route_sites_b  ON shimur_route_sites(building_id);
CREATE INDEX IF NOT EXISTS idx_shimur_documents_b    ON shimur_documents(building_id);

-- ===== updated_at =====
CREATE OR REPLACE FUNCTION shimur_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_shimur_buildings_touch ON shimur_buildings;
CREATE TRIGGER trg_shimur_buildings_touch BEFORE UPDATE ON shimur_buildings
  FOR EACH ROW EXECUTE FUNCTION shimur_touch_updated_at();
DROP TRIGGER IF EXISTS trg_shimur_files_touch ON shimur_documentation_files;
CREATE TRIGGER trg_shimur_files_touch BEFORE UPDATE ON shimur_documentation_files
  FOR EACH ROW EXECUTE FUNCTION shimur_touch_updated_at();
DROP TRIGGER IF EXISTS trg_shimur_chapters_touch ON shimur_chapters;
CREATE TRIGGER trg_shimur_chapters_touch BEFORE UPDATE ON shimur_chapters
  FOR EACH ROW EXECUTE FUNCTION shimur_touch_updated_at();
DROP TRIGGER IF EXISTS trg_shimur_routes_touch ON shimur_routes;
CREATE TRIGGER trg_shimur_routes_touch BEFORE UPDATE ON shimur_routes
  FOR EACH ROW EXECUTE FUNCTION shimur_touch_updated_at();

-- ===== RLS =====
ALTER TABLE shimur_buildings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_documentation_files  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_chapters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_photos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_findings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_routes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_route_sites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_documents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE shimur_historical_maps      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shimur_buildings_read ON shimur_buildings;
CREATE POLICY shimur_buildings_read ON shimur_buildings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS shimur_routes_read ON shimur_routes;
CREATE POLICY shimur_routes_read ON shimur_routes FOR SELECT TO anon, authenticated USING (is_public);
DROP POLICY IF EXISTS shimur_route_sites_read ON shimur_route_sites;
CREATE POLICY shimur_route_sites_read ON shimur_route_sites FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM shimur_routes r WHERE r.id = route_id AND r.is_public));
DROP POLICY IF EXISTS shimur_documents_read ON shimur_documents;
CREATE POLICY shimur_documents_read ON shimur_documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS shimur_historical_maps_read ON shimur_historical_maps;
CREATE POLICY shimur_historical_maps_read ON shimur_historical_maps FOR SELECT TO anon, authenticated USING (true);
-- תיקים, פרקים, ממצאים ותמונות: ללא מדיניות — נגישים רק ל-service role דרך השרת

-- ===== אחסון תמונות ממצאים =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('shimur-findings', 'shimur-findings', true)
ON CONFLICT (id) DO NOTHING;

-- טבלאות פרטיות: לא נגישות כלל ל-anon/authenticated (גם לא ב-GraphQL)
REVOKE ALL ON shimur_documentation_files, shimur_chapters, shimur_findings, shimur_photos FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON shimur_buildings, shimur_routes, shimur_route_sites, shimur_documents, shimur_historical_maps FROM anon, authenticated;

-- עורכים: כתיבה מותרת רק למי שהאימייל שלו כאן (נבדק בשרת)
CREATE TABLE IF NOT EXISTS shimur_admins (
  email TEXT PRIMARY KEY CHECK (email = lower(email)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE shimur_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON shimur_admins FROM anon, authenticated;
INSERT INTO shimur_admins (email) VALUES ('shtanat5@gmail.com') ON CONFLICT DO NOTHING;

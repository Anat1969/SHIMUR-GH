-- SHIMUR.ASHDOD — סכמת בסיס נתונים מלאה
-- גרסה 2.0 | Supabase PostgreSQL
-- הרץ ב: Supabase Dashboard → SQL Editor

-- =======================================
-- EXTENSIONS
-- =======================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================
-- PROFILES
-- =======================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('architect','reviewer','manager')),
  phone           TEXT,
  license_number  TEXT,
  license_expiry  DATE,
  id_number       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =======================================
-- BUILDINGS
-- =======================================
CREATE TABLE buildings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- זיהוי
  city_registry_id      TEXT UNIQUE NOT NULL,
  registry_card_number  TEXT,
  name                  TEXT NOT NULL,
  address               TEXT NOT NULL,
  neighborhood          TEXT,
  taba                  TEXT,
  parcel                TEXT,
  is_complex            BOOLEAN NOT NULL DEFAULT false,

  -- מיקום
  lat                   DECIMAL(10,8),
  lng                   DECIMAL(11,8),
  elevation             NUMERIC,
  geocoded_at           TIMESTAMPTZ,

  -- היסטוריה
  year_built            INTEGER CHECK (year_built > 1800 AND year_built <= EXTRACT(YEAR FROM NOW())::INTEGER),
  year_built_source     TEXT,
  year_built_verified   BOOLEAN DEFAULT false,
  architect             TEXT,
  architect_source      TEXT,
  architect_verified    BOOLEAN DEFAULT false,
  style                 TEXT,
  historical_periods    TEXT[] DEFAULT '{}',

  -- שימור
  protection_level      TEXT CHECK (protection_level IN ('א','ב','ג','מונומנט')),
  protection_source     TEXT,

  -- מבנה
  floors                INTEGER,
  total_built_area      NUMERIC,
  lot_area              NUMERIC,
  construction_type     TEXT,

  -- תיעוד
  documentation_reason  TEXT,
  initiator             TEXT,
  owner                 TEXT,
  current_use           TEXT,
  original_use          TEXT,
  surveyor              TEXT,
  surveyor_license      TEXT,
  surveyor_date         DATE,

  -- JSON fields
  statutory_plans       JSONB DEFAULT '[]',
  historical_maps       JSONB DEFAULT '[]',

  -- מערכת
  status                TEXT NOT NULL CHECK (status IN (
    'לא_התחיל','בתהליך','הוגש','אושר','הוחזר'
  )) DEFAULT 'לא_התחיל',
  assigned_architect    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_buildings_status          ON buildings(status);
CREATE INDEX idx_buildings_assigned        ON buildings(assigned_architect);
CREATE INDEX idx_buildings_neighborhood    ON buildings(neighborhood);
CREATE INDEX idx_buildings_protection      ON buildings(protection_level);
CREATE INDEX idx_buildings_geo             ON buildings(lat, lng) WHERE lat IS NOT NULL;

-- =======================================
-- DOCUMENTATION FILES
-- =======================================
CREATE TABLE documentation_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  file_type       TEXT NOT NULL CHECK (file_type IN ('מבנה','מתחם')) DEFAULT 'מבנה',
  version         INTEGER NOT NULL DEFAULT 1,
  phase           TEXT NOT NULL CHECK (phase IN (
    'ארכיון','סיור','מדידות','חומרים','כתיבה','הגשה'
  )) DEFAULT 'ארכיון',
  completion_pct  INTEGER NOT NULL DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES profiles(id),
  reviewer_notes  TEXT,
  return_reason   TEXT,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_building    ON documentation_files(building_id);
CREATE INDEX idx_files_created_by  ON documentation_files(created_by);
CREATE INDEX idx_files_submitted   ON documentation_files(submitted_at) WHERE submitted_at IS NOT NULL;

-- =======================================
-- CHAPTERS
-- =======================================
CREATE TABLE chapters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id         UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,
  chapter_key     TEXT NOT NULL,
  title           TEXT NOT NULL,
  content         JSONB DEFAULT '{}',
  status          TEXT NOT NULL CHECK (status IN ('ריק','בתהליך','מושלם')) DEFAULT 'ריק',
  ai_draft        TEXT,
  word_count      INTEGER DEFAULT 0,
  last_edited_by  UUID REFERENCES profiles(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(file_id, chapter_key)
);

-- תיק מבנה — פרקים תקינים
-- א_נתונים_כלליים, ב_נתונים_סטטוטוריים, ג_תיעוד_היסטורי,
-- ד_נתונים_אורבניים, ה_תיעוד_אדריכלי_וצילומי, ו_תיעוד_טכנולוגי,
-- ז_סיכום_והמלצות, ח_מקורות, ט_הצהרת_מתעד

-- תיק מתחמי — פרקים תקינים
-- א_נתונים_כלליים, ב_נתונים_סטטוטוריים, ג_ניתוח_טופוגרפי,
-- ד_תולדות_השכונה_והמתחם, ה_היסטוריה_קרטוגרפית,
-- ו_תיעוד_אדריכלי_מצב_קיים, ז_תיעוד_צילומי,
-- ח_סיכום_ערכים_והמלצות, ט_מקורות, י_הצהרת_מתעד

CREATE INDEX idx_chapters_file      ON chapters(file_id);
CREATE INDEX idx_chapters_status    ON chapters(status);

-- =======================================
-- COMPLEX BUILDINGS (מבנים בתוך מתחם)
-- =======================================
CREATE TABLE complex_buildings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id             UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,
  building_code       TEXT NOT NULL,
  name                TEXT NOT NULL,
  year_built          INTEGER,
  year_built_notes    TEXT,
  architect           TEXT,
  style               TEXT,
  floors              INTEGER,
  current_use         TEXT,
  original_use        TEXT,
  preservation_level  TEXT CHECK (preservation_level IN (
    'מונומנט_עם_הוראות_מיוחדות',
    'שימור_עם_תוספות_אפשריות',
    'שימור_ללא_תוספות',
    'ללא_שימור',
    'מומלץ_להריסה'
  )),
  values_assessment   JSONB NOT NULL DEFAULT '{
    "historical_cultural": {"level": null, "summary": ""},
    "architectural":       {"level": null, "summary": ""},
    "urban_environmental": {"level": null, "summary": ""},
    "social_community":    {"level": null, "summary": ""},
    "team_recommendation": null
  }',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(file_id, building_code)
);

CREATE INDEX idx_complex_buildings_file ON complex_buildings(file_id);

-- =======================================
-- FINDINGS (ממצאי שטח)
-- =======================================
CREATE TABLE findings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id               UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,
  complex_building_id   UUID REFERENCES complex_buildings(id) ON DELETE SET NULL,

  -- מיקום
  location_desc         TEXT NOT NULL,
  location_floor        INTEGER,
  location_zone         TEXT,

  -- חומר
  material              TEXT CHECK (material IN (
    'אבן_כורכר','אבן_ירושלמית','טיח_גיר','טיח_צמנט',
    'בטון','עץ','ברזל_יצוק','פסיפס','אריחי_טרצו',
    'שיש','גבס','קרמיקה','אחר'
  )),
  material_notes        TEXT,

  -- נזק
  damage_type           TEXT CHECK (damage_type IN (
    'סדקים','ניתוק_טיח','מיצוי_מלחים','גרנוליזציה',
    'קורוזיה','פגיעה_ביולוגית','ניתוק_גושים',
    'שחיקה','ואנדליזם','ריקבון_עץ','רטיבות','אחר'
  )),
  damage_severity       TEXT CHECK (damage_severity IN (
    'קריטי','משמעותי','קל','תקין','שינוי_מאוחר'
  )),
  dimensions            TEXT,

  -- המלצה
  notes                 TEXT,
  treatment_recommendation TEXT,
  urgency               TEXT CHECK (urgency IN (
    'מיידי','תוך_שנה','בינוני_טווח','תחזוקה'
  )),

  -- AI
  ai_suggestion         TEXT,

  -- תמונות
  photo_ids             UUID[] DEFAULT '{}',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_findings_file      ON findings(file_id);
CREATE INDEX idx_findings_severity  ON findings(damage_severity);

-- =======================================
-- PHOTOS
-- =======================================
CREATE TABLE photos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id               UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,
  complex_building_id   UUID REFERENCES complex_buildings(id) ON DELETE SET NULL,

  storage_path          TEXT NOT NULL,
  storage_bucket        TEXT NOT NULL DEFAULT 'photos',
  thumbnail_path        TEXT,

  caption               TEXT,
  direction             TEXT CHECK (direction IN (
    'צפון','דרום','מזרח','מערב','צפון-מזרח','צפון-מערב',
    'דרום-מזרח','דרום-מערב','פנים','אוויר','מאקרו','אחר'
  )),
  floor                 INTEGER,
  zone                  TEXT,
  scale_present         BOOLEAN DEFAULT false,
  photo_date            DATE,
  sequence_num          INTEGER,
  key_map_ref           TEXT,
  is_cover              BOOLEAN DEFAULT false,

  ai_tags               TEXT[] DEFAULT '{}',
  exif_data             JSONB DEFAULT '{}',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_file        ON photos(file_id);
CREATE INDEX idx_photos_direction   ON photos(direction);

-- =======================================
-- DOCUMENTER DECLARATIONS (חובה חוקית)
-- =======================================
CREATE TABLE documenter_declarations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id               UUID NOT NULL REFERENCES documentation_files(id) ON DELETE CASCADE,

  documenter_id_num     TEXT NOT NULL,
  documenter_name       TEXT NOT NULL,
  profession            TEXT NOT NULL DEFAULT 'אדריכל',
  license_number        TEXT,

  site_name             TEXT NOT NULL,
  chapters_documented   TEXT[] NOT NULL DEFAULT '{}',

  training_date         DATE,
  signature_date        DATE NOT NULL,
  signature_image_path  TEXT,

  is_primary            BOOLEAN NOT NULL DEFAULT false,
  co_documenters        JSONB NOT NULL DEFAULT '[]',
  -- [{name, id_num, profession, license, chapters}]

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(file_id, documenter_id_num)
);

CREATE INDEX idx_declarations_file ON documenter_declarations(file_id);

-- =======================================
-- AGENT LOG
-- =======================================
CREATE TABLE agent_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID REFERENCES documentation_files(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  agent_type  TEXT NOT NULL CHECK (agent_type IN (
    'field','writer','gap','knowledge','values'
  )),
  input_text  TEXT,
  output_text TEXT,
  model       TEXT DEFAULT 'claude-sonnet-4-6',
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_log_file     ON agent_log(file_id);
CREATE INDEX idx_agent_log_user     ON agent_log(user_id);
CREATE INDEX idx_agent_log_type     ON agent_log(agent_type);

-- =======================================
-- KNOWLEDGE BASE
-- =======================================
CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL CHECK (category IN (
    'תקן','חוק','ארכיון','מינוח','שיטת_טיפול','חומר','כלי'
  )),
  subcategory TEXT,
  title       TEXT NOT NULL,
  content     TEXT,
  url         TEXT,
  tags        TEXT[] DEFAULT '{}',
  language    TEXT DEFAULT 'he',
  verified    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_tags     ON knowledge_base USING GIN(tags);

-- =======================================
-- ROW LEVEL SECURITY
-- =======================================
ALTER TABLE buildings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_files     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters                ENABLE ROW LEVEL SECURITY;
ALTER TABLE complex_buildings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documenter_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_log               ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base          ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Buildings
CREATE POLICY buildings_architect ON buildings FOR ALL
  USING (
    assigned_architect = auth.uid() OR
    get_user_role() IN ('reviewer','manager')
  );

CREATE POLICY buildings_reviewer ON buildings FOR SELECT
  USING (
    get_user_role() = 'reviewer' AND
    status IN ('הוגש','אושר','הוחזר')
  );

CREATE POLICY buildings_manager ON buildings FOR ALL
  USING (get_user_role() = 'manager');

-- Documentation files
CREATE POLICY files_architect ON documentation_files FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY files_reviewer ON documentation_files FOR SELECT
  USING (
    get_user_role() = 'reviewer' AND
    submitted_at IS NOT NULL
  );

CREATE POLICY files_reviewer_update ON documentation_files FOR UPDATE
  USING (
    get_user_role() = 'reviewer' AND
    submitted_at IS NOT NULL
  );

CREATE POLICY files_manager ON documentation_files FOR ALL
  USING (get_user_role() = 'manager');

-- Knowledge base — public read
CREATE POLICY knowledge_read ON knowledge_base FOR SELECT USING (true);
CREATE POLICY knowledge_write ON knowledge_base FOR ALL
  USING (get_user_role() = 'manager');

-- =======================================
-- FUNCTIONS & TRIGGERS
-- =======================================

-- עדכון completion_pct אוטומטי
CREATE OR REPLACE FUNCTION update_file_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_chapters INTEGER;
  completed_chapters INTEGER;
  pct INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_chapters
  FROM chapters WHERE file_id = NEW.file_id;

  SELECT COUNT(*) INTO completed_chapters
  FROM chapters WHERE file_id = NEW.file_id AND status = 'מושלם';

  IF total_chapters > 0 THEN
    pct := ROUND((completed_chapters::NUMERIC / total_chapters) * 100);
  ELSE
    pct := 0;
  END IF;

  UPDATE documentation_files
  SET completion_pct = pct, updated_at = now()
  WHERE id = NEW.file_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_completion
  AFTER INSERT OR UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_file_completion();

-- עדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buildings_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER files_updated_at
  BEFORE UPDATE ON documentation_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- יצירה אוטומטית של פרופיל עם רישום
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'משתמש חדש'), 'architect');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =======================================
-- ROUTES — מסלולי סיור
-- =======================================
CREATE TABLE routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  theme           TEXT,
  cover_image_url TEXT,
  created_by      UUID REFERENCES profiles(id),
  is_public       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE route_sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id        UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  building_id     UUID NOT NULL REFERENCES buildings(id),
  position        INTEGER NOT NULL,
  narrative_text  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_sites_route ON route_sites(route_id);
CREATE INDEX idx_route_sites_building ON route_sites(building_id);

CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS — routes
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public routes visible to all" ON routes
  FOR SELECT USING (is_public = true);

CREATE POLICY "Creator manages own routes" ON routes
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Manager manages all routes" ON routes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY "Route sites visible with route" ON route_sites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE id = route_id AND (is_public = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Creator manages route sites" ON route_sites
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM routes
      WHERE id = route_id AND created_by = auth.uid()
    )
  );

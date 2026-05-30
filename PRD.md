# SHIMUR.ASHDOD — מסמך דרישות מוצר
## גרסה 2.0 | מבוסס על שני תיקי תיעוד אמיתיים

> תיק מבנה: המלך ג'ורג' 5, ירושלים (ארד-סימון, 2021)
> תיק מתחמי: גמנסיה עברית רחביה (ארד-סימון + ציפשטיין, 2023)

---

## 01 | זהות המוצר

### שם
**SHIMUR.ASHDOD** — מערכת ניהול מורשת בנויה, עיריית אשדוד

### עיקרון מרכזי
המערכת תומכת בשני סוגי תיקים:
- **תיק מבנה** — מבנה בודד, 9 פרקים
- **תיק מתחמי** — קמפוס / מתחם מרובה מבנים, 10 פרקים

כל ממשק, זרימה ובסיס נתונים בנויים סביב ההבחנה הזו.

### זהות עיצובית
```
פלטה:
  --stone:        #C8B89A   אבן כורכר
  --stone-dark:   #8B7355   אבן כהה
  --stone-light:  #EDE0CC   אבן בהירה
  --ink:          #1A1410   דיו
  --ink-soft:     #3D3228   דיו רך
  --parchment:    #F7F0E3   קלף
  --parchment-deep: #EDE3D0 קלף עמוק
  --rust:         #8B3A1E   חלודה
  --rust-light:   #C4582A   חלודה בהירה
  --sage:         #4A5C45   מרווה
  --sage-light:   #7A9174   מרווה בהירה

גופנים:
  ממשק:     Heebo (300, 400, 500, 700)
  כותרות:   Playfair Display (400, 700)

כיוון: RTL מלא. dir="rtl" על body.
ללא אייקונים דקורטיביים. טקסט ונתון בלבד.
```

---

## 02 | Stack טכנולוגי

```
Frontend     Next.js 14 App Router + TypeScript strict
Styling      Tailwind CSS (custom design tokens)
Database     Supabase (PostgreSQL + RLS)
Auth         Supabase Auth (3 roles)
Storage      Supabase Storage (תמונות, מסמכים, קבצי CAD)
AI           Claude API — claude-sonnet-4-6 (4 agents)
Map          Leaflet.js + OpenStreetMap tiles (חינמי)
Geocoding    Nominatim API (OSM) — כתובות ישראל
PDF          react-pdf (ייצוא תיק להגשה)
Validation   Zod (כל Server Action)
Git          GitHub (branches per building)
Deploy       Vercel (CI/CD auto from GitHub)
```

---

## 03 | סכמת בסיס נתונים — מלאה

### טבלת מבנים
```sql
CREATE TABLE buildings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- זיהוי
  city_registry_id      TEXT UNIQUE NOT NULL,   -- מספר ברשימת השימור
  registry_card_number  TEXT,                   -- מספר בכרטסת שימור
  name                  TEXT NOT NULL,
  address               TEXT NOT NULL,
  neighborhood          TEXT,
  taba                  TEXT,                   -- גוש
  parcel                TEXT,                   -- חלקה
  is_complex            BOOLEAN DEFAULT false,   -- מתחם או מבנה בודד

  -- מיקום
  lat                   DECIMAL(10,8),
  lng                   DECIMAL(11,8),
  elevation             NUMERIC,                -- גובה מפני הים (מ')
  geocoded_at           TIMESTAMPTZ,

  -- היסטוריה
  year_built            INTEGER,
  year_built_source     TEXT,
  year_built_verified   BOOLEAN DEFAULT false,
  architect             TEXT,
  architect_source      TEXT,
  architect_verified    BOOLEAN DEFAULT false,
  style                 TEXT,
  historical_periods    TEXT[],                 -- ['מנדטורי','ישראלי_קדום']

  -- סטטוס שימור
  protection_level      TEXT CHECK (protection_level IN ('א','ב','ג','מונומנט')),
  protection_source     TEXT,                   -- 'תב"ע 2097', 'ועדה 14/2019'

  -- נתוני מבנה
  floors                INTEGER,
  total_built_area      NUMERIC,               -- שטח בנוי קיים מ"ר
  lot_area              NUMERIC,               -- שטח המגרש מ"ר
  construction_type     TEXT,                  -- 'עמוד-קורה', 'קירות נושאים'

  -- תיעוד
  documentation_reason  TEXT,                  -- סיבת עריכת התיק
  initiator             TEXT,                  -- יזם / בעלים
  owner                 TEXT,
  current_use           TEXT,
  original_use          TEXT,
  surveyor              TEXT,
  surveyor_license      TEXT,
  surveyor_date         DATE,

  -- תוכניות בניין עיר (JSON)
  statutory_plans       JSONB,
  -- [{name, approval_date, zone, max_floors, building_rights_pct, notes}]

  -- מפות היסטוריות (JSON)
  historical_maps       JSONB,
  -- [{year, source, storage_path, description}]

  -- סטטוס מערכת
  status                TEXT CHECK (status IN (
                          'לא_התחיל','בתהליך','הוגש','אושר','הוחזר'
                        )) DEFAULT 'לא_התחיל',
  assigned_architect    UUID REFERENCES profiles(id),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_buildings_architect ON buildings(assigned_architect);
CREATE INDEX idx_buildings_registry ON buildings(city_registry_id);
```

### פרופילי משתמשים
```sql
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  role          TEXT CHECK (role IN ('architect','reviewer','manager')),
  phone         TEXT,
  license_number TEXT,                -- רישיון אדריכל
  license_expiry DATE,
  id_number     TEXT,                 -- ת.ז. — לטופס הצהרת מתעד
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### תיקי תיעוד
```sql
CREATE TABLE documentation_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID REFERENCES buildings(id) ON DELETE CASCADE,
  file_type       TEXT CHECK (file_type IN ('מבנה','מתחם')) DEFAULT 'מבנה',
  version         INTEGER DEFAULT 1,
  phase           TEXT CHECK (phase IN (
                    'ארכיון','סיור','מדידות','חומרים','כתיבה','הגשה'
                  )) DEFAULT 'ארכיון',
  completion_pct  INTEGER DEFAULT 0,  -- מחושב אוטומטית
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES profiles(id),
  reviewer_notes  TEXT,
  return_reason   TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### פרקי התיק
```sql
-- תיק מבנה בודד: 9 פרקים
-- תיק מתחמי: 10 פרקים
CREATE TABLE chapters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID REFERENCES documentation_files(id) ON DELETE CASCADE,
  chapter_key TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     JSONB,
  status      TEXT CHECK (status IN ('ריק','בתהליך','מושלם')) DEFAULT 'ריק',
  ai_draft    TEXT,
  word_count  INTEGER DEFAULT 0,
  last_edited_by UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  UNIQUE(file_id, chapter_key)
);

-- chapter_key מותר — תיק מבנה:
--   א_נתונים_כלליים
--   ב_נתונים_סטטוטוריים
--   ג_תיעוד_היסטורי
--   ד_נתונים_אורבניים
--   ה_תיעוד_אדריכלי_וצילומי
--   ו_תיעוד_טכנולוגי
--   ז_סיכום_והמלצות
--   ח_מקורות
--   ט_הצהרת_מתעד

-- chapter_key מותר — תיק מתחמי:
--   א_נתונים_כלליים
--   ב_נתונים_סטטוטוריים
--   ג_ניתוח_טופוגרפי
--   ד_תולדות_השכונה_והמתחם
--   ה_היסטוריה_קרטוגרפית
--   ו_תיעוד_אדריכלי_מצב_קיים
--   ז_תיעוד_צילומי
--   ח_סיכום_ערכים_והמלצות
--   ט_מקורות
--   י_הצהרת_מתעד
```

### מבנים בתוך מתחם
```sql
CREATE TABLE complex_buildings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id             UUID REFERENCES documentation_files(id) ON DELETE CASCADE,
  building_code       TEXT NOT NULL,         -- 'א-1', 'ג-3', 'ד-1'
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
  values_assessment   JSONB NOT NULL DEFAULT '{}',
  -- {
  --   historical_cultural: {level: 'גבוה'|'בינוני'|'נמוך', summary: '...'},
  --   architectural:       {level: 'גבוה'|'בינוני'|'נמוך', summary: '...'},
  --   urban_environmental: {level: 'גבוה'|'בינוני'|'נמוך', summary: '...'},
  --   social_community:    {level: 'גבוה'|'בינוני'|'נמוך', summary: '...'},
  --   team_recommendation: 'לכלול ברשימה' | 'לנקות תוספות' | 'לאפשר הריסה'
  -- }
  sort_order          INTEGER,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

### ממצאי שטח
```sql
CREATE TABLE findings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id         UUID REFERENCES documentation_files(id) ON DELETE CASCADE,
  complex_building_id UUID REFERENCES complex_buildings(id),
  location_desc   TEXT NOT NULL,
  location_floor  INTEGER,
  location_zone   TEXT,
  material        TEXT CHECK (material IN (
    'אבן_כורכר','אבן_ירושלמית','טיח_גיר','טיח_צמנט',
    'בטון','עץ','ברזל_יצוק','פסיפס','אריחי_טרצו','שיש','אחר'
  )),
  material_notes  TEXT,
  damage_type     TEXT CHECK (damage_type IN (
    'סדקים','ניתוק_טיח','מיצוי_מלחים','גרנוליזציה',
    'קורוזיה','פגיעה_ביולוגית','ניתוק_גושים','שחיקה','ואנדליזם','אחר'
  )),
  damage_severity TEXT CHECK (damage_severity IN (
    'קריטי','משמעותי','קל','תקין','שינוי_מאוחר'
  )),
  dimensions      TEXT,
  notes           TEXT,
  treatment_recommendation TEXT,
  urgency         TEXT CHECK (urgency IN ('מיידי','תוך_שנה','בינוני_טווח','תחזוקה')),
  ai_suggestion   TEXT,
  photo_ids       UUID[],
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### תמונות
```sql
CREATE TABLE photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id         UUID REFERENCES documentation_files(id) ON DELETE CASCADE,
  complex_building_id UUID REFERENCES complex_buildings(id),
  storage_path    TEXT NOT NULL,
  storage_bucket  TEXT DEFAULT 'photos',
  caption         TEXT,
  direction       TEXT CHECK (direction IN (
    'צפון','דרום','מזרח','מערב','פנים','אוויר','מאקרו','אחר'
  )),
  floor           INTEGER,
  zone            TEXT,
  scale_present   BOOLEAN DEFAULT false,
  photo_date      DATE,
  sequence_num    INTEGER,
  key_map_ref     TEXT,                  -- 'תוכנית קומה א, נקודה 3'
  is_cover        BOOLEAN DEFAULT false,
  ai_tags         TEXT[],               -- זוהה ע"י Claude Vision
  exif_data       JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### הצהרת מתעד — חובה חוקית
```sql
CREATE TABLE documenter_declarations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id             UUID REFERENCES documentation_files(id) ON DELETE CASCADE,
  documenter_id_num   TEXT NOT NULL,             -- ת.ז.
  documenter_name     TEXT NOT NULL,
  profession          TEXT NOT NULL DEFAULT 'אדריכל',
  license_number      TEXT,
  chapters_documented TEXT[] NOT NULL,           -- ['ג_תיעוד_היסטורי','ה_תיעוד_אדריכלי']
  training_date       DATE,
  signature_date      DATE NOT NULL,
  signature_image     TEXT,                      -- storage path לחתימה
  is_primary          BOOLEAN DEFAULT false,
  co_documenters      JSONB DEFAULT '[]',
  -- [{name, id_num, profession, chapters}]
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

### יומן סוכן AI
```sql
CREATE TABLE agent_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     UUID REFERENCES documentation_files(id),
  user_id     UUID REFERENCES profiles(id),
  agent_type  TEXT CHECK (agent_type IN ('field','writer','gap','knowledge','values')),
  input_text  TEXT,
  output_text TEXT,
  model       TEXT DEFAULT 'claude-sonnet-4-6',
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### מאגר ידע
```sql
CREATE TABLE knowledge_base (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT CHECK (category IN (
    'תקן','חוק','ארכיון','מינוח','שיטת_טיפול','חומר','כלי'
  )),
  subcategory TEXT,
  title       TEXT NOT NULL,
  content     TEXT,
  url         TEXT,
  tags        TEXT[],
  language    TEXT DEFAULT 'he',
  verified    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security
```sql
-- אדריכל: רק המבנים שלו
CREATE POLICY architect_own_buildings ON buildings
  FOR ALL USING (assigned_architect = auth.uid());

CREATE POLICY architect_own_files ON documentation_files
  FOR ALL USING (created_by = auth.uid());

-- פקיד: רק תיקים שהוגשו
CREATE POLICY reviewer_submitted_files ON documentation_files
  FOR SELECT USING (
    submitted_at IS NOT NULL AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'reviewer')
  );

CREATE POLICY reviewer_buildings ON buildings
  FOR SELECT USING (
    status IN ('הוגש','אושר','הוחזר') AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'reviewer')
  );

-- מנהל: הכל
CREATE POLICY manager_all_buildings ON buildings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
  );

CREATE POLICY manager_all_files ON documentation_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'manager')
  );
```

---

## 04 | מפת עמודים — גישה ישירה לכל URL

```
/                                      בחינת כניסה + מסך login
/map                                   מפת כל המבנים (Leaflet)
/buildings                             רשימת כלל המבנים
/buildings/[id]                        דף מבנה ראשי
/buildings/[id]/file                   תיק התיעוד (כל הפרקים)
/buildings/[id]/file/[chapter]         פרק ספציפי
/buildings/[id]/findings               ממצאי שטח
/buildings/[id]/photos                 גלריה שיטתית
/buildings/[id]/values                 טבלת ערכים (מתחם)
/buildings/[id]/declaration            הצהרת מתעד
/buildings/[id]/export                 ייצוא PDF

/dashboard                             הפנייה לפי role
/dashboard/manager                     מנהל — מבט עירוני מלא
/dashboard/reviewer                    פקיד — תיקים לאישור
/dashboard/architect                   אדריכל — הפרויקטים שלי

/field                                 מצב שטח (mobile-first)
/field/[building_id]                   סיור פעיל

/knowledge                             מאגר מידע
/knowledge/standards                   תקנים ואמנות
/knowledge/archives                    ארכיונים ומקורות
/knowledge/materials                   חומרים ונזקים
/knowledge/terminology                 מילון מינוח
/knowledge/tools                       כלים מקצועיים

/agent                                 שאילתה חופשית לסוכן
/admin                                 ניהול משתמשים (manager)
/admin/import                          ייבוא רשימת שימור
```

---

## 05 | פרקי התיק — תוכן מלא

### תיק מבנה — 9 פרקים

```javascript
const BUILDING_CHAPTERS = [
  {
    key: 'א_נתונים_כלליים',
    title: 'נתונים כלליים — מצב קיים',
    required_fields: [
      'parcel_info',          // גוש + חלקה + שטח + כתובת
      'building_description', // תיאור האתר
      'ownership',            // בעלות
      'current_use',
      'total_built_area',
      'documentation_reason', // סיבת עריכת התיק
      'initiator',
      'planner_details',      // פרטי המתכנן
      'site_maps',            // מפות סביבה
      'aerial_photo'          // תצ"א
    ]
  },
  {
    key: 'ב_נתונים_סטטוטוריים',
    title: 'נתונים סטטוטוריים — מצב קיים',
    required_fields: [
      'registry_card_number', // מספר בכרטסת שימור
      'statutory_plans',      // רשימת תוכניות (תב"ע)
      'zoning',               // ייעוד
      'max_floors',
      'building_rights_pct',
      'existing_built_area',
      'plan_maps',            // תשריטי תוכניות
      'preservation_plans'    // תוכניות שמופיע בהן לשימור
    ]
  },
  {
    key: 'ג_תיעוד_היסטורי',
    title: 'תיעוד היסטורי',
    required_fields: [
      'neighborhood_history',
      'timeline',             // [{year, event, source, verified}]
      'historical_context',
      'historical_photos',    // תצלומים היסטוריים
      'unverified_items'      // פירוט מה לא אומת
    ]
  },
  {
    key: 'ד_נתונים_אורבניים',
    title: 'נתונים אורבניים שכונתיים',
    required_fields: [
      'traffic_diagram',      // דיאגרמת תנועה
      'preservation_map',     // מפת שימור עירונית
      'street_facade_plan',   // חזית רחוב 1:200
      'aerial_photo',         // תצ"א עדכנית
      'neighboring_buildings' // מבנים לשימור ברדיוס 200מ'
    ]
  },
  {
    key: 'ה_תיעוד_אדריכלי_וצילומי',
    title: 'תיעוד אדריכלי וצילומי',
    required_fields: [
      'survey_map',           // מפת מדידה (1:250)
      'site_plan',            // תשריט סביבה (1:1250)
      'development_analysis', // ניתוח התפתחות המבנה
      'style_analysis',       // ניתוח סגנון + תיאור חזיתות
      'floor_plans',          // תוכניות קומות 1:100
      'facades',              // חזיתות 1:100
      'sections',             // חתכים 1:100
      'details',              // פרטים 1:20
      'photos_exterior',
      'photos_interior',
      'photos_macro',
      'photo_key_maps'        // מפות מפתח לכיווני צילום
    ]
  },
  {
    key: 'ו_תיעוד_טכנולוגי',
    title: 'תיעוד טכנולוגי',
    required_fields: [
      'structural_report',    // דוח חברת מיפוי/קונסטרוקציה
      'construction_type',
      'ceiling_types',
      'facade_cladding',      // חיפויי חזיתות לפי אזור ועיבוד
      'balcony_types',        // [{type, construction, railing, condition}]
      'staircases',
      'carpentry_doors',      // נגרות — דלתות
      'carpentry_windows',    // נגרות — חלונות
      'carpentry_frames',     // משקופים ואלמנטים מעץ
      'metalwork',            // מסגרות ומעקות
      'finishing_materials'   // חומרי גמר: ריצוף, ספי שיש
    ]
  },
  {
    key: 'ז_סיכום_והמלצות',
    title: 'סיכום, הערכת אתר והמלצות',
    required_fields: [
      'summary',
      'significance',         // {historical, architectural, community}
      'values_assessment',    // 4 ממדים × נמוך/בינוני/גבוה
      'recommendations',      // רשימת המלצות לשימור
      'not_for_change',       // מה אסור לשנות
      'allowed_changes'       // מה מותר
    ]
  },
  {
    key: 'ח_מקורות',
    title: 'מקורות',
    required_fields: [
      'bibliography',         // ספרות
      'archives',             // ארכיונים
      'websites',             // אתרי אינטרנט
      'interviews',           // עדויות בעל פה
      'aerial_sources'        // מקורות תצ"א
    ]
  },
  {
    key: 'ט_הצהרת_מתעד',
    title: 'טופס הצהרת המתעד',
    required_fields: [
      'documenter_id',        // ת.ז.
      'documenter_name',
      'profession',
      'site_name',
      'chapters_documented',
      'training_date',
      'signature_date',
      'signature_image',
      'co_documenters'
    ]
  }
]
```

### תיק מתחמי — 10 פרקים

```javascript
const COMPLEX_CHAPTERS = [
  { key: 'א_נתונים_כלליים',            title: 'נתונים כלליים — מצב קיים' },
  // כולל: כתובת, גוש+חלקות, בעלות לכל חלקה,
  //        מיפוי מבני המתחם עם קודים (א-1, ב-1...), שטח כולל

  { key: 'ב_נתונים_סטטוטוריים',        title: 'נתונים סטטוטוריים' },
  // כולל: כל התוכניות החלות, מה חל על כל חלקה, מונומנטים מיוחדים

  { key: 'ג_ניתוח_טופוגרפי',           title: 'ניתוח טופוגרפי' },
  // חדש! גבעות, קווי גובה, קשר בינוי-טופוגרפיה, מבטים היסטוריים

  { key: 'ד_תולדות_השכונה_והמתחם',     title: 'תולדות השכונה והמתחם' },
  // היסטוריה משולבת: שכונה + התפתחות המתחם לאורך הזמן

  { key: 'ה_היסטוריה_קרטוגרפית',       title: 'היסטוריה קרטוגרפית' },
  // חדש! מפות לאורך הזמן — כשכבות על Leaflet

  { key: 'ו_תיעוד_אדריכלי_מצב_קיים',  title: 'תיעוד אדריכלי — מצב קיים' },
  // תוכנית טופוגרפית + חתכים של כל המתחם

  { key: 'ז_תיעוד_צילומי',             title: 'תיעוד צילומי' },
  // גלריה לכל מבנה בנפרד, ממוספרת עם מפות מפתח

  { key: 'ח_סיכום_ערכים_והמלצות',      title: 'סיכום ערכים והמלצות' },
  // טבלת ערכים × 4 ממדים לכל מבנה במתחם

  { key: 'ט_מקורות',                   title: 'מקורות מידע' },
  { key: 'י_הצהרת_מתעד',               title: 'טופס הצהרת המתעד' }
]
```

---

## 06 | מסלולי משתמש

### אדריכלת שטח

**פתיחת תיק חדש**
```
/dashboard/architect
  → בחר מבנה מהרשימה שהוקצתה
  → /buildings/[id]
  → "פתח תיק תיעוד"
  → בחר סוג: [מבנה בודד] | [מתחם]
    אם מתחם → הוסף מבנים (קוד + שם)
  → מערכת יוצרת את כל הפרקים בסטטוס 'ריק'
  → סוכן: "מצאתי נתונים ממקורות ציבוריים. נתחיל?"
```

**סיור שטח (mobile-first)**
```
/field/[building_id]
  ↓
[צלם]          [הקלט]         [הקלד]
    ↓               ↓               ↓
Claude Vision   תמלול קולי     טקסט חופשי
מנתח חומר+נזק  → ממצא מובנה   → סוכן מבנה
    ↓
הצעת סיווג:
"גרנוליזציה, חומרה: משמעותי"
[אשר] [ערוך] [ממקם על תוכנית]
    ↓
שמירה מיידית — ללא מילוי שדות מינימלי
```

**כתיבת פרק**
```
/buildings/[id]/file/[chapter]
  
  פאנל ימני: עורך (Markdown RTL)
  פאנל שמאלי: נתונים שנאספו
  
  [סוכן: צור טיוטה]
    → Claude כותב פרק מלא בעברית אקדמית
    → מסמן ספקולציות ב-[לאמת]
    → מציג רשימת חסרים
  
  שמירה אוטומטית כל 30 שניות
  
  פאנל תחתון (מתקפל):
    "מה חסר לפרק זה"
    [קפוץ לחוסר] — לא כופה
```

**טבלת ערכים — מתחם**
```
/buildings/[id]/values
  
  טבלה אינטראקטיבית:
  | מבנה | שנה | אדריכל | היסטורי | אדריכלי | אורבני | חברתי | המלצה |
  
  כל תא לחיץ → drawer עם:
    [נמוך] [בינוני] [גבוה]
    + שדה טקסט לנימוק
  
  [סוכן: הצע ערכים ראשוניים]
    → Claude מנתח ממצאים ומציע ציונים
    → האדריכל מאשר / מתקן
```

**הצהרת מתעד**
```
/buildings/[id]/declaration
  
  טופס פורמלי:
  - ת.ז. מתעד ראשי (autofill מפרופיל)
  - שם מלא (autofill)
  - שם האתר (autofill)
  - מקצוע
  - פרקים שבוצעו (checkbox לכל פרק)
  - מתעדים נוספים + + +
  - תאריך הכשרה
  - תאריך חתימה + חתימה דיגיטלית
  
  [ייצא לPDF חתום]
    → נכלל אוטומטית בפרק ט/י בייצוא הכולל
```

---

### פקיד ועדה

```
/dashboard/reviewer
  → רשימה: "ממתינים (7)" | "בטיפול (3)" | "הוחזרו (2)"
  
/buildings/[id]/file
  → סטטוס 9 פרקים — ירוק/צהוב/אדום
  → "פרקים קריטיים לדיון: ב, ה, ז, ט"
  → כל פרק: קריאה + הוספת הערה

  [אשר] → הודעה לאדריכל + מנהל
  [החזר] → חובה: סיבות מפורטות → הודעה
  [ייצא PDF לפרוטוקול]

  שאילתה לסוכן (בהקשר תיק):
    "מה חסר לפי תקן ICOMOS?"
    "השווה לתיקים שאושרו"
    "מה רמת הסיכון לפי הממצאים?"
```

---

### ראש יחידת שימור

```
/dashboard/manager
  
  מדדים:
  [X מבנים ברשימה] [Y בתהליך] [Z הוגשו] [W אושרו] [V לא התחילו]
  
  מפת אשדוד (Leaflet):
  → נקודה צבעונית לפי סטטוס
  → לחיצה → פופאפ + [פתח תיק]
  → שכבת מפות היסטוריות (toggle)
  
  טבלת אדריכלים:
  → שם | פרויקטים פעילים | הוגש החודש | ממוצע ימים
  
  התראות אוטומטיות:
  → "X מבנים בסיכון ללא תיק פעיל"
  → "תיק Y לא עודכן 30 יום"
  
  /admin/import → ייבוא CSV רשימת שימור
  /admin/assignments → גרור-שחרר: מבנה ← אדריכל
  
  [דוח רבעוני] → Claude מייצר PDF לראש העיר
```

---

## 07 | מפה — Leaflet + OpenStreetMap + Nominatim

```javascript
// lib/map/geocoding.ts
export async function geocodeAddress(address: string) {
  const q = encodeURIComponent(`${address}, אשדוד, ישראל`)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { headers: { 'User-Agent': 'shimur-ashdod/2.0 (contact@ashdod.muni.il)' } }
  )
  const [result] = await res.json()
  return result
    ? { lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    : null
}

// צבעי סמנים
const STATUS_COLORS: Record<string, string> = {
  'לא_התחיל': '#8B7355',
  'בתהליך':   '#C4582A',
  'הוגש':     '#4A5C45',
  'אושר':     '#1A1410',
  'הוחזר':    '#8B3A1E',
}

// שכבות מפות היסטוריות (תיק מתחמי)
// כל מפה היסטורית: {year, storage_path, opacity, bounds}
// נטענת כ-ImageOverlay על Leaflet
```

---

## 08 | סוכני AI — 5 סוכנים

### סוכן 1 — שטח (Field Agent)
```
role: עוזר בסיור שטח — קצר, מהיר, ספציפי
context: מצב הפרויקט + ממצאים קיימים

input:  תמונה | קול | טקסט
output: ממצא מובנה {location, material, damage_type, severity, treatment}

rules:
  - תשובות ≤ 3 משפטים
  - שאלת הבהרה אחת בלבד אם חסר מידע קריטי
  - הצע פרוטוקול טיפול לפי ICOMOS
  - אל תמציא מיקום — שאל

trigger: כל קלט בעמוד /field
```

### סוכן 2 — כותב פרקים (Chapter Writer)
```
role: כתיבת טיוטות פרקים בעברית אקדמית-מקצועית
context: נתוני הפרק + ממצאים + מקורות

output: טיוטת פרק מלאה + רשימת [לאמת]

rules:
  - כתיבה תיאורית, לא שיפוטית
  - כל עובדה → מקור ממוספר
  - ספקולציה → [לאמת: ...]
  - אסור: "מדהים", "יפהפה", "ישן"
  - מותר: "נבנה בשנת X", "ערך אדריכלי גבוה"
  - בסוף: "נדרש לאימות: [רשימה]"

trigger: כפתור "סוכן: צור טיוטה" בעמוד פרק
```

### סוכן 3 — מאתר פערים (Gap Detector)
```
role: בדיקת שלמות התיק לפני הגשה
context: project_state מלא

output: JSON {
  critical_missing: [...],
  important_missing: [...],
  optional_missing: [...],
  completion_pct: N,
  ready_for_submission: boolean,
  blocking_reason: string | null,
  estimated_hours_remaining: N
}

trigger: אוטומטי כל שמירה + כפתור "בדוק שלמות"
```

### סוכן 4 — יועץ מאגר (Knowledge Agent)
```
role: מומחה שימור — תקנים, חוק, חומרים, ארכיונים
context: שאלת המשתמש

topics:
  - ICOMOS, אמנת ונציה, אמנת בורה
  - חוק התכנון והבנייה, חוק העתיקות
  - ארכיונים: מה לחפש, מספרי תיקים
  - חומרים: זיהוי, נזקים, טיפולים
  - מינוח מקצועי

rules:
  - תמיד ציין מקור
  - אם לא בטוח — אמור
  - המלץ על ארכיון ספציפי לכל שאלה

trigger: /agent + שאילתות בכל דף
```

### סוכן 5 — מעריך ערכים (Values Agent) — חדש
```
role: הצעת ציוני ערך לשימור לפי ממצאים
context: נתוני מבנה + ממצאים + תיעוד היסטורי

output: הצעת ערכים {
  historical_cultural: {level, rationale},
  architectural:       {level, rationale},
  urban_environmental: {level, rationale},
  social_community:    {level, rationale},
  recommendation:      string
}

trigger: כפתור "סוכן: הצע ערכים" בעמוד טבלת ערכים
```

---

## 09 | מבנה תיקיות הפרויקט

```
ashdod-shimur/
├── app/
│   ├── (auth)/login/
│   └── (app)/
│       ├── map/
│       ├── buildings/
│       │   └── [id]/
│       │       ├── page.tsx
│       │       ├── file/
│       │       │   ├── page.tsx
│       │       │   └── [chapter]/page.tsx
│       │       ├── findings/page.tsx
│       │       ├── photos/page.tsx
│       │       ├── values/page.tsx       ← חדש
│       │       ├── declaration/page.tsx  ← חדש
│       │       └── export/page.tsx
│       ├── dashboard/
│       │   ├── manager/page.tsx
│       │   ├── reviewer/page.tsx
│       │   └── architect/page.tsx
│       ├── field/[building_id]/page.tsx
│       ├── knowledge/
│       │   ├── standards/
│       │   ├── archives/
│       │   ├── materials/
│       │   ├── terminology/
│       │   └── tools/
│       ├── agent/page.tsx
│       └── admin/
│           ├── page.tsx
│           ├── import/page.tsx
│           └── assignments/page.tsx
│
├── components/
│   ├── map/
│   │   ├── BuildingsMap.tsx
│   │   ├── BuildingMarker.tsx
│   │   └── HistoricalMapLayer.tsx  ← חדש
│   ├── file/
│   │   ├── ChapterEditor.tsx
│   │   ├── ChapterStatusBar.tsx
│   │   ├── FindingCard.tsx
│   │   └── ProgressPanel.tsx
│   ├── values/
│   │   ├── ValuesTable.tsx          ← חדש
│   │   └── ValueCell.tsx           ← חדש
│   ├── declaration/
│   │   └── DeclarationForm.tsx     ← חדש
│   ├── field/
│   │   ├── FieldCamera.tsx
│   │   ├── VoiceRecorder.tsx
│   │   └── FindingQuick.tsx
│   ├── agent/
│   │   ├── AgentChat.tsx
│   │   └── AgentSuggestion.tsx
│   └── ui/
│       ├── StatusBadge.tsx
│       ├── SmartNav.tsx
│       └── RtlEditor.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── claude/
│   │   ├── agents/
│   │   │   ├── field.ts
│   │   │   ├── writer.ts
│   │   │   ├── gap.ts
│   │   │   ├── knowledge.ts
│   │   │   └── values.ts
│   │   └── prompts/
│   │       └── [agent].ts
│   ├── map/
│   │   ├── geocoding.ts
│   │   └── layers.ts
│   └── pdf/
│       ├── export.ts
│       └── declaration.ts
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql      ← SCHEMA.sql מהמסמך הנפרד
│   └── seed/
│       └── 001_data.sql         ← SEED.sql מהמסמך הנפרד
│
├── uploads/                     ← רשימת שימור אשדוד (CSV/PDF)
│
├── CLAUDE.md
├── PRD.md
├── SCHEMA.sql
├── SEED.sql
└── README.md
```

---

## 10 | ייצוא PDF

### פורמט תיק מבנה
```
עמוד 1:         דף פנים (שם, כתובת, מתכנן, תאריך)
עמודים 2-3:     תקציר מנהלים
לפי פרקים א-ח:  כל פרק ממוספר
עמוד אחרון:     טופס הצהרת מתעד + חתימה
```

### פורמט PDF לפרוטוקול ועדה (מקוצר)
```
עמוד 1:   נתונים כלליים + סטטוטוריים
עמוד 2:   סיכום ממצאים + טבלת ערכים
עמוד 3:   המלצות + הצהרת מתעד
```

---

## 11 | ייבוא רשימת שימור אשדוד

```javascript
// /admin/import — תהליך ייבוא CSV
// שלב 1: טעינת הקובץ
// שלב 2: מיפוי עמודות (drag-drop headers)
// שלב 3: זיהוי אוטומטי מבנה/מתחם
// שלב 4: geocoding אוטומטי (Nominatim)
// שלב 5: אישור + ייבוא ל-Supabase

// מבנה CSV מצופה:
// city_registry_id, name, address, neighborhood,
// protection_level, year_built, architect, style

// אחרי ייבוא:
// כל מבנה מקבל status='לא_התחיל'
// ממתין להקצאה לאדריכל
```

---

## 12 | CLAUDE.md — הנחיות לסוכן Claude Code

```markdown
# SHIMUR.ASHDOD — הנחיות לסוכן Claude Code

## זהות הפרויקט
מערכת ניהול תיקי תיעוד שימור למורשת הבנויה של אשדוד.
שני סוגי תיקים: מבנה בודד (9 פרקים) / מתחמי (10 פרקים).
שלושה משתמשים: אדריכל שטח, פקיד ועדה, ראש יחידה.

## כלל עבודה ראשון
לפני כל פעולה — קרא את הקובץ הרלוונטי. אל תדמיין מבנה.
אם קוד נכשל — תקן לפי השגיאה בפועל, לא לפי הנחה.

## כללי קוד
- TypeScript strict — אין 'any'
- עברית RTL בכל ממשק
- Tailwind בלבד לסטיילינג
- Zod validation לכל Server Action
- RLS מוגדר לפני כל שאילתה
- פלטת צבעים מ-CSS variables בלבד

## כללי עיצוב
- Heebo לממשק, Playfair Display לכותרות
- כפתורים: padding גדול, נגיש
- שגיאות: בעברית, ספציפיות, עם הצעת פעולה
- ניווט: breadcrumbs בכל דף, SmartNav מציע לא כופה

## כללי בסיס נתונים
- כל טבלה — בדוק RLS לפני שאילתה
- JSON fields — validate עם Zod לפני שמירה
- UUID generation — gen_random_uuid() בלבד
- Timestamps — TIMESTAMPTZ תמיד

## כללי סוכן AI
- מודל: claude-sonnet-4-6
- כל סוכן ב-lib/claude/agents/[name].ts
- System prompt מ-lib/claude/prompts/[name].ts
- רשום ל-agent_log כל קריאה

## כשתיקוע
1. פתח את הקובץ — אל תדמיין
2. בדוק SCHEMA.sql לסכמה
3. בדוק RLS policies
4. הרץ query פשוט ב-Supabase Dashboard לאימות
```

---

*PRD v2.0 | SHIMUR.ASHDOD | מבוסס על 2 תיקי תיעוד אמיתיים*

-- שלב ב׳ של רשימת הוועדה: 2 מרקמים, 5 תחנות "טיילת בזמן", 2 אתרים מתכניות מאושרות, ומסלול route-5
-- האתרים נוצרו מ-lib/demo/buildings.ts בעזרת: node --experimental-strip-types scripts/gen-sites-sql.mts 26
-- גיבוי לפני השינוי: shimur_buildings_backup_20261013

CREATE TABLE IF NOT EXISTS shimur_buildings_backup_20261013 AS SELECT * FROM shimur_buildings;
ALTER TABLE shimur_buildings_backup_20261013 ENABLE ROW LEVEL SECURITY;

INSERT INTO shimur_buildings (site_no, city_registry_id, name, address, neighborhood, parcel, is_complex, lat, lng, year_built, year_built_verified, architect, architect_verified, style, historical_periods, protection_level, documentation_reason, owner, current_use, building_type, preservation_reasons, priority_level, full_description, additional_info, iaa_reference, gov_sources, committee_no, list_status, statutory_ref, coords_approx, data_conflict, components, risk_note, grade_note) VALUES
(26, 'ASH-026', 'המרינה, המעגנות ופארק אשדוד־ים', 'חוף המרינה', 'חוף הים', NULL, false, 31.797, 34.632, NULL, false, NULL, false, 'מרינה ופארק', ARRAY['תקופה ישראלית']::text[], 'ב', 'נופית, אדריכלית', 'רמ"י / עיריית אשדוד', 'קיים', 'מרינה ופארק', ARRAY['נופית','אדריכלית']::text[], 'בינונית', 'מרקם חופי שהוועדה כללה בשימור: המרינה, המעגנות ופארק אשדוד-ים לאורך חוף המרינה.', NULL, NULL, '{}'::text[], NULL, 'texture', NULL, true, NULL, '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(27, 'ASH-027', 'בית העלמין', 'רח׳ משה סנה', 'נחל לכיש', NULL, false, 31.81, 34.668, NULL, false, NULL, false, 'בית עלמין', ARRAY['תקופה ישראלית']::text[], 'ב', 'נופית, היסטורית', 'עיריית אשדוד', 'קיים', 'בית עלמין', ARRAY['נופית','היסטורית']::text[], 'בינונית', 'בית העלמין של העיר ברחוב משה סנה, מרקם וסביבה שהוועדה כללה בשימור. מקבץ נחל לכיש עובר לידו במזרח העיר.', NULL, NULL, '{}'::text[], NULL, 'texture', NULL, true, 'מיקום מדויק לאימות.', '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(28, 'ASH-028', 'האתר האפיפליאוליתי', 'אזור הסיטי', 'רובעים ותיקים', NULL, false, 31.7925, 34.6385, NULL, false, NULL, false, 'אתר ארכאולוגי', ARRAY['תקופה פרהיסטורית']::text[], 'א', 'ארכאולוגית', 'לאימות (רשות העתיקות)', 'קיים', 'אתר ארכאולוגי', ARRAY['ארכאולוגית']::text[], 'גבוהה', 'האתר האחרון שנותר על דיונת חוף הים בארץ: יישוב גדול של ציידים-לקטים מהתקופה האפיפליאוליתית, לפני 15,000–18,000 שנה. נקודת ציון במערכת השטחים הפתוחים של המרכז.', NULL, NULL, '{}'::text[], NULL, 'archaeology', NULL, true, 'בעלות ומיקום מדויק לאימות מול רשות העתיקות.', '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(29, 'ASH-029', 'מוזיאון אשדוד', 'מרכז העיר', 'רובעים ותיקים', NULL, false, 31.796, 34.645, NULL, false, NULL, false, 'מוזיאון', ARRAY['תקופה ישראלית']::text[], 'א', 'לאימות', 'לאימות', 'קיים', 'מוזיאון', '{}'::text[], 'גבוהה', 'תחנה במסלול "טיילת בזמן".', NULL, NULL, '{}'::text[], NULL, 'archaeology', NULL, true, 'לאמת את שם המוזיאון ואת המיקום.', '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(30, 'ASH-030', 'אחוזות הקברים', 'דרום העיר, ליד המצודה', 'חוף הים', NULL, false, 31.779, 34.624, NULL, false, NULL, false, 'אתר ארכאולוגי', ARRAY['תקופה ביזנטית']::text[], 'א', 'ארכאולוגית', 'לאימות (רשות העתיקות)', 'קיים', 'אתר ארכאולוגי', ARRAY['ארכאולוגית']::text[], 'גבוהה', 'אחוזות קברים עתיקות בדרום העיר, סמוך למצודת אשדוד ים. תחנה במסלול "טיילת בזמן".', NULL, NULL, '{}'::text[], NULL, 'archaeology', NULL, true, 'תקופה (רומית וביזנטית), בעלות ומיקום מדויק — לאימות.', '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(31, 'ASH-031', 'הסוללה האשורית', 'דרום אשדוד, רצועת החוף', 'חוף הים', NULL, false, 31.776, 34.62, NULL, false, NULL, false, 'אתר ארכאולוגי', ARRAY['תקופת הברזל','תקופה פרסית-הלניסטית']::text[], 'א', 'ארכאולוגית', 'לאימות (רשות העתיקות)', 'קיים', 'אתר ארכאולוגי', ARRAY['ארכאולוגית']::text[], 'גבוהה', 'סוללה מתקופת הברזל ברצועת החוף בדרום העיר. על גבי הסוללה שרידי יישוב הלניסטי (332–162 לפנה״ס).', NULL, NULL, '{}'::text[], NULL, 'archaeology', NULL, true, 'בעלות ומיקום מדויק לאימות מול רשות העתיקות.', '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(32, 'ASH-032', 'המצדית', 'רובע ט״ו, ליד המצודה', 'חוף הים', NULL, false, 31.773, 34.63, NULL, false, NULL, false, 'אתר ארכאולוגי', ARRAY['תקופה אסלאמית קדומה']::text[], 'א', 'ארכאולוגית', 'לאימות (רשות העתיקות)', 'קיים', 'אתר ארכאולוגי', ARRAY['ארכאולוגית']::text[], 'גבוהה', 'מגדל איתות שעומד היום בכיכר בלב שכונת מגורים ברובע ט״ו, סמוך למצודה.', NULL, NULL, '{}'::text[], NULL, 'archaeology', NULL, true, 'תקופה (ערבית קדומה), בעלות ומיקום מדויק — לאימות.', '{}'::text[], NULL, 'הצעה אוטומטית – לאישור הוועדה'),
(33, 'ASH-033', 'גן ילדים נאות ספיר', 'נאות ספיר 9, רובע ה׳', 'רובעים ותיקים', '2068/89', false, 31.797, 34.66, NULL, false, NULL, false, 'גן ילדים', ARRAY['תקופה ישראלית']::text[], 'א', 'היסטורית', 'עיריית אשדוד', 'קיים', 'גן ילדים', ARRAY['היסטורית']::text[], 'גבוהה', 'גן ילדים שנוסף לשימור בתכנית ההתחדשות של שדרות הרצל (תמ"ל/2024), אחרי החלטת הוועדה.', NULL, NULL, '{}'::text[], NULL, 'added_by_plan', 'תמ"ל/2024 (התחדשות שד׳ הרצל)', true, NULL, '{}'::text[], 'בתחום תכנית התחדשות עירונית.', 'הצעה אוטומטית – לאישור הוועדה'),
(34, 'ASH-034', 'מתחם ציבורי קהילתי בורוכוב', 'בורוכוב 26, רובע ב׳', 'רובעים ותיקים', NULL, false, 31.806, 34.655, NULL, false, NULL, false, 'מתחם ציבורי', ARRAY['תקופה ישראלית']::text[], 'א', 'היסטורית', 'לאימות', 'קיים', 'מתחם ציבורי', ARRAY['היסטורית']::text[], 'גבוהה', 'מתחם ציבורי קהילתי שהומלץ לשימור בידי יועצי השימור, במסגרת תכנית פינוי-בינוי הרב מימון (תמ"ל/2047). בתכנית יש נספח תיעוד מקדים.', NULL, NULL, '{}'::text[], NULL, 'added_by_plan', 'תמ"ל/2047 (פינוי־בינוי הרב מימון)', true, NULL, '{}'::text[], 'בתחום תכנית פינוי-בינוי.', 'הצעה אוטומטית – לאישור הוועדה')
ON CONFLICT (site_no) DO UPDATE SET city_registry_id = EXCLUDED.city_registry_id, name = EXCLUDED.name, address = EXCLUDED.address, neighborhood = EXCLUDED.neighborhood, parcel = EXCLUDED.parcel, is_complex = EXCLUDED.is_complex, lat = EXCLUDED.lat, lng = EXCLUDED.lng, year_built = EXCLUDED.year_built, year_built_verified = EXCLUDED.year_built_verified, architect = EXCLUDED.architect, architect_verified = EXCLUDED.architect_verified, style = EXCLUDED.style, historical_periods = EXCLUDED.historical_periods, protection_level = EXCLUDED.protection_level, documentation_reason = EXCLUDED.documentation_reason, owner = EXCLUDED.owner, current_use = EXCLUDED.current_use, building_type = EXCLUDED.building_type, preservation_reasons = EXCLUDED.preservation_reasons, priority_level = EXCLUDED.priority_level, full_description = EXCLUDED.full_description, additional_info = EXCLUDED.additional_info, iaa_reference = EXCLUDED.iaa_reference, gov_sources = EXCLUDED.gov_sources, committee_no = EXCLUDED.committee_no, list_status = EXCLUDED.list_status, statutory_ref = EXCLUDED.statutory_ref, coords_approx = EXCLUDED.coords_approx, data_conflict = EXCLUDED.data_conflict, components = EXCLUDED.components, risk_note = EXCLUDED.risk_note, grade_note = EXCLUDED.grade_note, updated_at = now();

INSERT INTO shimur_documentation_files (building_id, file_type)
SELECT id, CASE WHEN is_complex THEN 'מתחם' ELSE 'מבנה' END FROM shimur_buildings b
WHERE NOT EXISTS (SELECT 1 FROM shimur_documentation_files f WHERE f.building_id = b.id);

INSERT INTO shimur_routes (slug, title, description, theme, is_public)
VALUES ('route-5', 'טיילת בזמן', 'מסלול לאורך החוף בין שכבות הזמן של אשדוד, מתקופת הברונזה ועד התקופה הערבית הקדומה.', 'ארכאולוגיה', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO shimur_route_sites (route_id, building_id, position, narrative_text)
SELECT r.id, b.id, v.position, v.narrative_text
FROM (VALUES
(13, 1, 'תל מור — יישוב מתקופות הברונזה, הברזל והפרסית בפי נחל לכיש.'),
(1, 2, 'גבעת יונה — הגבעה הגבוהה בעיר, עם שרידים מתקופות הברונזה, הברזל והפרסית, והמגדלור בראשה.'),
(29, 3, 'מוזיאון אשדוד — תחנת ביניים במרכז העיר.'),
(14, 4, 'מצודת אשדוד ים — מבצר חוף מהתקופה האסלאמית הקדומה.'),
(30, 5, 'אחוזות הקברים — סמוך למצודה, בדרום העיר.'),
(31, 6, 'הסוללה האשורית — סוללה מתקופת הברזל, ועליה יישוב הלניסטי.'),
(32, 7, 'המצדית — מגדל איתות בכיכר ברובע ט״ו.')
) AS v(site_no, position, narrative_text)
JOIN shimur_buildings b ON b.site_no = v.site_no
CROSS JOIN shimur_routes r
WHERE r.slug = 'route-5'
ON CONFLICT (route_id, position) DO NOTHING;

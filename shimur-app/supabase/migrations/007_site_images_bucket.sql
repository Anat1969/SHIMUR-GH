-- תמונות אתרים שהעורכת מעלה מהאפליקציה.
-- דלי ציבורי לקריאה: התמונות מוצגות לכל הציבור.
-- כתיבה רק דרך השרת (service role), אחרי בדיקת עורך מול shimur_admins. אין מדיניות כתיבה ללקוח.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shimur-site-images', 'shimur-site-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

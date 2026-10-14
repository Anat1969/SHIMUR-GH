-- הסרת תמונה בלי מחיקה: הרשומה והקובץ נשארים, ורק מוסתרים מהאפליקציה.
-- שחזור: לאפס את removed_at (וכדי להחזיר כראשית, לעדכן את image_url של האתר).
alter table shimur_documents add column if not exists removed_at timestamptz;

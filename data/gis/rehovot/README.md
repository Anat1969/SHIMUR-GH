# שכבת הרחובות של אשדוד

מקור: עיריית אשדוד, קובץ `rehevot.shp` (ענת, 03.11.2026).
מערכת קואורדינטות: רשת ישראל החדשה (Israel TM Grid), ראו `rehevot.prj`.
2,991 קטעי רחוב, 1,228 שמות רחוב, 40 ערכי רובע.

שדות: `שם_רח` (שם הרחוב), `רובע`, `מידרג`, `st_cod` (קוד רחוב), `year_of_ex`.
השדות `סוג_ר`, `אופי_` ו-`executing` בלי הגדרה בקובץ, ולכן לא מוצגים.

האפליקציה משתמשת בגרסה ב-WGS84: `shimur-app/public/gis/ashdod-streets.geojson`.
המרה מחדש:

```bash
pip install pyshp pyproj
python shimur-app/scripts/streets-to-geojson.py data/gis/rehovot/rehevot shimur-app/public/gis/ashdod-streets.geojson
```

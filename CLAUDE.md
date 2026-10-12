# SHIMUR.ASHDOD — הנחיות לסוכן Claude Code
## קרא קובץ זה לפני כל פעולה

---

## תקן כללי לכל אפליקציה (חל על כל פרויקט של ענת, לא רק על זה)

כל סעיף כאן נולד מתיקון של ענת. הוא מגדיר דרישה ואת הפתרון שעבד בפועל. פרויקט חדש מתחיל מכאן.
כשענת מתקנת דבר שאינו ייחודי לפרויקט: להוסיף אותו לסעיף הזה, באותה רמת דיוק (דרישה + פתרון עובד), ולא רק ל"לקחים".

### תהליך
- לפני כל עבודה: לטעון את הסקילים `end-to-end-builder` ו-`master-app-builder`. שם סקיל שלא קיים ברשימה: להפעיל את הקרוב ביותר.
- קודם אפיון (בעיה, משתמש, מסלול מרכזי, מידע נשמר), אחר כך קוד.
- בנייה ירוקה + בדיקות עברו: למזג לענף הראשי בעצמי ולמסור כתובת חיה. לא להשאיר פול ריקווסט פתוח.
- בדיקה לפני מסירה: Playwright שלוחץ על כל כפתור בכל דף ומוודא שקרה משהו (ניווט, בקשה, שינוי מצב), וצילום מסך ברוחב 390px וברוחב מחשב, עם בדיקה ש-`scrollWidth <= innerWidth` בכל דף.

### זהות: שם, לוח צבעים, לוגו
- שם האפליקציה בסרגל הניווט הוא קישור לדף הראשי, תמיד.
- ריחוף על השם חייב להראות שזה כפתור: רקע בהיר + צל, הלוגו מסתובב/גדל קלות, צבע הטקסט משתנה.
- לוח הצבעים מקודד מתחת לשם כ"פס DNA": שורת מלבנים צרים בצבעי הפלטה, שמתרוממים בריחוף. זו חתימת העיצוב של האפליקציה.
- הפלטה מוגדרת פעם אחת כמשתני CSS ב-`:root` (globals.css) ובמערך אחד בקוד הסרגל. אין צבעים קשיחים מפוזרים.
- פתרון עובד:
```tsx
const PALETTE = ['#C8B89A', '#8B7355', '#8B3A1E', '#D4922A', '#4A5C45', '#1B6B7D', '#1B2A4A']; // הפלטה של האפליקציה
<Link href="/" className="brand group flex items-center gap-2.5 rounded-xl px-2 py-1 -mx-2" aria-label="שם האפליקציה — לדף הראשי">
  <Image src="/logo.svg" alt="" width={22} height={22} className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
  <span>
    <span className="block text-lg font-serif font-bold transition-colors group-hover:text-[var(--accent)]">שם האפליקציה</span>
    <span className="brand-dna" aria-hidden="true">{PALETTE.map(c => <i key={c} style={{ backgroundColor: c }} />)}</span>
  </span>
</Link>
```
```css
.brand { transition: background-color 0.2s, box-shadow 0.2s; }
.brand:hover { background-color: rgba(255,255,255,0.7); box-shadow: 0 4px 14px rgba(27,42,74,0.12); }
.brand-dna { display: flex; gap: 2px; margin-top: 3px; height: 4px; }
.brand-dna i { display: block; flex: 1; border-radius: 2px; transition: transform 0.3s ease; transform-origin: bottom; }
.brand:hover .brand-dna i { transform: scaleY(1.8); }
.brand:hover .brand-dna i:nth-child(odd) { transform: scaleY(2.4); }
```

### סרגל ניווט
- RTL: הסדר הוויזואלי מתחיל מימין. הפעולה הראשית (למשל "מצגת") ראשונה מימין, מיד אחרי השם, בכפתור מלא בצבע הכהה של הפלטה. בתפריט הנייד: הכפתור הראשון למעלה, ברוחב מלא.
- קישורים מחולקים לקבוצות (ציבורי / מקצועי) עם מפריד. קישור פעיל מסומן (`aria-current="page"`).
- מתחת ל-`lg`: כפתור "תפריט" עם טקסט (לא אייקון) שהופך ל"סגירה", התפריט נסגר במעבר דף.
- קישור "דילוג לתוכן" (skip link) ו-`focus-visible` ברור.

### אין מלכודות ניווט
- כל חלון, פאנל צדדי או דיאלוג נסגר בשלוש דרכים: כפתור X גלוי בפינה, מקש Esc, לחיצה מחוץ לחלון. ועוד כפתור טקסט "חזרה ל[שם הדף]".
- ניווט היררכי (רשימה ← פריט, ציר זמן ← תקופה): כפתור חזרה גלוי ודביק לתצוגה הראשית, ניווט קודם/הבא, והמצב נשמר בכתובת (`?period=`, `?site=`) כך שאפשר לשתף ולחזור אחורה בדפדפן.
- אין כפתור מת. כפתור שלא עושה כלום: לממש או למחוק. פילטר שאין לו נתונים: למחוק.

### תוכן ונתונים
- כל טקסט עובדתי נבדק מול מקור לפני הצגה. בלי מקור: לרכך ולסמן "לאימות". לא להמציא.
- כל מספר או מונח בדשבורד מסביר את עצמו: מה הוא אומר, מי קבע, לפי איזה מקור, ומה המשמעות. מספר שלא חושף מידע: להסיר.
- מיקום גאוגרפי: קואורדינטות רק ממקור (ויקיפדיה, מקום ב-Google Maps, OSM), לא מנעיצה של רחוב.
- נתוני גיבוי מובנים בקוד: אם המאגר לא זמין, האפליקציה ממשיכה לעבוד ומציגה פס הודעה עדין. הצגה מול קהל לעולם לא נשברת.

### תמונות
- כל ישות מוצגת עם תמונה בכל מקום (מפה, רשימות, טבלאות, כרטיסים, ציר זמן) דרך רכיב תמונה אחד עם גדלים (thumb / card / hero).
- אין תמונה: משטח בצבע הקטגוריה עם השם. לא תמונה שבורה ולא אייקון.
- במפה: ריחוף על סמן מציג תצוגה מקדימה עם תמונה ושם.
- להקטין תמונות בצד הלקוח לפני העלאה (עד 1600px).

### ויזואליזציות צפופות
- ציר זמן, מפה וגרף: אף פריט לא מוסתר מתחת לאחר. פיזור בכמה שורות, ריווח לפי צפיפות, כפתורי "ריווח"/"צמצום", ותוויות שלא חופפות.
- מפה: בחירה עפה לפריט, ניקוי חוזר לכל הפריטים. בורר שכבות (רחובות / לווין) ותוויות שאפשר לכבות.

### מצב מצגת
- אפליקציה שמוצגת מול קהל מקבלת מצב מצגת: מסך פתיחה, שקף לכל פריט, ניווט בחצים, F למסך מלא, P לניגון אוטומטי, Esc ליציאה, וקישור ישיר לפריט (`?site=`).

### עריכה והרשאות
- הציבור קורא, רק עורכים כותבים. הכתיבה עוברת דרך API בשרת, עם בדיקת זהות בשרת (Bearer + טבלת מורשים), לא רק הסתרה בממשק.
- כפתורי עריכה מוצגים רק לעורך. אורח שמנסה: הודעה ברורה בעברית מה לעשות.
- מאגר משותף לכמה אפליקציות: קידומת לטבלאות (`shimur_`), RLS על כל טבלה, והרשאות כתיבה רק ל-service role.

### ממשק ושפה
- עברית, `dir="rtl"`, `start/end` ולא `left/right`. מפות (Leaflet) מקבלות `direction: ltr` פנימי.
- בלי אייקונים ובלי אימוג'י בממשק. טקסט ברור במקומם.
- שגיאות בעברית, ספציפיות, עם הצעת פעולה.
- נגישות: `prefers-reduced-motion`, ניגודיות, לא לחסום זום (`maximumScale` אסור).

### סביבה (Claude Code בענן)
- כלי ה-SQL של Supabase נתקע כשיש `;` בתוך מחרוזת טקסט. להחליף בפסיק.
- הסביבה לא מגיעה ל-supabase.co ול-vercel.app: נתונים דרך כלי ה-SQL, בדיקה מקומית עם נתוני הגיבוי.

---

## זהות הפרויקט

מערכת ניהול תיקי תיעוד שימור למורשת הבנויה של אשדוד.

שני סוגי תיקים:
- **מבנה בודד** — 9 פרקים (א עד ט)
- **מתחם / קמפוס** — 10 פרקים (א עד י)

שלושה משתמשים:
- **אדריכל שטח** — בונה תיק, עובד בשטח ובסטודיו
- **פקיד ועדה** — בודק ומאשר תיקים שהוגשו
- **מנהל יחידה** — מנהל כלל רשימת השימור העירונית

---

## כלל עבודה ראשון

**לפני כל פעולה — פתח את הקובץ הרלוונטי. אל תדמיין מבנה.**

אם קוד נכשל — קרא את השגיאה בפועל. אל תנחש.
אם אינך בטוח לגבי סכמה — פתח את SCHEMA.sql.
אם אינך בטוח לגבי פרקים — פתח את PRD.md סעיף 05.

---

## כללי קוד

### TypeScript
- strict mode חובה — אין `any`
- כל prop מוגדר עם טיפוס
- Server Actions — `use server` + Zod validation

### Supabase
- כל שאילתה — בדוק RLS קיים לטבלה
- JSON fields — validate עם Zod לפני INSERT/UPDATE
- UUID — `gen_random_uuid()` בלבד
- Timestamps — `TIMESTAMPTZ` תמיד, `DEFAULT now()`
- שגיאות — handle כל supabase error, אל תשתוק

### Next.js
- App Router בלבד — אין pages/
- Server Components כברירת מחדל
- Client Components רק כשנדרש interactivity
- Loading states — כל דף עם Suspense
- Error boundaries — כל route

---

## כללי עיצוב

### פלטה (CSS Variables ב-globals.css)
```css
--stone:         #C8B89A;
--stone-dark:    #8B7355;
--stone-light:   #EDE0CC;
--ink:           #1A1410;
--ink-soft:      #3D3228;
--parchment:     #F7F0E3;
--parchment-deep:#EDE3D0;
--rust:          #8B3A1E;
--rust-light:    #C4582A;
--sage:          #4A5C45;
--sage-light:    #7A9174;
```

### גופנים
```css
/* ב-layout.tsx */
import { Heebo, Playfair_Display } from 'next/font/google'
/* Heebo: ממשק | Playfair Display: כותרות ראשיות */
```

### RTL
```html
<html lang="he" dir="rtl">
```
כל פלטה, padding, margin — RTL aware.
`mr-4` הוא `ms-4` ב-RTL. השתמש ב-`start/end` לא `left/right`.

### כפתורים
- padding גדול: `px-6 py-3` מינימום
- label ברור בעברית
- disabled state + loading state לכל כפתור submit

### שגיאות
- בעברית תמיד
- ספציפיות: "גוש חסר" לא "שגיאה בטופס"
- עם הצעת פעולה: "הזן מספר גוש ונסה שוב"

---

## כללי ניווט

### breadcrumbs — בכל דף
```tsx
<Breadcrumbs items={[
  { label: 'מבנים', href: '/buildings' },
  { label: building.name, href: `/buildings/${id}` },
  { label: 'תיק תיעוד', href: `/buildings/${id}/file` },
  { label: chapter.title }
]} />
```

### SmartNav — מציע, לא כופה
```tsx
// פאנל מתקפל — לא חוסם
<SmartNav suggestions={[
  { label: 'חסר תאריך בנייה מאומת', href: '...', urgency: 'critical' },
  { label: 'חזית מזרחית לא צולמה', href: '...', urgency: 'important' },
]} />
```

### URL ישיר — כל נתיב נגיש
אין redirect שלא-הגיוני.
אם user אין לו גישה — הצג 403 ברור, לא redirect ל-login.

---

## כללי סוכן AI

### מודל
```typescript
const MODEL = 'claude-sonnet-4-6'
```

### מבנה כל agent
```typescript
// lib/claude/agents/[name].ts
export async function runAgent(input: AgentInput): Promise<AgentOutput> {
  const systemPrompt = await getPrompt('[name]', input.context)

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: input.text }]
  })

  // רשום ל-agent_log
  await logAgentCall({
    file_id: input.fileId,
    user_id: input.userId,
    agent_type: '[name]',
    input_text: input.text,
    output_text: response.content[0].text,
    tokens_in: response.usage.input_tokens,
    tokens_out: response.usage.output_tokens
  })

  return parseOutput(response.content[0].text)
}
```

### System Prompts
נמצאים ב-`lib/claude/prompts/[agent].ts`
קרא אותם — אל תכתוב מחדש.

---

## כללי מפה

### Leaflet — Client Component בלבד
```typescript
// components/map/BuildingsMap.tsx
'use client'
import dynamic from 'next/dynamic'
// Leaflet לא תומך SSR — use dynamic import
```

### Nominatim — Server-side בלבד
```typescript
// lib/map/geocoding.ts — Server Action
// User-Agent חובה: 'shimur-ashdod/2.0'
// Rate limit: 1 request/second
```

### צבעי סמנים
```typescript
const STATUS_COLORS = {
  'לא_התחיל': 'var(--stone)',
  'בתהליך':   'var(--rust-light)',
  'הוגש':     'var(--sage)',
  'אושר':     'var(--ink)',
  'הוחזר':    'var(--rust)',
}
```

---

## כללי PDF

```typescript
// lib/pdf/export.ts
// react-pdf בלבד — אין puppeteer
// RTL: direction: 'rtl' ב-Document
// גופנים: ייבוא Heebo + Playfair כ-font files
```

---

## סדר עבודה מומלץ

1. `supabase/migrations/001_initial.sql` ← הרץ SCHEMA.sql
2. `supabase/seed/001_data.sql` ← הרץ SEED.sql
3. `app/(auth)/login` ← אימות
4. `app/(app)/buildings` ← רשימה
5. `app/(app)/buildings/[id]` ← דף מבנה
6. `app/(app)/buildings/[id]/file` ← תיק
7. `app/(app)/buildings/[id]/file/[chapter]` ← פרק
8. `app/(app)/field/[id]` ← שטח (mobile)
9. `app/(app)/buildings/[id]/values` ← ערכים
10. `app/(app)/buildings/[id]/declaration` ← הצהרה
11. `app/(app)/dashboard/*` ← דשבורדים
12. `app/(app)/map` ← מפה
13. `app/(app)/knowledge/*` ← מאגר
14. `lib/claude/agents/*` ← סוכנים
15. `lib/pdf/*` ← ייצוא

---

## בדיקות לפני deploy

- [ ] RLS על כל טבלה
- [ ] RTL על כל דף
- [ ] Error boundaries
- [ ] Loading states
- [ ] Mobile responsive (field mode)
- [ ] PDF export עובד
- [ ] Nominatim rate limit מטופל
- [ ] agent_log רושם כל קריאה
- [ ] Zod validation על כל form

---

## שאלות תכופות

**שאלה: מה ההבדל בין is_complex לfile_type?**
`is_complex` בטבלת buildings — מגדיר אם המבנה הוא מתחם.
`file_type` בטבלת documentation_files — מגדיר את סוג התיק (מבנה/מתחם).
בדרך כלל תואמים, אבל file_type הוא מה שקובע את הפרקים.

**שאלה: כמה פרקים לכל סוג?**
- מבנה: 9 פרקים (א-ט)
- מתחם: 10 פרקים (א-י)
הפרקים מוגדרים ב-PRD.md סעיף 05.

**שאלה: מה הצהרת מתעד?**
פרק חובה חוקי. חייב להכיל ת.ז. וחתימת האדריכל.
ב-PDF — עמוד אחרון, נפרד.
ראה טבלת `documenter_declarations` ב-SCHEMA.sql.

**שאלה: מה שכבות מפה היסטוריות?**
לתיק מתחמי בלבד. מאפשר להציג מפות עתיקות על Leaflet.
נשמר ב-`buildings.historical_maps` כ-JSON.
מוצג כ-Leaflet ImageOverlay.

---

## לקחים קבועים לפרויקט הזה (מתעדכן אחרי כל תיקון של ענת)

לקח כללי עובר לסעיף "תקן כללי לכל אפליקציה" למעלה. כאן רק מה שייחודי לשימור אשדוד.

- מאגר הנתונים: ASHDODMAP (משותף), טבלאות בקידומת `shimur_`. SHIMUR-SB אינו בשימוש.
- תמונות: `components/sites/SiteImage.tsx`. תמונות נוספות לאתר: `shimur_documents` מסוג image.
- מקורות תמונות: תיקיית Drive "שימור" (מצגת ועדת השימור). קובץ "שימור אתרים מעודכן אוגוסט 2016" גדול מ-10MB ואינו ניתן להורדה בכלי.
- מקור הרשימה הרשמי: פרוטוקול ועדת השימור 201601 (17.8.2016). אין בו דרגות שימור מאושרות, ולכן במערכת הן "הצעה".

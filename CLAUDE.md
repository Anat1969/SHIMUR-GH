# SHIMUR.ASHDOD — הנחיות לסוכן Claude Code
## קרא קובץ זה לפני כל פעולה

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

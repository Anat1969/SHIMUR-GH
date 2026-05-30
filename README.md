# SHIMUR.ASHDOD v2.0
## מערכת ניהול מורשת בנויה | עיריית אשדוד

---

## מה יש כאן

| קובץ | תפקיד | קרא לפני |
|------|--------|----------|
| `PRD.md` | מסמך דרישות מוצר מלא | תמיד |
| `SCHEMA.sql` | סכמת בסיס נתונים — הרץ ב-Supabase | פיתוח |
| `SEED.sql` | נתוני seed ראשוניים | לאחר SCHEMA |
| `CLAUDE.md` | הנחיות לסוכן Claude Code | תמיד |
| `AGENTS.md` | מפרט 5 סוכני AI עם system prompts | פיתוח agents |

---

## מבוסס על

שני תיקי תיעוד אמיתיים שנותחו:
1. **המלך ג'ורג' 5, ירושלים** — ארד-סימון אדריכלים, 2021 (תיק מבנה)
2. **גמנסיה עברית רחביה** — ארד-סימון + ציפשטיין, 2023 (תיק מתחמי)

---

## שני סוגי תיקים

| | תיק מבנה | תיק מתחמי |
|-|---------|-----------|
| פרקים | 9 (א-ט) | 10 (א-י) |
| מבנים | 1 | רבים (עם קודים) |
| טבלת ערכים | בפרק ז | פרק ח נפרד |
| ניתוח טופוגרפי | לא | כן (פרק ג) |
| היסטוריה קרטוגרפית | לא | כן (פרק ה) |

---

## Stack

```
Next.js 14  ·  Supabase  ·  Claude API  ·  Leaflet  ·  GitHub  ·  Vercel
```

---

## התחלה מהירה עם Claude Code

```bash
# 1. פתח Claude Code בתיקייה זו
claude

# 2. אמור:
"קרא את CLAUDE.md ואת PRD.md ובנה את הפרויקט לפי הסדר שב-CLAUDE.md"

# 3. הוסף לתיקיית uploads/:
uploads/ashdod_preservation_list.csv   ← רשימת 120+ המבנים
uploads/ashdod_preservation_list.pdf   ← גרסה רשמית
```

---

## תיקיית uploads — מה להכניס

```
uploads/
  ashdod_preservation_list.csv     ← עמודות: city_registry_id, name, address,
                                              neighborhood, protection_level,
                                              year_built, architect, style,
                                              is_complex
  any_existing_docs/               ← תיקים קיימים לייבוא
```

Claude Code יעבד ויטען ל-Supabase אוטומטית.

---

*v2.0 | מבוסס על 2 תיקי תיעוד אמיתיים | SHIMUR.ASHDOD*

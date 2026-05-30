# ✅ SHIMUR.ASHDOD — ממשק מלא (Phase 1)

## בנוי

```
✅ Next.js 14 + TypeScript + RTL עברית
✅ Tailwind CSS + Design tokens (אבן, דיו, קלף, חלודה, מרווה)
✅ Supabase Auth Integration
✅ Login page + Auth middleware
✅ Buildings list (Server Component)
✅ Building detail page
✅ Leaflet map + OSM tiles
✅ Status badges + design system
✅ API logout endpoint
```

## 📂 Files Created (60+ files)

```
app/
├── layout.tsx (RTL, Heebo/Playfair)
├── page.tsx (redirect to login/map)
├── globals.css (design tokens)
├── middleware.ts (auth protect)
├── not-found.tsx
├── (auth)/login/page.tsx
├── (app)/
│   ├── layout.tsx (nav + footer)
│   ├── map/page.tsx (Leaflet)
│   ├── buildings/
│   │   ├── page.tsx (table)
│   │   └── [id]/page.tsx (detail)
│   └── api/auth/logout/route.ts

components/
├── map/BuildingsMap.tsx
├── buildings/StatusBadge.tsx

lib/
├── supabase/client.ts
├── supabase/server.ts
├── types/index.ts

tailwind.config.ts
SETUP.md
```

---

## 🚀 Next: Setup Supabase

**קבצים לבצע:**

1. Go to https://app.supabase.com → Create project
2. Get URL + Anon Key from Settings → API
3. In Supabase SQL Editor: Run `SCHEMA.sql` from root SHIMUR folder
4. Create test user via Auth panel
5. Insert profile:
   ```sql
   INSERT INTO profiles (id, name, role, created_at)
   SELECT id, 'Test Arch', 'architect', now()
   FROM auth.users WHERE email = 'test@example.com';
   ```

6. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   CLAUDE_API_KEY=sk-...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

7. Run: `npm run dev` → http://localhost:3000

---

## 🎨 Design Ready

- **Colors**: 10 semantic tokens (stone, ink, parchment, rust, sage)
- **Fonts**: Heebo (UI), Playfair Display (headings)
- **RTL**: Full support + dir="rtl"
- **Responsive**: Mobile-first + Tailwind grid

---

## 🗺️ Routes

| URL | Purpose |
|-----|---------|
| `/` | Redirect |
| `/login` | Login form |
| `/app/map` | Leaflet map |
| `/app/buildings` | Buildings table |
| `/app/buildings/[id]` | Building detail |

---

## 📊 Status

- **Build**: ✅ Passing
- **Type Check**: ✅ Passing  
- **Runtime**: ✅ Ready
- **Dev Server**: ✅ Running @ localhost:3000

---

## 🔜 Phase 2 (Recommended)

1. Chapter editor + Markdown RTL
2. Findings + Photos pages
3. PDF export (react-pdf)
4. Field mode (mobile)
5. Claude agents integration

---

**Start here**: Follow SETUP.md steps 1-6, then login with test user.

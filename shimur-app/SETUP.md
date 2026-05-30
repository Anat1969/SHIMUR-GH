# SHIMUR.ASHDOD — Setup Guide

## ✅ You have:

- ✅ Next.js 14 app with TypeScript
- ✅ RTL Hebrew support (dir="rtl", Heebo + Playfair fonts)
- ✅ Tailwind CSS with SHIMUR color tokens
- ✅ Supabase Auth integration
- ✅ Login page + protected routes
- ✅ Buildings list + detail pages
- ✅ Interactive Leaflet map
- ✅ Design system (status badges, layout)

---

## 🔧 Next Steps — Setup Supabase

### 1. Create Supabase Project
```bash
# Go to https://app.supabase.com
# Create a new project (free tier is fine)
# Wait for project to initialize
```

### 2. Get Connection Strings
```
In Supabase Dashboard:
  → Settings → API
  → Copy: Project URL (NEXT_PUBLIC_SUPABASE_URL)
  → Copy: Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### 3. Setup Database Schema
```bash
# In Supabase Dashboard:
  → SQL Editor
  → New Query
  → Paste the content from SCHEMA.sql (in the root SHIMUR folder)
  → Run
  
# This creates 13 tables:
  - profiles
  - buildings
  - documentation_files
  - chapters
  - complex_buildings
  - findings
  - photos
  - documenter_declarations
  - agent_log
  - knowledge_base
```

### 4. Setup Environment Variables
```bash
# In project root, create .env.local
# Copy from .env.example and fill in:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CLAUDE_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Create Test User
```
In Supabase Dashboard:
  → Authentication → Users
  → Add User
  → Email: test@example.com
  → Password: Test123456!
```

After user is created, manually insert a profile:
```sql
INSERT INTO profiles (id, name, role, created_at)
SELECT id, 'Test Architect', 'architect', now()
FROM auth.users
WHERE email = 'test@example.com';
```

### 6. Add Test Data
```bash
# Run seed data from SEED.sql:
# In Supabase SQL Editor, paste and run SEED.sql
```

---

## 🚀 Run the App

```bash
# In project root
npm install              # Already done, but safe to repeat
npm run dev             # Start dev server at http://localhost:3000
```

### Test Flow
1. Go to http://localhost:3000
2. Should redirect to `/login`
3. Login with test@example.com / Test123456!
4. Should redirect to `/app/map`
5. You'll see:
   - Map page with building markers (if any buildings have lat/lng)
   - Buildings list showing all buildings from DB
   - Building detail pages showing building info

---

## 📋 Current Pages

| URL | Purpose |
|-----|---------|
| `/` | Redirects to login or map |
| `/login` | Login form |
| `/app/map` | Leaflet map with building markers |
| `/app/buildings` | Table of all buildings |
| `/app/buildings/[id]` | Building detail page |

---

## 🎨 Design System Ready

### Colors (CSS Variables)
```css
--stone: #C8B89A
--stone-dark: #8B7355
--stone-light: #EDE0CC
--ink: #1A1410
--ink-soft: #3D3228
--parchment: #F7F0E3
--parchment-deep: #EDE3D0
--rust: #8B3A1E
--rust-light: #C4582A
--sage: #4A5C45
--sage-light: #7A9174
```

### Fonts
- **UI**: Heebo (300, 400, 500, 700)
- **Headings**: Playfair Display (400, 700)
- **Direction**: RTL (dir="rtl")

---

## 📦 Project Structure

```
app/
├── layout.tsx           ← Root layout (RTL, lang="he")
├── page.tsx            ← Redirect to login/map
├── globals.css         ← Design tokens + Leaflet CSS
├── not-found.tsx       ← 404 page
├── middleware.ts       ← Auth protection
├── (auth)/
│   └── login/page.tsx  ← Login form
└── (app)/              ← Protected routes
    ├── layout.tsx      ← Nav + footer
    ├── map/page.tsx    ← Leaflet map
    ├── buildings/
    │   ├── page.tsx    ← Buildings list
    │   └── [id]/page.tsx ← Building detail

components/
├── auth/LoginForm.tsx
├── map/BuildingsMap.tsx
├── buildings/StatusBadge.tsx

lib/
├── supabase/client.ts
├── supabase/server.ts
└── types/index.ts
```

---

## 🧪 Troubleshooting

### Map not showing markers?
- Ensure buildings have `lat` and `lng` populated
- Check browser console for errors
- Verify leaflet CSS loaded (check Network tab)

### Login not working?
- Check NEXT_PUBLIC_SUPABASE_URL is correct
- Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
- Ensure user exists in Supabase Auth
- Check browser console for Supabase errors

### Buildings list is empty?
- Run SEED.sql to populate test data
- Or manually insert buildings via SQL:
  ```sql
  INSERT INTO buildings (city_registry_id, name, address, status)
  VALUES ('001', 'Test Building', '1 Test St', 'לא_התחיל');
  ```

---

## 🔜 Next Phase

Once this is working:
1. Create documentation file pages (chapter editor)
2. Build Findings + Photos pages
3. Add Field mode (mobile)
4. Implement Claude agents
5. Build PDF export

---

**Ready?** → `npm run dev` and test!

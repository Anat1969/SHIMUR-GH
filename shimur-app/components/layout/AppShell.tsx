'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { DataSource } from '@/lib/types';
import { EditorProvider, useEditor } from '@/components/providers/Editor';

// לוח הצבעים של האפליקציה — ה-DNA העיצובי, מוצג ליד השם
const PALETTE = ['#C8B89A', '#8B7355', '#8B3A1E', '#D4922A', '#4A5C45', '#1B6B7D', '#1B2A4A'];

const PUBLIC_LINKS = [
  { href: '/overview', label: 'סקירה' },
  { href: '/map', label: 'מפה' },
  { href: '/routes', label: 'מסלולים' },
  { href: '/timeline', label: 'ציר זמן' },
];

const PRO_LINKS = [
  { href: '/buildings', label: 'ניהול רשומות' },
  { href: '/buildings/detail', label: 'פירוט אתרים' },
  { href: '/field', label: 'שטח' },
  { href: '/documents', label: 'מסמכים' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/buildings/detail') return pathname.startsWith('/buildings/detail');
  if (href === '/buildings') return pathname === '/buildings' || (pathname.startsWith('/buildings/') && !pathname.startsWith('/buildings/detail'));
  return pathname === href || pathname.startsWith(href + '/');
}

function NavLink({ href, label, pathname, onClick }: { href: string; label: string; pathname: string; onClick?: () => void }) {
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`text-sm px-3 py-2 rounded-md transition-colors whitespace-nowrap ${active ? 'nav-active' : 'hover:bg-white/60'}`}
      style={{ color: active ? 'var(--ocean-dark)' : 'var(--navy)' }}
    >
      {label}
    </Link>
  );
}

export function AppShell(props: { children: React.ReactNode; source: DataSource }) {
  return <EditorProvider><Shell {...props} /></EditorProvider>;
}

function EditorButton({ compact }: { compact?: boolean }) {
  const { state, email, signIn, signOut } = useEditor();
  if (state === 'loading') return null;
  if (state === 'guest') {
    return (
      <button onClick={signIn} className={`${compact ? 'w-full mt-2' : 'ms-1'} px-4 py-2 rounded-lg text-sm`} style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>
        כניסה לעריכה
      </button>
    );
  }
  return (
    <button onClick={signOut} title={email ?? ''} className={`${compact ? 'w-full mt-2' : 'ms-1'} px-4 py-2 rounded-lg text-sm`} style={{ border: '1px solid var(--stone)', color: state === 'editor' ? 'var(--sage)' : 'var(--navy-soft)' }}>
      {state === 'editor' ? 'מצב עריכה · יציאה' : 'יציאה'}
    </button>
  );
}

function EditorNotice() {
  const { notice } = useEditor();
  if (!notice) return null;
  return <div role="status" className="no-print text-center text-sm py-2 px-4" style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}>{notice}</div>;
}

function Shell({ children, source }: { children: React.ReactNode; source: DataSource }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--parchment)' }}>
      <a href="#main" className="skip-link">דילוג לתוכן</a>

      <nav className="sticky top-0 z-[1100] glass-card no-print" style={{ borderRadius: 0, borderInline: 'none', borderTop: 'none', borderBottom: '1px solid rgba(200, 184, 154, 0.3)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/overview" className="brand group flex items-center gap-2.5 shrink-0 rounded-xl px-2 py-1 -mx-2" aria-label="SHIMUR.ASHDOD — לסקירה">
            <Image src="/dolphin.svg" alt="" width={22} height={22} className="transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" />
            <span>
              <span className="block text-lg font-serif font-bold leading-tight transition-colors group-hover:text-[var(--ocean)]" style={{ color: 'var(--navy)' }}>SHIMUR.ASHDOD</span>
              <span className="brand-dna" aria-hidden="true">
                {PALETTE.map(c => <i key={c} style={{ backgroundColor: c }} />)}
              </span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {PUBLIC_LINKS.map(l => <NavLink key={l.href} {...l} pathname={pathname} />)}
            <div className="w-px h-6 mx-2" style={{ backgroundColor: 'var(--stone)' }} />
            {PRO_LINKS.map(l => <NavLink key={l.href} {...l} pathname={pathname} />)}
            <Link href="/tour" className="ms-3 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform hover:scale-[1.03]" style={{ backgroundColor: 'var(--navy)' }}>
              מצגת
            </Link>
            <EditorButton />
          </div>

          <button
            className="lg:hidden px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(o => !o)}
          >
            {open ? 'סגירה' : 'תפריט'}
          </button>
        </div>

        {open && (
          <div id="mobile-menu" className="lg:hidden border-t px-4 pb-4 pt-2" style={{ borderColor: 'var(--stone-light)' }}>
            <p className="text-[11px] font-semibold mt-2 mb-1" style={{ color: 'var(--navy-soft)' }}>לציבור</p>
            <div className="grid grid-cols-2 gap-1">
              {PUBLIC_LINKS.map(l => <NavLink key={l.href} {...l} pathname={pathname} />)}
            </div>
            <p className="text-[11px] font-semibold mt-3 mb-1" style={{ color: 'var(--navy-soft)' }}>מקצועי</p>
            <div className="grid grid-cols-2 gap-1">
              {PRO_LINKS.map(l => <NavLink key={l.href} {...l} pathname={pathname} />)}
            </div>
            <Link href="/tour" className="mt-3 block text-center px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>
              מצגת: סיור מודרך באתרים
            </Link>
            <EditorButton compact />
          </div>
        )}
      </nav>

      <EditorNotice />
      {source === 'demo' && (
        <div className="no-print text-center text-xs py-1.5 px-4" style={{ backgroundColor: 'var(--amber-pale)', color: 'var(--amber-dark)' }}>
          המאגר אינו זמין כרגע — מוצגים נתוני הגיבוי המובנים
        </div>
      )}

      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>

      <footer className="mt-12 py-6 text-center glass-card no-print" style={{ borderRadius: 0, borderInline: 'none', borderBottom: 'none' }}>
        <div className="flex items-center justify-center gap-2 text-xs px-4" style={{ color: 'var(--navy-soft)' }}>
          <Image src="/dolphin.svg" alt="" width={16} height={16} style={{ opacity: 0.5 }} />
          <span>SHIMUR.ASHDOD · עיריית אשדוד — יחידת השימור</span>
        </div>
      </footer>
    </div>
  );
}

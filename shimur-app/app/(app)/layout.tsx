import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PRO_LINKS = [
  { href: '/overview', label: 'סקירה כללית' },
  { href: '/map', label: 'מפה' },
  { href: '/timeline', label: 'ציר זמן' },
  { href: '/buildings', label: 'ניהול רשומות' },
  { href: '/buildings/detail', label: 'פירוט אתרים' },
  { href: '/field', label: 'שטח' },
  { href: '/documents', label: 'מסמכים' },
];

const PUBLIC_LINKS = [
  { href: '/routes', label: 'מסלולים' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--parchment)' }}>
      <nav className="bg-white shadow-sm sticky top-0 z-40" style={{ borderBottom: '1px solid var(--stone-light)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/dolphin.svg" alt="" width={22} height={22} style={{ color: 'var(--ocean)' }} />
            <div>
              <Link href="/map" className="text-lg font-serif font-bold" style={{ color: 'var(--stone-dark)' }}>
                SHIMUR.ASHDOD
              </Link>
              <div className="water-line mt-0.5" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {PRO_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-parchment"
                style={{ color: 'var(--ink)' }}
              >
                {label}
              </Link>
            ))}

            <div className="w-px h-6 mx-2" style={{ backgroundColor: 'var(--stone-light)' }} />

            {PUBLIC_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-ocean-pale"
                style={{ color: 'var(--ocean)' }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer
        className="bg-white mt-12 py-6 text-center"
        style={{ borderTop: '1px solid var(--stone-light)' }}
      >
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
          <Image src="/dolphin.svg" alt="" width={16} height={16} style={{ opacity: 0.5 }} />
          <span>SHIMUR.ASHDOD v2.0 | עיריית אשדוד — יחידת שימור</span>
        </div>
      </footer>
    </div>
  );
}

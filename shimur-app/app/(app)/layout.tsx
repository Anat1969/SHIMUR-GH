import React from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/overview', label: 'סקירה כללית' },
  { href: '/map', label: 'מפה' },
  { href: '/timeline', label: 'ציר זמן' },
  { href: '/buildings', label: 'ניהול רשומות' },
  { href: '/buildings/detail', label: 'פירוט אתרים' },
  { href: '/field', label: 'שטח' },
  { href: '/documents', label: 'מסמכים' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F0E3' }}>
      <nav className="bg-white border-b-2 shadow-sm sticky top-0 z-40" style={{ borderColor: '#EDE0CC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/map" className="text-lg font-serif font-bold" style={{ color: '#8B7355' }}>
            SHIMUR.ASHDOD
          </Link>

          <div className="flex gap-6 items-center">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium transition-colors hover:text-stone-dark"
                style={{ color: '#1A1410' }}
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

      <footer className="bg-white border-t mt-12 py-6 text-center text-xs" style={{ borderColor: '#EDE0CC', color: '#3D3228' }}>
        <p>SHIMUR.ASHDOD v2.0 | עיריית אשדוד</p>
      </footer>
    </div>
  );
}

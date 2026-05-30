import React from 'react';
import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F7F0E3' }}>
      <nav className="bg-white border-b-2 shadow-sm sticky top-0 z-40" style={{ borderColor: '#EDE0CC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/map" className="text-lg font-serif font-bold" style={{ color: '#8B7355' }}>
            SHIMUR.ASHDOD
          </Link>

          <div className="flex gap-4 items-center">
            <Link href="/map" className="text-sm transition-colors" style={{ color: '#1A1410' }}>
              מפה
            </Link>
            <Link href="/buildings" className="text-sm transition-colors" style={{ color: '#1A1410' }}>
              מבנים
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm transition-colors"
                style={{ color: '#C4582A' }}
              >
                התחברות חוזרת
              </button>
            </form>
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

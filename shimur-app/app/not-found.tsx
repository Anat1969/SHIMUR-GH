import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F7F0E3' }}>
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="text-7xl font-serif font-bold" style={{ color: '#C8B89A' }}>404</div>

        <div>
          <h1 className="text-2xl font-semibold text-ink mb-2">העמוד לא נמצא</h1>
          <p className="text-ink-soft">
            הדף שחיפשת לא קיים עדיין, או שהכתובת שגויה.
          </p>
        </div>

        {/* Helpful nav */}
        <div className="bg-white rounded-lg border border-stone-light p-5 text-right space-y-3">
          <p className="text-xs font-semibold text-ink-soft uppercase">דפים זמינים</p>
          {[
            { href: '/map', label: 'מפת מבנים', desc: 'כל המבנים על המפה' },
            { href: '/buildings', label: 'רשימת מבנים', desc: 'טבלת כל המבנים' },
            { href: '/field', label: 'מצב שטח', desc: 'תיעוד בשטח' },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between p-3 rounded-md hover:bg-parchment transition-colors"
              style={{ borderBottom: '1px solid #EDE0CC' }}
            >
              <span className="text-sm text-ink-soft">{desc}</span>
              <span className="text-sm font-medium" style={{ color: '#8B7355' }}>{label}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/map"
          className="inline-block px-8 py-3 text-white font-medium rounded-md transition-colors text-sm"
          style={{ backgroundColor: '#8B7355' }}
        >
          חזרה למפה
        </Link>
      </div>
    </div>
  );
}

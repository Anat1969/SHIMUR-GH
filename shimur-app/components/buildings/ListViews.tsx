import Link from 'next/link';

// שלוש תצוגות של אותה רשימת אתרים, בסדר העבודה: מה ברשימה, מה מצב התיק, ותיעוד בשטח.
export type ListView = 'manage' | 'register' | 'field';

const VIEWS: { id: ListView; href: string; label: string; question: string; accent: string }[] = [
  { id: 'register', href: '/buildings/detail', label: 'פירוט אתרים', question: 'מה כתוב ברשימה הרשמית, בכל הפרמטרים?', accent: 'var(--navy)' },
  { id: 'manage', href: '/buildings', label: 'ניהול רשומות', question: 'איפה עומד כל תיק, ומה הצעד הבא?', accent: 'var(--amber)' },
  { id: 'field', href: '/field', label: 'תיעוד בשטח', question: 'איזה אתר קרוב אליי, ואיך מתעדים אותו?', accent: 'var(--sage)' },
];

export function ListViews({ current }: { current: ListView }) {
  return (
    <nav aria-label="שלוש תצוגות של רשימת האתרים" className="no-print">
      <p className="text-[11px] font-semibold mb-1.5" style={{ color: 'var(--navy-soft)' }}>שלוש תצוגות של אותה רשימה</p>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {VIEWS.map(v => {
          const active = v.id === current;
          return (
            <Link key={v.id} href={v.href} aria-current={active ? 'page' : undefined}
              className="rounded-lg px-3 py-2 sm:py-2.5 transition-colors min-w-0"
              style={{
                backgroundColor: active ? 'white' : 'transparent',
                border: `1px solid ${active ? v.accent : 'var(--stone-light)'}`,
                borderTopWidth: active ? 3 : 1,
              }}>
              <span className="block text-sm font-semibold truncate" style={{ color: active ? 'var(--navy)' : 'var(--navy-soft)' }}>{v.label}</span>
              <span className="hidden sm:block text-xs mt-0.5" style={{ color: 'var(--navy-soft)' }}>{v.question}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import Link from 'next/link';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

export default function OverviewPage() {
  const buildings = DEMO_BUILDINGS;

  // Statistics
  const byPriority = {
    'גבוהה': buildings.filter(b => b.priority_level === 'גבוהה').length,
    'בינונית': buildings.filter(b => b.priority_level === 'בינונית').length,
    'נמוכה': buildings.filter(b => b.priority_level === 'נמוכה').length,
  };
  const byProtection = {
    'א': buildings.filter(b => b.protection_level === 'א').length,
    'ב': buildings.filter(b => b.protection_level === 'ב').length,
    'ג': buildings.filter(b => b.protection_level === 'ג').length,
  };
  const neighborhoods = [...new Set(buildings.map(b => b.neighborhood).filter(Boolean))];
  const typeGroups: Record<string, number> = {};
  buildings.forEach(b => {
    const t = b.building_type ?? b.style ?? 'אחר';
    typeGroups[t] = (typeGroups[t] ?? 0) + 1;
  });
  const reasons: Record<string, number> = {};
  buildings.forEach(b => {
    (b.preservation_reasons ?? []).forEach(r => { reasons[r] = (reasons[r] ?? 0) + 1; });
  });

  const maxPriority = Math.max(...Object.values(byPriority));

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center pt-4">
        <p className="text-sm tracking-widest uppercase mb-3" style={{ color: '#8B7355' }}>
          עיריית אשדוד — יחידת שימור
        </p>
        <h1 className="text-4xl font-serif font-bold text-ink mb-4">
          רשימת אתרי השימור של אשדוד
        </h1>
        <p className="text-ink-soft max-w-2xl mx-auto leading-relaxed">
          רשימת השימור העירונית נקבעת מכוח חוק התכנון והבנייה. היא מגדירה אתרים בעלי ערך היסטורי,
          אדריכלי, תרבותי ואקולוגי המחייבים הגנה ותיעוד לפני כל שינוי. האתרים שלהלן מהווים את
          מורשת העיר אשדוד ומשקפים את שכבות ההתיישבות מהתקופה הקדומה ועד ימינו.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { num: buildings.length, label: 'אתרים ברשימה', color: '#8B7355' },
          { num: byProtection['א'] ?? 0, label: 'שימור רמה א׳', color: '#8B3A1E' },
          { num: neighborhoods.length, label: 'שכונות / אזורים', color: '#4A5C45' },
          { num: byPriority['גבוהה'] ?? 0, label: 'עדיפות גבוהה', color: '#C4582A' },
        ].map(({ num, label, color }) => (
          <div key={label} className="bg-white rounded-xl border border-stone-light p-6 text-center">
            <p className="text-4xl font-serif font-bold mb-1" style={{ color }}>{num}</p>
            <p className="text-xs text-ink-soft uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Priority bar chart */}
      <div className="bg-white rounded-xl border border-stone-light p-6">
        <h2 className="text-lg font-serif font-bold text-ink mb-5">חלוקה לפי עדיפות</h2>
        <div className="space-y-4">
          {[
            { label: 'עדיפות גבוהה', count: byPriority['גבוהה'], color: '#8B3A1E' },
            { label: 'עדיפות בינונית', count: byPriority['בינונית'], color: '#C4582A' },
            { label: 'עדיפות נמוכה', count: byPriority['נמוכה'] ?? 0, color: '#8B7355' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="text-sm text-ink-soft w-32 shrink-0">{label}</span>
              <div className="flex-1 h-7 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE0CC' }}>
                <div
                  className="h-full rounded-full flex items-center pr-3 transition-all duration-700"
                  style={{ width: `${(count / maxPriority) * 100}%`, backgroundColor: color }}
                >
                  <span className="text-white text-xs font-bold">{count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: types + reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Types */}
        <div className="bg-white rounded-xl border border-stone-light p-6">
          <h2 className="text-lg font-serif font-bold text-ink mb-4">סוגי אתרים</h2>
          <div className="space-y-2">
            {Object.entries(typeGroups).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center py-1.5 border-b border-stone-light last:border-0">
                <span className="text-sm text-ink">{type}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#EDE3D0', color: '#8B7355' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preservation reasons */}
        <div className="bg-white rounded-xl border border-stone-light p-6">
          <h2 className="text-lg font-serif font-bold text-ink mb-4">סיבות שימור</h2>
          <div className="space-y-2">
            {Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
              <div key={reason} className="flex justify-between items-center py-1.5 border-b border-stone-light last:border-0">
                <span className="text-sm text-ink">{reason}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full" style={{ width: `${count * 16}px`, backgroundColor: '#4A5C45', opacity: 0.7 }} />
                  <span className="text-xs font-bold" style={{ color: '#4A5C45' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neighborhoods */}
      <div className="bg-white rounded-xl border border-stone-light p-6">
        <h2 className="text-lg font-serif font-bold text-ink mb-4">פיזור גיאוגרפי</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {neighborhoods.map(n => {
            const count = buildings.filter(b => b.neighborhood === n).length;
            return (
              <div key={n} className="rounded-lg p-4 text-center" style={{ backgroundColor: '#F7F0E3', border: '1px solid #EDE0CC' }}>
                <p className="font-semibold text-ink text-lg">{count}</p>
                <p className="text-xs text-ink-soft mt-1">{n}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Protection levels */}
      <div className="bg-white rounded-xl border border-stone-light p-6">
        <h2 className="text-lg font-serif font-bold text-ink mb-4">רמות שימור</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { level: 'א', label: 'שימור מלא', desc: 'אין לשנות חזות וגוף המבנה', color: '#8B3A1E' },
            { level: 'ב', label: 'שימור חזית', desc: 'ניתן לשנות את הפנים', color: '#C4582A' },
            { level: 'ג', label: 'שימור חלקי', desc: 'שמירה על אלמנטים נבחרים', color: '#8B7355' },
          ].map(({ level, label, desc, color }) => (
            <div key={level} className="rounded-lg p-5" style={{ backgroundColor: '#F7F0E3', border: `2px solid ${color}20` }}>
              <p className="text-3xl font-serif font-bold mb-1" style={{ color }}>{byProtection[level as keyof typeof byProtection] ?? 0}</p>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color }}>רמה {level} — {label}</p>
              <p className="text-xs text-ink-soft">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-4 justify-center flex-wrap pb-6">
        {[
          { href: '/map', label: 'צפה במפה', bg: '#8B7355' },
          { href: '/buildings/detail', label: 'פירוט אתרים', bg: '#4A5C45' },
          { href: '/buildings', label: 'ניהול רשומות', bg: 'white', border: '#C8B89A', color: '#8B7355' },
        ].map(({ href, label, bg, border, color }) => (
          <Link
            key={href}
            href={href}
            className="px-8 py-3 font-medium rounded-lg text-sm transition-colors"
            style={{ backgroundColor: bg, color: color ?? 'white', border: border ? `1px solid ${border}` : 'none' }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

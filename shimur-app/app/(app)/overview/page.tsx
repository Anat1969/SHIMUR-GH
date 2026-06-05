'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { DEMO_ROUTES } from '@/lib/demo/routes';
import { Building } from '@/lib/types';

type Selection = { label: string; sites: Building[] } | null;

export default function OverviewPage() {
  const buildings = DEMO_BUILDINGS;
  const [selected, setSelected] = useState<Selection>(null);

  const select = (label: string, sites: Building[]) => {
    setSelected(s => (s?.label === label ? null : { label, sites }));
  };

  const byPriority = {
    'גבוהה': buildings.filter(b => b.priority_level === 'גבוהה'),
    'בינונית': buildings.filter(b => b.priority_level === 'בינונית'),
    'נמוכה': buildings.filter(b => b.priority_level === 'נמוכה'),
  };
  const byProtection = {
    'א': buildings.filter(b => b.protection_level === 'א'),
    'ב': buildings.filter(b => b.protection_level === 'ב'),
    'ג': buildings.filter(b => b.protection_level === 'ג'),
  };
  const neighborhoods = [...new Set(buildings.map(b => b.neighborhood).filter(Boolean) as string[])];
  const typeGroups: Record<string, Building[]> = {};
  buildings.forEach(b => {
    const t = b.building_type ?? b.style ?? 'אחר';
    typeGroups[t] = [...(typeGroups[t] ?? []), b];
  });
  const reasons: Record<string, Building[]> = {};
  buildings.forEach(b => {
    (b.preservation_reasons ?? []).forEach(r => { reasons[r] = [...(reasons[r] ?? []), b]; });
  });

  const maxPriority = Math.max(...Object.values(byPriority).map(a => a.length));

  const SelectedPanel = () => !selected ? null : (
    <div className="fixed right-0 top-0 w-96 h-screen shadow-2xl z-40 p-6 overflow-y-auto flex flex-col gap-4"
      style={{ background: 'linear-gradient(180deg, var(--stone-light) 0%, var(--parchment) 100%)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>{selected.label}</h3>
        <button onClick={() => setSelected(null)} className="text-lg px-3 py-1 rounded hover:bg-white"
          style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--stone-dark)' }}>×</button>
      </div>
      <p className="text-xs border-b pb-3 mb-2" style={{ color: 'var(--navy-soft)', borderColor: 'var(--stone)' }}>
        {selected.sites.length} אתרים בחרו
      </p>
      <div className="space-y-2 flex-1">
        {selected.sites.map(b => (
          <Link key={b.id} href={`/buildings/${b.id}`}
            className="block p-3 rounded-lg hover:bg-white transition-colors"
            style={{ borderRight: '4px solid var(--amber)', backgroundColor: '#FAFAF8' }}>
            <span className="font-mono text-xs block" style={{ color: 'var(--navy-soft)' }}>{b.city_registry_id}</span>
            <span className="text-sm font-medium block mt-1" style={{ color: 'var(--navy)' }}>{b.name}</span>
            <span className="text-xs block mt-1" style={{ color: 'var(--navy-soft)' }}>{b.address}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
    <div className={selected ? 'blur-sm pointer-events-none' : ''}>
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="page-intro">
        <p className="text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--ocean)' }}>עיריית אשדוד — יחידת שימור</p>
        <h1 className="text-4xl font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>רשימת אתרי השימור של אשדוד</h1>
        <p className="max-w-2xl leading-relaxed" style={{ color: 'var(--navy-soft)' }}>
          רשימת השימור העירונית נקבעת מכוח <span className="highlight-text">חוק התכנון והבנייה</span>, ומגדירה אתרים בעלי ערך
          <span className="highlight-text">היסטורי, אדריכלי, תרבותי ואקולוגי</span>
          המחייבים הגנה ותיעוד לפני כל שינוי.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--navy-soft)' }}>לחץ על כל נתון מספרי לצפייה ברשימת האתרים</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { num: buildings.length, label: 'אתרים ברשימה', sites: buildings, color: 'var(--amber)' },
          { num: byProtection['א'].length, label: 'שימור רמה א׳', sites: byProtection['א'], color: 'var(--rust)' },
          { num: byPriority['גבוהה'].length, label: 'עדיפות גבוהה', sites: byPriority['גבוהה'], color: 'var(--amber-dark)' },
          { num: neighborhoods.length, label: 'אזורים', sites: [], color: 'var(--ocean)', disabled: true },
        ].map(({ num, label, sites, color, disabled }) => {
          const key = label;
          const isActive = selected?.label === key;
          return disabled ? (
            <div key={key} className="glass-card p-6 text-center opacity-50 cursor-not-allowed">
              <p className="text-4xl font-serif font-bold mb-1" style={{ color }}>{num}</p>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--navy-soft)' }}>{label}</p>
            </div>
          ) : (
            <button key={key} onClick={() => select(key, sites)}
              className="glass-card p-6 text-center transition-all hover:shadow-md"
              style={{ borderColor: isActive ? color : undefined, borderWidth: isActive ? 2 : undefined, cursor: 'pointer' }}>
              <p className="text-4xl font-serif font-bold mb-1" style={{ color }}>{num}</p>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--navy-soft)' }}>{label}</p>
            </button>
          );
        })}
      </div>

      {/* מסלולים אחרונים */}
      <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, var(--ocean-pale) 0%, var(--parchment) 100%)', border: '1px solid var(--ocean-pale)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold" style={{ color: 'var(--navy)' }}>מסלולי סיור</h2>
          <Link href="/routes" className="text-sm font-medium transition-colors" style={{ color: 'var(--ocean)' }}>
            כל המסלולים →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMO_ROUTES.slice(0, 3).map(route => (
            <Link key={route.id} href={`/routes/${route.id}`}
              className="bg-white rounded-lg p-4 transition-all hover:shadow-md"
              style={{ border: '1px solid var(--ocean-pale)' }}>
              <h3 className="font-serif font-bold text-sm mb-1" style={{ color: 'var(--navy)' }}>{route.title}</h3>
              <p className="text-xs mb-2" style={{ color: 'var(--navy-soft)' }}>
                {route.description?.slice(0, 80)}…
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}>
                {route.sites?.length ?? 0} אתרים
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card p-6" style={{  }}>
        <h2 className="text-lg font-serif font-bold mb-5" style={{ color: 'var(--navy)' }}>עדיפות טיפול ורמת שימור</h2>
        <div className="space-y-4">
          {[
            { label: 'עדיפות גבוהה', group: byPriority['גבוהה'], color: 'var(--rust)' },
            { label: 'עדיפות בינונית', group: byPriority['בינונית'], color: 'var(--amber)' },
            { label: 'עדיפות נמוכה', group: byPriority['נמוכה'] ?? [], color: 'var(--stone-dark)' },
          ].map(({ label, group, color }) => {
            const isActive = selected?.label === label;
            return (
              <div key={label}>
                <div className="flex items-center gap-4">
                  <button onClick={() => select(label, group)}
                    className="text-sm shrink-0 hover:underline w-36 text-right" style={{ color: 'var(--navy-soft)' }}>
                    {label} ({group.length})
                  </button>
                  <div className="flex-1 h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--parchment-deep)' }}>
                    <button onClick={() => select(label, group)}
                      className="h-full rounded-full flex items-center pr-3 transition-all duration-500 hover:opacity-90"
                      style={{ width: `${(group.length / maxPriority) * 100}%`, backgroundColor: color, outline: isActive ? `2px solid ${color}` : 'none' }}>
                      <span className="text-white text-xs font-bold">{group.length}</span>
                    </button>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {['א', 'ב', 'ג'].map(level => {
                      const cnt = group.filter(b => b.protection_level === level).length;
                      return cnt > 0 ? (
                        <button key={level} onClick={() => select(`${label} — רמה ${level}`, group.filter(b => b.protection_level === level))}
                          className="text-xs px-1.5 py-0.5 rounded font-bold hover:opacity-80"
                          style={{ backgroundColor: 'var(--parchment)', color: 'var(--rust)', border: '1px solid var(--parchment-deep)' }}>
                          {level}:{cnt}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6" style={{  }}>
          <h2 className="text-lg font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>סוגי אתרים</h2>
          <div className="space-y-2">
            {Object.entries(typeGroups).sort((a, b) => b[1].length - a[1].length).map(([type, sites]) => {
              const isActive = selected?.label === type;
              return (
                <button key={type} onClick={() => select(type, sites)}
                  className="flex justify-between items-center py-1.5 w-full last:border-0 hover:bg-parchment px-2 rounded transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--parchment-deep)' : undefined, borderBottom: '1px solid var(--stone-light)' }}>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--stone-dark)' }}>{sites.length}</span>
                  <span className="text-sm" style={{ color: 'var(--navy)' }}>{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6" style={{  }}>
          <h2 className="text-lg font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>סיבות שימור</h2>
          <div className="space-y-2">
            {Object.entries(reasons).sort((a, b) => b[1].length - a[1].length).map(([reason, sites]) => {
              const isActive = selected?.label === `סיבה: ${reason}`;
              return (
                <button key={reason} onClick={() => select(`סיבה: ${reason}`, sites)}
                  className="flex justify-between items-center py-1.5 w-full last:border-0 hover:bg-parchment px-2 rounded transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--parchment-deep)' : undefined, borderBottom: '1px solid var(--stone-light)' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full" style={{ width: `${sites.length * 14}px`, backgroundColor: 'var(--sage)', opacity: 0.7 }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--sage)' }}>{sites.length}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--navy)' }}>{reason}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card p-6" style={{  }}>
        <h2 className="text-lg font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>פיזור גיאוגרפי</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {neighborhoods.map(n => {
            const sites = buildings.filter(b => b.neighborhood === n);
            const isActive = selected?.label === n;
            return (
              <button key={n} onClick={() => select(n, sites)}
                className="rounded-lg p-4 text-center transition-all hover:shadow-sm"
                style={{ backgroundColor: isActive ? 'var(--parchment-deep)' : 'var(--parchment)', border: isActive ? '2px solid var(--stone)' : '1px solid var(--stone-light)' }}>
                <p className="font-semibold text-lg" style={{ color: 'var(--navy)' }}>{sites.length}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--navy-soft)' }}>{n}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 justify-center flex-wrap pb-6">
        {[
          { href: '/map', label: 'צפה במפה', bg: 'var(--stone-dark)', color: 'white' },
          { href: '/routes', label: 'מסלולי סיור', bg: 'var(--ocean)', color: 'white' },
          { href: '/timeline', label: 'ציר זמן', bg: 'var(--sage)', color: 'white' },
          { href: '/buildings/detail', label: 'פירוט אתרים', bg: 'white', border: 'var(--stone)', color: 'var(--stone-dark)' },
        ].map(({ href, label, bg, border, color }) => (
          <Link key={href} href={href}
            className="px-8 py-3 font-medium rounded-lg text-sm transition-colors"
            style={{ backgroundColor: bg, color, border: border ? `1px solid ${border}` : 'none' }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
    </div>
    {selected && <SelectedPanel />}
    </>
  );
}

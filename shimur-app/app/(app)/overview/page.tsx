'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { Building } from '@/lib/types';

type Selection = { label: string; sites: Building[] } | null;

export default function OverviewPage() {
  const buildings = DEMO_BUILDINGS;
  const [selected, setSelected] = useState<Selection>(null);

  const select = (label: string, sites: Building[]) => {
    setSelected(s => (s?.label === label ? null : { label, sites }));
  };

  // Stats
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
    <div className="bg-white rounded-xl border-2 p-5 space-y-3" style={{ borderColor: '#C8B89A' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">{selected.label} — {selected.sites.length} אתרים</h3>
        <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#EDE0CC', color: '#8B7355' }}>× סגור</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {selected.sites.map(b => (
          <Link key={b.id} href={`/buildings/${b.id}`}
            className="flex items-center gap-2 p-2 rounded hover:bg-parchment transition-colors"
            style={{ border: '1px solid #EDE0CC' }}>
            <span className="font-mono text-xs text-ink-soft">{b.city_registry_id}</span>
            <span className="text-sm text-ink">{b.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center pt-4">
        <p className="text-sm tracking-widest uppercase mb-3" style={{ color: '#8B7355' }}>עיריית אשדוד — יחידת שימור</p>
        <h1 className="text-4xl font-serif font-bold text-ink mb-4">רשימת אתרי השימור של אשדוד</h1>
        <p className="text-ink-soft max-w-2xl mx-auto leading-relaxed">
          רשימת השימור העירונית נקבעת מכוח חוק התכנון והבנייה, ומגדירה אתרים בעלי ערך היסטורי, אדריכלי, תרבותי ואקולוגי
          המחייבים הגנה ותיעוד לפני כל שינוי.
        </p>
        <p className="text-xs text-ink-soft mt-2">לחץ על כל נתון מספרי לצפייה ברשימת האתרים</p>
      </div>

      {/* Stat cards — clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { num: buildings.length, label: 'אתרים ברשימה', sites: buildings, color: '#8B7355' },
          { num: byProtection['א'].length, label: 'שימור רמה א׳', sites: byProtection['א'], color: '#8B3A1E' },
          { num: neighborhoods.length, label: 'אזורים', sites: buildings.filter(b => !!b.neighborhood), color: '#4A5C45' },
          { num: byPriority['גבוהה'].length, label: 'עדיפות גבוהה', sites: byPriority['גבוהה'], color: '#C4582A' },
        ].map(({ num, label, sites, color }) => {
          const key = label;
          const isActive = selected?.label === key;
          return (
            <button key={key} onClick={() => select(key, sites)}
              className="bg-white rounded-xl border p-6 text-center transition-all hover:shadow-md"
              style={{ borderColor: isActive ? color : '#EDE0CC', borderWidth: isActive ? 2 : 1, cursor: 'pointer' }}>
              <p className="text-4xl font-serif font-bold mb-1" style={{ color }}>{num}</p>
              <p className="text-xs text-ink-soft uppercase tracking-wide">{label}</p>
            </button>
          );
        })}
      </div>
      <SelectedPanel />

      {/* Priority + Protection combined */}
      <div className="bg-white rounded-xl border border-stone-light p-6">
        <h2 className="text-lg font-serif font-bold text-ink mb-5">עדיפות טיפול ורמת שימור</h2>
        <div className="space-y-4">
          {[
            { label: 'עדיפות גבוהה', group: byPriority['גבוהה'], color: '#8B3A1E' },
            { label: 'עדיפות בינונית', group: byPriority['בינונית'], color: '#C4582A' },
            { label: 'עדיפות נמוכה', group: byPriority['נמוכה'] ?? [], color: '#8B7355' },
          ].map(({ label, group, color }) => {
            const isActive = selected?.label === label;
            return (
              <div key={label}>
                <div className="flex items-center gap-4">
                  <button onClick={() => select(label, group)}
                    className="text-sm text-ink-soft shrink-0 hover:underline w-36 text-right">{label} ({group.length})</button>
                  <div className="flex-1 h-8 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE0CC' }}>
                    <button onClick={() => select(label, group)}
                      className="h-full rounded-full flex items-center pr-3 transition-all duration-500 hover:opacity-90"
                      style={{ width: `${(group.length / maxPriority) * 100}%`, backgroundColor: color, outline: isActive ? `2px solid ${color}` : 'none' }}>
                      <span className="text-white text-xs font-bold">{group.length}</span>
                    </button>
                  </div>
                  {/* Mini protection breakdown */}
                  <div className="flex gap-1 shrink-0">
                    {['א', 'ב', 'ג'].map(level => {
                      const cnt = group.filter(b => b.protection_level === level).length;
                      return cnt > 0 ? (
                        <button key={level} onClick={() => select(`${label} — רמה ${level}`, group.filter(b => b.protection_level === level))}
                          className="text-xs px-1.5 py-0.5 rounded font-bold hover:opacity-80"
                          style={{ backgroundColor: '#F7F0E3', color: '#8B3A1E', border: '1px solid #EDE0CC' }}>
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
      <SelectedPanel />

      {/* Types + Reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-stone-light p-6">
          <h2 className="text-lg font-serif font-bold text-ink mb-4">סוגי אתרים</h2>
          <div className="space-y-2">
            {Object.entries(typeGroups).sort((a, b) => b[1].length - a[1].length).map(([type, sites]) => {
              const isActive = selected?.label === type;
              return (
                <button key={type} onClick={() => select(type, sites)}
                  className="flex justify-between items-center py-1.5 w-full border-b border-stone-light last:border-0 hover:bg-parchment px-2 rounded transition-colors"
                  style={{ backgroundColor: isActive ? '#EDE3D0' : undefined }}>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#EDE3D0', color: '#8B7355' }}>{sites.length}</span>
                  <span className="text-sm text-ink">{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-light p-6">
          <h2 className="text-lg font-serif font-bold text-ink mb-4">סיבות שימור</h2>
          <div className="space-y-2">
            {Object.entries(reasons).sort((a, b) => b[1].length - a[1].length).map(([reason, sites]) => {
              const isActive = selected?.label === `סיבה: ${reason}`;
              return (
                <button key={reason} onClick={() => select(`סיבה: ${reason}`, sites)}
                  className="flex justify-between items-center py-1.5 w-full border-b border-stone-light last:border-0 hover:bg-parchment px-2 rounded transition-colors"
                  style={{ backgroundColor: isActive ? '#EDE3D0' : undefined }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full" style={{ width: `${sites.length * 14}px`, backgroundColor: '#4A5C45', opacity: 0.7 }} />
                    <span className="text-xs font-bold" style={{ color: '#4A5C45' }}>{sites.length}</span>
                  </div>
                  <span className="text-sm text-ink">{reason}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <SelectedPanel />

      {/* Neighborhoods */}
      <div className="bg-white rounded-xl border border-stone-light p-6">
        <h2 className="text-lg font-serif font-bold text-ink mb-4">פיזור גיאוגרפי</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {neighborhoods.map(n => {
            const sites = buildings.filter(b => b.neighborhood === n);
            const isActive = selected?.label === n;
            return (
              <button key={n} onClick={() => select(n, sites)}
                className="rounded-lg p-4 text-center transition-all hover:shadow-sm"
                style={{ backgroundColor: isActive ? '#EDE3D0' : '#F7F0E3', border: isActive ? '2px solid #C8B89A' : '1px solid #EDE0CC' }}>
                <p className="font-semibold text-ink text-lg">{sites.length}</p>
                <p className="text-xs text-ink-soft mt-1">{n}</p>
              </button>
            );
          })}
        </div>
      </div>
      <SelectedPanel />

      {/* CTA */}
      <div className="flex gap-4 justify-center flex-wrap pb-6">
        {[
          { href: '/map', label: 'צפה במפה', bg: '#8B7355' },
          { href: '/timeline', label: 'ציר זמן', bg: '#4A5C45' },
          { href: '/buildings/detail', label: 'פירוט אתרים', bg: 'white', border: '#C8B89A', color: '#8B7355' },
        ].map(({ href, label, bg, border, color }) => (
          <Link key={href} href={href}
            className="px-8 py-3 font-medium rounded-lg text-sm transition-colors"
            style={{ backgroundColor: bg, color: color ?? 'white', border: border ? `1px solid ${border}` : 'none' }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

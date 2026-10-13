'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SiteImage } from '@/components/sites/SiteImage';
import { VerifyTag } from '@/components/sites/ListInfo';
import { Building, BuildingStatus, STATUS_COLORS, STATUS_LABELS } from '@/lib/types';

export interface BuildingWithActivity extends Building {
  lastActivity: { date: string; note: string } | null;
}

// סדר שלבי התיעוד. "הוחזר" הוא שלב חוזר, ולכן מוצג לפני "הוגש".
const STAGES: BuildingStatus[] = ['לא_התחיל', 'בתהליך', 'הוחזר', 'הוגש', 'אושר'];

const NEXT_STEP: Record<BuildingStatus, string> = {
  'לא_התחיל': 'לפתוח תיק תיעוד ולאסוף חומר ארכיוני',
  'בתהליך': 'להשלים את פרקי התיק',
  'הוחזר': 'לתקן לפי הערות הוועדה ולהגיש שוב',
  'הוגש': 'ממתין לבדיקת הוועדה',
  'אושר': 'התיק הושלם',
};

const PRIORITY_ORDER: Record<string, number> = { 'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2 };
const PRIORITY_COLORS: Record<string, string> = { 'גבוהה': '#8B3A1E', 'בינונית': '#D4922A', 'נמוכה': '#8B7355' };

export function WorkflowBoard({ buildings }: { buildings: BuildingWithActivity[] }) {
  const [stage, setStage] = useState<BuildingStatus | null>(null);
  const [highOnly, setHighOnly] = useState(false);
  const [query, setQuery] = useState('');

  const counts = useMemo(() => Object.fromEntries(STAGES.map(s => [s, buildings.filter(b => b.status === s).length])) as Record<BuildingStatus, number>, [buildings]);

  const visible = useMemo(() => {
    const q = query.trim();
    return buildings
      .filter(b => (!stage || b.status === stage) && (!highOnly || b.priority_level === 'גבוהה') && (!q || [b.name, b.address, b.neighborhood].some(v => v?.includes(q))))
      .sort((a, b) => (PRIORITY_ORDER[a.priority_level ?? ''] ?? 3) - (PRIORITY_ORDER[b.priority_level ?? ''] ?? 3) || Number(a.id) - Number(b.id));
  }, [buildings, stage, highOnly, query]);

  const groups = STAGES.map(s => ({ s, list: visible.filter(b => b.status === s) })).filter(g => g.list.length > 0);
  const total = buildings.length || 1;

  return (
    <div className="space-y-6">
      {/* צינור התיעוד: כמה תיקים בכל שלב. לחיצה מסננת. */}
      <section aria-labelledby="pipeline" className="glass-card p-5 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="pipeline" className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>צינור התיעוד</h2>
          <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>כל אתר עובר חמישה שלבים, עד אישור התיק בוועדה. לחיצה על שלב מציגה רק אותו.</p>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden" aria-hidden="true" style={{ backgroundColor: 'var(--parchment-deep)' }}>
          {STAGES.map(s => counts[s] > 0 && <div key={s} style={{ width: `${(counts[s] / total) * 100}%`, backgroundColor: STATUS_COLORS[s] }} />)}
        </div>
        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STAGES.map((s, i) => {
            const active = stage === s;
            return (
              <li key={s}>
                <button onClick={() => setStage(v => v === s ? null : s)} aria-pressed={active}
                  className="w-full text-right rounded-lg p-3 transition-colors"
                  style={{ backgroundColor: active ? 'white' : 'var(--parchment)', border: `1px solid ${active ? STATUS_COLORS[s] : 'var(--stone-light)'}`, borderInlineStartWidth: 4, borderInlineStartColor: STATUS_COLORS[s] }}>
                  <span className="block text-[11px] font-mono" style={{ color: 'var(--navy-soft)' }}>שלב {i + 1}</span>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--navy)' }}>{STATUS_LABELS[s]}</span>
                    <span className="text-2xl font-serif font-bold" style={{ color: counts[s] ? STATUS_COLORS[s] : 'var(--stone)' }}>{counts[s]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="חיפוש לפי שם, כתובת או מקבץ"
          aria-label="חיפוש אתר" className="flex-1 min-w-0 sm:max-w-xs px-3 py-2.5 rounded-lg text-sm"
          style={{ border: '1px solid var(--stone)', backgroundColor: 'white', color: 'var(--navy)' }} />
        <button onClick={() => setHighOnly(v => !v)} aria-pressed={highOnly}
          className="px-4 py-2.5 rounded-lg text-sm whitespace-nowrap"
          style={{ border: `1px solid ${highOnly ? '#8B3A1E' : 'var(--stone)'}`, backgroundColor: highOnly ? '#8B3A1E' : 'white', color: highOnly ? 'white' : 'var(--navy)' }}>
          עדיפות גבוהה בלבד
        </button>
        {(stage || highOnly || query) && (
          <button onClick={() => { setStage(null); setHighOnly(false); setQuery(''); }} className="text-sm underline px-2" style={{ color: 'var(--rust)' }}>ניקוי</button>
        )}
        <span className="text-xs ms-auto" style={{ color: 'var(--navy-soft)' }}>{visible.length} מתוך {buildings.length} תיקים · ממוינים לפי עדיפות</span>
      </div>

      {groups.length === 0 && (
        <p className="glass-card p-8 text-center text-sm" style={{ color: 'var(--navy-soft)' }}>אין תיקים שתואמים את הסינון. נסי לנקות את הסינון.</p>
      )}

      {groups.map(({ s, list }) => (
        <section key={s} aria-labelledby={`stage-${s}`} className="space-y-2">
          <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 id={`stage-${s}`} className="font-serif font-bold text-lg" style={{ color: STATUS_COLORS[s] }}>{STATUS_LABELS[s]} · {list.length}</h3>
            <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>הצעד הבא: {NEXT_STEP[s]}</p>
          </header>
          <ul className="space-y-2">
            {list.map(b => (
              <li key={b.id} className="rounded-xl flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 sm:p-4"
                style={{ backgroundColor: 'var(--surface-solid)', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--hairline)', borderInlineStartWidth: 5, borderInlineStartColor: PRIORITY_COLORS[b.priority_level ?? ''] ?? 'var(--stone)' }}>
                <SiteImage site={b} size="thumb" />
                <div className="flex-1 min-w-0">
                  <Link href={`/buildings/${b.id}`} className="font-semibold hover:underline" style={{ color: 'var(--navy)' }}>{b.name}</Link>
                  {' '}<VerifyTag site={b} />
                  <p className="text-xs mt-0.5" style={{ color: 'var(--navy-soft)' }}>
                    <span className="font-mono">{b.city_registry_id}</span>
                    {b.neighborhood && ` · ${b.neighborhood}`}
                    {b.protection_level && ` · דרגה ${b.protection_level}׳`}
                  </p>
                </div>
                <div className="w-full sm:w-44 shrink-0 text-xs" style={{ color: 'var(--navy-soft)' }}>
                  <span className="font-semibold whitespace-nowrap" style={{ color: PRIORITY_COLORS[b.priority_level ?? ''] ?? 'var(--stone-dark)' }}>עדיפות {b.priority_level ?? '—'}</span>
                  <span className="block mt-0.5 truncate" title={b.lastActivity?.note}>
                    {b.lastActivity ? `${new Date(b.lastActivity.date).toLocaleDateString('he-IL')} · ${b.lastActivity.note}` : 'אין עדיין פעילות בתיק'}
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <Link href={`/buildings/${b.id}/file`} className="flex-1 sm:flex-none text-center px-4 py-2 rounded-lg text-sm font-semibold text-white whitespace-nowrap" style={{ backgroundColor: 'var(--amber-dark)' }}>תיק תיעוד</Link>
                  <Link href={`/field/${b.id}`} className="flex-1 sm:flex-none text-center px-4 py-2 rounded-lg text-sm whitespace-nowrap" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>תיעוד בשטח</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

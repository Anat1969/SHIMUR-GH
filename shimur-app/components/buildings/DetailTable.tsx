'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building } from '@/lib/types';

type Col = 'city_registry_id' | 'name' | 'neighborhood' | 'building_type' | 'historical_periods' |
           'owner' | 'preservation_reasons' | 'current_use' | 'priority_level' | 'protection_level' | 'parcel';

const COMPACT_COLS: { key: Col; label: string }[] = [
  { key: 'city_registry_id', label: 'מס׳' },
  { key: 'name', label: 'שם האתר' },
  { key: 'neighborhood', label: 'אזור' },
  { key: 'building_type', label: 'סוג' },
  { key: 'priority_level', label: 'עדיפות' },
  { key: 'protection_level', label: 'רמה' },
];

const ALL_COLS: { key: Col; label: string; width?: string }[] = [
  { key: 'city_registry_id', label: 'מס׳', width: '80px' },
  { key: 'name', label: 'שם האתר', width: '180px' },
  { key: 'neighborhood', label: 'אזור', width: '100px' },
  { key: 'building_type', label: 'סוג', width: '130px' },
  { key: 'historical_periods', label: 'תקופה', width: '130px' },
  { key: 'owner', label: 'בעלות', width: '140px' },
  { key: 'preservation_reasons', label: 'סיבות שימור', width: '150px' },
  { key: 'current_use', label: 'מצב קיים', width: '130px' },
  { key: 'priority_level', label: 'עדיפות', width: '80px' },
  { key: 'protection_level', label: 'רמה', width: '60px' },
  { key: 'parcel', label: 'חלקה', width: '110px' },
];

const PRIORITY_COLORS: Record<string, string> = {
  'גבוהה': '#8B3A1E', 'בינונית': '#C4582A', 'נמוכה': '#8B7355',
};

// Alternating background colors for visual groups
const GROUP_BG = ['#FFFFFF', '#F7F2EA'];

export function DetailTable({ buildings }: { buildings: Building[] }) {
  const [expanded, setExpanded] = useState(false);
  const [sortCol, setSortCol] = useState<Col>('city_registry_id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const handleSort = (col: Col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const getValue = (b: Building, col: Col): string => {
    const v = b[col];
    if (Array.isArray(v)) return v.join(', ');
    return (v as string) ?? '';
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buildings.filter(b =>
      !q || ALL_COLS.some(c => getValue(b, c.key).toLowerCase().includes(q)) ||
      (b.full_description ?? '').toLowerCase().includes(q)
    );
  }, [buildings, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = getValue(a, sortCol);
      const bv = getValue(b, sortCol);
      return sortDir === 'asc' ? av.localeCompare(bv, 'he') : bv.localeCompare(av, 'he');
    });
  }, [filtered, sortCol, sortDir]);

  // Compute group index per row (changes when value changes)
  const groupIndices = useMemo(() => {
    const indices: number[] = [];
    let groupIdx = 0;
    let prevVal = '';
    sorted.forEach((b, i) => {
      const val = getValue(b, sortCol);
      if (i > 0 && val !== prevVal) groupIdx++;
      indices.push(groupIdx);
      prevVal = val;
    });
    return indices;
  }, [sorted, sortCol]);

  const cols = expanded ? ALL_COLS : COMPACT_COLS;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="no-print flex items-center gap-4 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש חופשי בכל השדות..."
          className="px-4 py-2 border rounded-md text-sm flex-1 max-w-sm"
          style={{ borderColor: '#EDE0CC', direction: 'rtl' }} />
        {search && <span className="text-xs text-ink-soft">{filtered.length} תוצאות</span>}
        <button onClick={() => setExpanded(e => !e)}
          className="px-4 py-2 border rounded-md text-sm font-medium transition-colors mr-auto"
          style={{ borderColor: '#C8B89A', color: expanded ? '#4A5C45' : '#8B7355', backgroundColor: expanded ? '#F0F7F0' : 'white' }}>
          {expanded ? '← תצוגה מצומצמת' : 'תצוגה מורחבת →'}
        </button>
      </div>

      {/* Table */}
      <div className={expanded ? 'overflow-x-auto' : ''} style={{ borderRadius: 8, border: '1px solid #EDE0CC' }}>
        <table className="bg-white text-sm w-full" style={expanded ? { minWidth: 1300 } : {}}>
          <thead>
            <tr className="border-b border-stone-light bg-parchment-deep">
              {cols.map(c => (
                <th key={c.key} onClick={() => handleSort(c.key)}
                  className="px-4 py-3 text-right font-semibold text-ink cursor-pointer select-none hover:bg-parchment transition-colors"
                  style={expanded ? { width: (c as any).width, whiteSpace: 'nowrap' } : {}}>
                  {sortCol === c.key ? (sortDir === 'asc' ? '↑ ' : '↓ ') : ''}{c.label}
                </th>
              ))}
              {expanded && <th className="px-4 py-3 text-right font-semibold text-ink" style={{ width: 220 }}>תיאור</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, i) => {
              const gIdx = groupIndices[i];
              const isGroupStart = i > 0 && gIdx !== groupIndices[i - 1];
              const bg = GROUP_BG[gIdx % 2];

              return (
                <tr key={b.id}
                  style={{
                    backgroundColor: bg,
                    borderTop: isGroupStart ? '2px solid #C8B89A' : '1px solid #EDE0CC',
                  }}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">{b.city_registry_id}</td>
                  <td className="px-4 py-3 font-medium" style={expanded ? { minWidth: 180 } : {}}>
                    <Link href={`/buildings/${b.id}`} className="hover:underline" style={{ color: '#1A1410' }}>
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft text-sm">{b.neighborhood ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: '#EDE3D0', color: '#3D3228' }}>
                      {b.building_type ?? b.style ?? '—'}
                    </span>
                  </td>

                  {expanded && <>
                    <td className="px-4 py-3 text-ink-soft text-xs">{(b.historical_periods ?? []).join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{b.owner ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">
                      {(b.preservation_reasons ?? []).map(r => (
                        <span key={r} className="inline-block px-1.5 py-0.5 rounded ml-1 mb-1"
                          style={{ backgroundColor: '#F7F0E3', color: '#4A5C45', border: '1px solid #EDE0CC' }}>{r}</span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-ink-soft text-xs">{b.current_use ?? '—'}</td>
                  </>}

                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: PRIORITY_COLORS[b.priority_level ?? ''] ?? '#8B7355' }}>
                    {b.priority_level ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-sm" style={{ color: '#8B3A1E' }}>{b.protection_level ?? '—'}</td>

                  {expanded && <>
                    <td className="px-4 py-3 text-ink-soft text-xs font-mono">{b.parcel ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-soft text-xs" style={{ maxWidth: 220 }}>
                      <span title={b.full_description ?? ''} className="line-clamp-2 block">
                        {b.full_description ?? b.documentation_reason ?? '—'}
                      </span>
                    </td>
                  </>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-soft no-print">
        {sorted.length} מתוך {buildings.length} אתרים | לחץ על כותרת עמודה למיון | שם האתר = קישור לכרטיס
        {!expanded && ' | לחץ "תצוגה מורחבת" לכל הפרמטרים'}
      </p>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SiteImage } from '@/components/sites/SiteImage';
import { VerifyTag, needsVerification } from '@/components/sites/ListInfo';
import { CLUSTERS } from '@/lib/clusters';
import { Building, LIST_STATUS_LABELS, ListStatus } from '@/lib/types';

// המרשם: הטבלה הרשמית, בעמודות של טבלאות הוועדה (מקבץ, אתר, כתובת, גוש/חלקה, בעלים, טעמי שימור).
type Col = 'committee_no' | 'name' | 'address' | 'parcel' | 'owner' | 'preservation_reasons' | 'protection_level'
  | 'historical_periods' | 'building_type' | 'current_use' | 'priority_level' | 'list_status' | 'city_registry_id' | 'full_description';

interface ColDef { key: Col; label: string; width?: number; full?: boolean }

const COLS: ColDef[] = [
  { key: 'committee_no', label: 'מס׳', width: 52 },
  { key: 'name', label: 'שם האתר', width: 220 },
  { key: 'address', label: 'כתובת', width: 170 },
  { key: 'parcel', label: 'גוש/חלקה', width: 110 },
  { key: 'owner', label: 'בעלים', width: 150 },
  { key: 'preservation_reasons', label: 'טעמי שימור', width: 160 },
  { key: 'protection_level', label: 'דרגה', width: 56 },
  { key: 'historical_periods', label: 'תקופה', width: 150, full: true },
  { key: 'building_type', label: 'סוג', width: 130, full: true },
  { key: 'current_use', label: 'מצב קיים', width: 140, full: true },
  { key: 'priority_level', label: 'עדיפות', width: 80, full: true },
  { key: 'list_status', label: 'מעמד ברשימה', width: 120, full: true },
  { key: 'city_registry_id', label: 'מס׳ רישום', width: 90, full: true },
  { key: 'full_description', label: 'תיאור', width: 260, full: true },
];

const PRIORITY_COLORS: Record<string, string> = { 'גבוהה': '#8B3A1E', 'בינונית': '#A67318', 'נמוכה': '#8B7355' };

function text(b: Building, col: Col): string {
  if (col === 'list_status') return b.list_status ? LIST_STATUS_LABELS[b.list_status] : '';
  const v = b[col as keyof Building];
  if (Array.isArray(v)) return v.join(', ');
  return v == null ? '' : String(v);
}

export function DetailTable({ buildings }: { buildings: Building[] }) {
  const [full, setFull] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [sortCol, setSortCol] = useState<Col>('committee_no');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [listStatus, setListStatus] = useState<ListStatus | 'verify' | null>(null);

  const cols = full ? COLS : COLS.filter(c => !c.full);

  const handleSort = (col: Col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    const q = search.trim();
    return buildings.filter(b =>
      (!listStatus || (listStatus === 'verify' ? needsVerification(b) : b.list_status === listStatus)) &&
      (!q || COLS.some(c => text(b, c.key).includes(q)) || (b.neighborhood ?? '').includes(q)));
  }, [buildings, search, listStatus]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const av = text(a, sortCol), bv = text(b, sortCol);
    // אתר בלי ערך (למשל בלי מספר בוועדה) תמיד בסוף
    if (!av !== !bv) return av ? -1 : 1;
    const r = av.localeCompare(bv, 'he', { numeric: true }) || Number(a.id) - Number(b.id);
    return sortDir === 'asc' ? r : -r;
  }), [filtered, sortCol, sortDir]);

  // קבוצות לפי מקבץ, בסדר המקבצים של הוועדה
  const groups = useMemo(() => {
    if (!grouped) return [{ name: '', list: sorted }];
    const order = [...CLUSTERS.map(c => c.name), ...new Set(sorted.map(b => b.neighborhood ?? 'ללא מקבץ'))];
    return [...new Set(order)]
      .map(name => ({ name, list: sorted.filter(b => (b.neighborhood ?? 'ללא מקבץ') === name) }))
      .filter(g => g.list.length > 0);
  }, [sorted, grouped]);

  const statusOptions = useMemo(
    () => (Object.keys(LIST_STATUS_LABELS) as ListStatus[])
      .map(s => ({ s, n: buildings.filter(b => b.list_status === s).length }))
      .filter(x => x.n > 0),
    [buildings],
  );
  const verifyCount = useMemo(() => buildings.filter(needsVerification).length, [buildings]);

  const chip = (active: boolean, color = '#1B2A4A') => ({
    borderColor: active ? color : '#C8B89A', backgroundColor: active ? color : 'white', color: active ? 'white' : '#3D3228',
  });

  const cell = (b: Building, c: ColDef) => {
    switch (c.key) {
      case 'name':
        return (
          <Link href={`/buildings/${b.id}`} className="flex items-center gap-2.5 font-semibold hover:underline" style={{ color: '#1A1410' }}>
            <SiteImage site={b} size="thumb" className="!w-9 !h-9 !rounded" />
            <span className="min-w-0">{b.name} <VerifyTag site={b} /></span>
          </Link>
        );
      case 'committee_no':
        return <span className="font-mono">{b.committee_no ?? '—'}</span>;
      case 'protection_level':
        return <span className="font-bold" style={{ color: '#8B3A1E' }}>{b.protection_level ?? '—'}</span>;
      case 'priority_level':
        return <span className="font-semibold" style={{ color: PRIORITY_COLORS[b.priority_level ?? ''] ?? '#8B7355' }}>{b.priority_level ?? '—'}</span>;
      case 'preservation_reasons':
        return (b.preservation_reasons ?? []).length
          ? <span className="flex flex-wrap gap-1">{b.preservation_reasons!.map(r => <span key={r} className="px-1.5 py-0.5 rounded text-[11px] whitespace-nowrap" style={{ backgroundColor: '#F7F0E3', color: '#4A5C45', border: '1px solid #EDE0CC' }}>{r}</span>)}</span>
          : '—';
      case 'parcel':
      case 'city_registry_id':
        return <span className="font-mono text-xs">{text(b, c.key) || '—'}</span>;
      case 'full_description':
        return <span title={b.full_description ?? ''} className="line-clamp-2">{b.full_description ?? '—'}</span>;
      default:
        return text(b, c.key) || '—';
    }
  };

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center gap-2 flex-wrap">
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש בכל השדות" aria-label="חיפוש ברשימה"
          className="px-3 py-2.5 border rounded-lg text-sm flex-1 min-w-0 sm:max-w-sm"
          style={{ borderColor: '#C8B89A', backgroundColor: 'white' }} />
        <button onClick={() => setGrouped(g => !g)} aria-pressed={grouped}
          className="px-4 py-2.5 border rounded-lg text-sm whitespace-nowrap" style={chip(grouped)}>
          לפי מקבץ
        </button>
        <button onClick={() => setFull(f => !f)} aria-pressed={full}
          className="px-4 py-2.5 border rounded-lg text-sm whitespace-nowrap" style={chip(full)}>
          {full ? 'כל העמודות (14)' : 'עמודות הוועדה (7)'}
        </button>
      </div>

      <div className="no-print flex flex-wrap items-center gap-2" role="group" aria-label="סינון לפי מעמד ברשימה">
        <span className="text-xs font-semibold text-ink-soft">מעמד ברשימה:</span>
        {statusOptions.map(({ s, n }) => (
          <button key={s} onClick={() => setListStatus(v => v === s ? null : s)} aria-pressed={listStatus === s}
            className="px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap" style={chip(listStatus === s)}>
            {LIST_STATUS_LABELS[s]} ({n})
          </button>
        ))}
        {verifyCount > 0 && (
          <button onClick={() => setListStatus(v => v === 'verify' ? null : 'verify')} aria-pressed={listStatus === 'verify'}
            className="px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap"
            style={listStatus === 'verify' ? chip(true, '#8B3A1E') : { borderColor: '#E8C48A', backgroundColor: '#FBEFD9', color: '#8B3A1E' }}>
            לאימות ({verifyCount})
          </button>
        )}
        {listStatus && <button onClick={() => setListStatus(null)} className="text-xs underline" style={{ color: '#8B3A1E' }}>ניקוי</button>}
      </div>

      <div className="overflow-x-auto bg-white" style={{ borderRadius: 8, border: '1px solid #C8B89A' }}>
        <table className="text-sm w-full border-collapse" style={{ minWidth: cols.reduce((a, c) => a + (c.width ?? 100), 0), fontVariantNumeric: 'tabular-nums' }}>
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: '#1B2A4A' }}>
              {cols.map(c => (
                <th key={c.key} scope="col" style={{ width: c.width }}
                  className="px-3 py-2.5 text-right text-xs font-semibold text-white whitespace-nowrap">
                  <button onClick={() => handleSort(c.key)} className="hover:underline" aria-label={`מיון לפי ${c.label}`}>
                    {c.label}{sortCol === c.key ? (sortDir === 'asc' ? ' (עולה)' : ' (יורד)') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          {groups.map(g => (
            <tbody key={g.name || 'all'}>
              {grouped && (
                <tr style={{ backgroundColor: '#EDE3D0' }}>
                  <th colSpan={cols.length} scope="rowgroup" className="px-3 py-2 text-right">
                    <span className="font-serif font-bold" style={{ color: '#1B2A4A' }}>{g.name}</span>
                    <span className="text-xs font-normal ms-2" style={{ color: '#4A5A7A' }}>{g.list.length === 1 ? 'אתר אחד' : `${g.list.length} אתרים`}</span>
                  </th>
                </tr>
              )}
              {g.list.map((b, i) => (
                <tr key={b.id} style={{ backgroundColor: i % 2 ? '#FBF8F2' : 'white', borderTop: '1px solid #EDE0CC' }}>
                  {cols.map(c => (
                    <td key={c.key} className="px-3 py-2.5 align-top text-ink-soft" style={{ width: c.width }}>{cell(b, c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <p className="text-xs text-ink-soft no-print">
        {sorted.length} מתוך {buildings.length} אתרים · לחיצה על כותרת עמודה ממיינת · שם האתר מוביל לכרטיס שלו
      </p>
    </div>
  );
}

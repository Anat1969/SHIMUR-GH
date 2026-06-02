'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { Building } from '@/lib/types';

type SortKey = 'city_registry_id' | 'name' | 'address' | 'neighborhood' | 'status' | 'lastActivity';
type SortDir = 'asc' | 'desc';

interface BuildingWithActivity extends Building {
  lastActivity: { date: string; note: string } | null;
}

export function BuildingsTable({ buildings }: { buildings: BuildingWithActivity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('city_registry_id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    return [...buildings].sort((a, b) => {
      let av: string, bv: string;
      if (sortKey === 'lastActivity') {
        av = a.lastActivity?.date ?? '';
        bv = b.lastActivity?.date ?? '';
      } else {
        av = (a[sortKey] as string) ?? '';
        bv = (b[sortKey] as string) ?? '';
      }
      return sortDir === 'asc' ? av.localeCompare(bv, 'he') : bv.localeCompare(av, 'he');
    });
  }, [buildings, sortKey, sortDir]);

  const Arrow = ({ col }: { col: SortKey }) =>
    sortKey === col ? <span className="mr-1">{sortDir === 'asc' ? '↑' : '↓'}</span> : <span className="mr-1 opacity-20">↕</span>;

  const Th = ({ col, label }: { col: SortKey; label: string }) => (
    <th onClick={() => handleSort(col)}
      className="px-5 py-3 text-sm font-semibold text-ink cursor-pointer select-none hover:bg-parchment transition-colors text-right">
      <Arrow col={col} />{label}
    </th>
  );

  const selected = sorted.find(b => b.id === expandedId);

  return (
    <div className="flex gap-6">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-stone-light flex-1">
        <table className="w-full bg-white">
          <thead>
            <tr className="border-b border-stone-light bg-parchment-deep">
              <th className="w-10 px-3 py-3"></th>
              <Th col="city_registry_id" label="מס׳ רישום" />
              <Th col="name" label="שם האתר" />
              <Th col="address" label="כתובת" />
              <Th col="neighborhood" label="אזור" />
              <Th col="status" label="סטטוס" />
              <Th col="lastActivity" label="פעולה אחרונה" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-light">
            {sorted.map((b) => (
              <tr key={b.id} className={`cursor-pointer transition-colors ${expandedId === b.id ? 'bg-parchment-deep' : 'hover:bg-parchment'}`}
                onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>
                <td className="px-3 py-4 text-sm text-ink-soft text-center">{expandedId === b.id ? '▼' : '▶'}</td>
                <td className="px-5 py-4 text-sm text-ink-soft font-mono">{b.city_registry_id}</td>
                <td className="px-5 py-4 text-sm font-medium">
                  <Link href={`/buildings/${b.id}`} className="hover:underline" style={{ color: '#1A1410' }}>
                    {b.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-sm text-ink-soft">{b.address}</td>
                <td className="px-5 py-4 text-sm text-ink-soft">{b.neighborhood || '—'}</td>
                <td className="px-5 py-4 text-sm"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-4 text-sm">
                  {b.lastActivity ? (
                    <div>
                      <p className="text-ink-soft text-xs">{new Date(b.lastActivity.date).toLocaleDateString('he-IL')}</p>
                      <p className="text-ink text-xs mt-0.5 truncate max-w-[200px]" title={b.lastActivity.note}>{b.lastActivity.note}</p>
                    </div>
                  ) : <span className="text-ink-soft text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixed detail panel */}
      {selected && (
        <div className="w-80 bg-gradient-to-b from-stone-light to-parchment rounded-lg border-2 border-stone p-6 space-y-4 h-fit sticky top-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-ink">{selected.name}</h3>
            <button onClick={() => setExpandedId(null)} className="text-ink-soft hover:text-ink text-xl">×</button>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">מס׳ רישום</p>
              <p className="font-mono text-ink">{selected.city_registry_id}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">כתובת</p>
              <p className="text-ink">{selected.address}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">אזור</p>
              <p className="text-ink">{selected.neighborhood || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">סטטוס</p>
              <StatusBadge status={selected.status} />
            </div>
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">סוג</p>
              <p className="text-ink">{selected.building_type || selected.style || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">רמת שימור</p>
              <p className="text-ink">{selected.protection_level || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-soft font-semibold mb-1">עדיפות</p>
              <p className="text-ink">{selected.priority_level || '—'}</p>
            </div>
            {selected.lastActivity && (
              <div className="pt-2 border-t border-stone">
                <p className="text-xs text-ink-soft font-semibold mb-1">פעולה אחרונה</p>
                <p className="text-xs">{new Date(selected.lastActivity.date).toLocaleDateString('he-IL')}</p>
                <p className="text-xs text-ink-soft">{selected.lastActivity.note}</p>
              </div>
            )}
            <Link href={`/buildings/${selected.id}`}
              className="block mt-4 px-4 py-2 rounded text-center text-sm font-medium text-white"
              style={{ backgroundColor: '#8B7355' }}>
              פתח תיק
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

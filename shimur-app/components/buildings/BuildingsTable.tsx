'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { Building } from '@/lib/types';

type SortKey = 'name' | 'address' | 'neighborhood' | 'city_registry_id' | 'status' | 'lastActivity';
type SortDir = 'asc' | 'desc';

interface BuildingWithActivity extends Building {
  lastActivity: { date: string; note: string } | null;
}

export function BuildingsTable({ buildings }: { buildings: BuildingWithActivity[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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

  const Th = ({ col, label, center }: { col: SortKey; label: string; center?: boolean }) => (
    <th
      onClick={() => handleSort(col)}
      className={`px-6 py-3 text-sm font-semibold text-ink cursor-pointer select-none hover:bg-parchment transition-colors ${center ? 'text-center' : 'text-right'}`}
    >
      <Arrow col={col} />{label}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded-lg border border-stone-light">
        <thead>
          <tr className="border-b border-stone-light bg-parchment-deep">
            <Th col="name" label="שם" />
            <Th col="address" label="כתובת" />
            <Th col="neighborhood" label="שכונה" />
            <Th col="city_registry_id" label="מס׳ רישום" />
            <Th col="status" label="סטטוס" />
            <Th col="lastActivity" label="פעולה אחרונה" />
            <th className="px-6 py-3 text-center text-sm font-semibold text-ink">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-light">
          {sorted.map((b) => (
            <tr key={b.id} className="hover:bg-parchment transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-ink">{b.name}</td>
              <td className="px-6 py-4 text-sm text-ink-soft">{b.address}</td>
              <td className="px-6 py-4 text-sm text-ink-soft">{b.neighborhood || '—'}</td>
              <td className="px-6 py-4 text-sm text-ink-soft font-mono">{b.city_registry_id}</td>
              <td className="px-6 py-4 text-sm"><StatusBadge status={b.status} /></td>
              <td className="px-6 py-4 text-sm">
                {b.lastActivity ? (
                  <div>
                    <p className="text-ink-soft text-xs">{new Date(b.lastActivity.date).toLocaleDateString('he-IL')}</p>
                    <p className="text-ink text-xs mt-0.5 truncate max-w-[180px]" title={b.lastActivity.note}>{b.lastActivity.note}</p>
                  </div>
                ) : <span className="text-ink-soft text-xs">—</span>}
              </td>
              <td className="px-6 py-4 text-center">
                <Link href={`/buildings/${b.id}`} className="text-sm font-medium" style={{ color: '#8B7355' }}>
                  פתח
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { Building } from '@/lib/types';

const BuildingsMap = dynamic(
  () => import('@/components/map/BuildingsMap').then(m => m.BuildingsMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-lg border border-stone-light bg-parchment animate-pulse" /> }
);

const TYPE_GROUPS: Record<string, string[]> = {
  'ארכאולוגי': ['תל ארכאולוגי', 'מצודה ארכאולוגית'],
  'היסטורי': ['גשר היסטורי', 'בנק / מסחר', 'מרכז קליטה', 'משרד ציבורי', 'בית מלון', 'גן ילדים', 'מגדל ניווט'],
  'תרבותי': ['בית כנסת', 'מרכז מסחרי', 'אנדרטה'],
  'אקולוגי': ['פארק', 'גנון / שדרה'],
};

function getTypeGroup(b: Building): string {
  const t = b.building_type ?? b.style ?? '';
  for (const [group, types] of Object.entries(TYPE_GROUPS)) {
    if (types.some(type => t.includes(type) || type.includes(t))) return group;
  }
  return 'היסטורי';
}

const PRIORITY_MAP_COLORS: Record<string, string> = {
  'גבוהה': '#8B3A1E',
  'בינונית': '#C4582A',
  'נמוכה': '#8B7355',
};

export default function MapPage() {
  const [filterPriority, setFilterPriority] = useState('הכל');
  const [filterType, setFilterType] = useState('הכל');
  const [filterNeighborhood, setFilterNeighborhood] = useState('הכל');
  const [filterProtection, setFilterProtection] = useState('הכל');

  const neighborhoods = useMemo(() => ['הכל', ...new Set(DEMO_BUILDINGS.map(b => b.neighborhood).filter(Boolean) as string[])], []);

  const filtered = useMemo(() => {
    return DEMO_BUILDINGS.filter(b => {
      if (filterPriority !== 'הכל' && b.priority_level !== filterPriority) return false;
      if (filterType !== 'הכל' && getTypeGroup(b) !== filterType) return false;
      if (filterNeighborhood !== 'הכל' && b.neighborhood !== filterNeighborhood) return false;
      if (filterProtection !== 'הכל' && b.protection_level !== filterProtection) return false;
      return true;
    });
  }, [filterPriority, filterType, filterNeighborhood, filterProtection]);

  const hasFilters = filterPriority !== 'הכל' || filterType !== 'הכל' || filterNeighborhood !== 'הכל' || filterProtection !== 'הכל';

  const resetFilters = () => {
    setFilterPriority('הכל'); setFilterType('הכל');
    setFilterNeighborhood('הכל'); setFilterProtection('הכל');
  };

  // Override building status colors to show priority
  const mapBuildings = filtered.map(b => ({
    ...b,
    status: (b.priority_level === 'גבוהה' ? 'הוחזר' : b.priority_level === 'בינונית' ? 'בתהליך' : 'לא_התחיל') as any,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-1">מפת אתרי שימור</h1>
        <p className="text-ink-soft">{filtered.length} מתוך {DEMO_BUILDINGS.length} אתרים מוצגים</p>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-lg border border-stone-light p-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold text-ink-soft uppercase tracking-wide">סינון</p>
          {hasFilters && (
            <button onClick={resetFilters} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#EDE0CC', color: '#8B7355' }}>
              × איפוס
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Priority */}
          <div>
            <label className="block text-xs text-ink-soft mb-1">עדיפות</label>
            <div className="flex gap-1 flex-wrap">
              {['הכל', 'גבוהה', 'בינונית'].map(v => (
                <button key={v} onClick={() => setFilterPriority(v)}
                  className="px-2 py-1 rounded text-xs border transition-colors"
                  style={{ borderColor: filterPriority === v ? '#8B3A1E' : '#EDE0CC', backgroundColor: filterPriority === v ? '#8B3A1E' : 'white', color: filterPriority === v ? 'white' : '#1A1410' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-ink-soft mb-1">קטגוריה</label>
            <div className="flex gap-1 flex-wrap">
              {['הכל', 'ארכאולוגי', 'היסטורי', 'תרבותי', 'אקולוגי'].map(v => (
                <button key={v} onClick={() => setFilterType(v)}
                  className="px-2 py-1 rounded text-xs border transition-colors"
                  style={{ borderColor: filterType === v ? '#4A5C45' : '#EDE0CC', backgroundColor: filterType === v ? '#4A5C45' : 'white', color: filterType === v ? 'white' : '#1A1410' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-xs text-ink-soft mb-1">אזור</label>
            <select value={filterNeighborhood} onChange={e => setFilterNeighborhood(e.target.value)}
              className="w-full px-2 py-1.5 border rounded text-xs" style={{ borderColor: '#EDE0CC' }}>
              {neighborhoods.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>

          {/* Protection level */}
          <div>
            <label className="block text-xs text-ink-soft mb-1">רמת שימור</label>
            <div className="flex gap-1">
              {['הכל', 'א', 'ב', 'ג'].map(v => (
                <button key={v} onClick={() => setFilterProtection(v)}
                  className="px-2 py-1 rounded text-xs border font-medium transition-colors"
                  style={{ borderColor: filterProtection === v ? '#8B7355' : '#EDE0CC', backgroundColor: filterProtection === v ? '#8B7355' : 'white', color: filterProtection === v ? 'white' : '#1A1410' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-stone-light h-[400px] flex items-center justify-center">
          <div>
            <p className="text-ink-soft mb-3">אין אתרים תואמים את הפילטרים</p>
            <button onClick={resetFilters} className="px-4 py-2 rounded text-sm" style={{ backgroundColor: '#C8B89A', color: 'white' }}>
              איפוס פילטרים
            </button>
          </div>
        </div>
      ) : (
        <BuildingsMap buildings={mapBuildings} />
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg border border-stone-light p-4">
        <p className="text-xs font-semibold text-ink-soft uppercase mb-3">מקרא — צבע לפי עדיפות</p>
        <div className="flex gap-6 flex-wrap">
          {[
            { color: '#8B3A1E', label: 'עדיפות גבוהה' },
            { color: '#C4582A', label: 'עדיפות בינונית' },
            { color: '#8B7355', label: 'עדיפות נמוכה' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

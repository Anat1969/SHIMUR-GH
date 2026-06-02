'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { Building, STATUS_COLORS } from '@/lib/types';

const BuildingsMap = dynamic(
  () => import('@/components/map/BuildingsMap').then(m => m.BuildingsMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-lg border border-stone-light bg-parchment animate-pulse" /> }
);

type FilterGroup = 'status' | 'type' | 'neighborhood' | null;

const TYPE_GROUPS: Record<string, string[]> = {
  'ארכאולוגי': ['תל ארכאולוגי', 'מצודה ארכאולוגית'],
  'היסטורי': ['גשר היסטורי', 'בנק / מסחר', 'מרכז קליטה', 'משרד ציבורי', 'בית מלון', 'גן ילדים', 'מגדל ניווט', 'אנדרטה'],
  'תרבותי': ['בית כנסת', 'מרכז מסחרי'],
  'אקולוגי': ['פארק', 'גנון / שדרה'],
};

function getTypeGroup(b: Building): string {
  const t = b.building_type ?? b.style ?? '';
  for (const [group, types] of Object.entries(TYPE_GROUPS)) {
    if (types.some(type => t.includes(type) || type.includes(t))) return group;
  }
  return 'היסטורי';
}

const FILTER_OPTIONS = {
  status: ['לא_התחיל', 'בתהליך', 'הוגש', 'אושר', 'הוחזר'],
  type: ['ארכאולוגי', 'היסטורי', 'תרבותי', 'אקולוגי'],
  neighborhood: [...new Set(DEMO_BUILDINGS.map(b => b.neighborhood).filter(Boolean) as string[])],
};

const GROUP_LABELS: Record<NonNullable<FilterGroup>, string> = {
  status: 'עדיפות וסטטוס',
  type: 'קטגוריה',
  neighborhood: 'אזור',
};


export default function MapPage() {
  const [activeGroup, setActiveGroup] = useState<FilterGroup>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);

  const handleGroupClick = (group: FilterGroup) => {
    if (activeGroup === group) {
      // Click same group → reset
      setActiveGroup(null);
      setActiveValue(null);
    } else {
      setActiveGroup(group);
      setActiveValue(null);
    }
  };

  const handleValueClick = (value: string) => {
    setActiveValue(v => v === value ? null : value);
  };

  const filtered = useMemo(() => {
    if (!activeGroup || !activeValue) return DEMO_BUILDINGS;
    return DEMO_BUILDINGS.filter(b => {
      switch (activeGroup) {
        case 'status': return b.status === activeValue;
        case 'type': return getTypeGroup(b) === activeValue;
        case 'neighborhood': return b.neighborhood === activeValue;
        default: return true;
      }
    });
  }, [activeGroup, activeValue]);

  // Pass filtered buildings to map
  const mapBuildings = filtered;

  const FilterGroup = ({ group, label }: { group: NonNullable<FilterGroup>; label: string }) => {
    const isActive = activeGroup === group;
    const isDimmed = activeGroup !== null && activeGroup !== group;
    return (
      <div style={{ opacity: isDimmed ? 0.35 : 1, transition: 'opacity 0.25s' }}>
        <button
          onClick={() => handleGroupClick(group)}
          className="w-full text-right text-xs font-semibold uppercase tracking-wide mb-2 flex items-center justify-between px-1"
          style={{ color: isActive ? '#8B7355' : '#3D3228' }}
        >
          <span>{label}</span>
          {isActive && <span style={{ color: '#C4582A', fontSize: '0.65rem' }}>× לחץ לסגירה</span>}
        </button>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS[group].map(v => {
            const isSelected = isActive && activeValue === v;
            return (
              <button
                key={v}
                onClick={() => { if (!isActive) handleGroupClick(group); handleValueClick(v); }}
                disabled={isDimmed}
                className="px-2.5 py-1 rounded-full text-xs border transition-all"
                style={{
                  borderColor: isSelected ? '#8B7355' : '#EDE0CC',
                  backgroundColor: isSelected ? '#8B7355' : isActive ? 'white' : '#FAFAF8',
                  color: isSelected ? 'white' : '#1A1410',
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {v}
                {isActive && (
                  <span className="mr-1 text-xs opacity-60">
                    ({DEMO_BUILDINGS.filter(b => {
                      switch (group) {
                        case 'status': return b.status === v;
                        case 'type': return getTypeGroup(b) === v;
                        case 'neighborhood': return b.neighborhood === v;
                        default: return false;
                      }
                    }).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-1">מפת אתרי שימור</h1>
        <p className="text-ink-soft">
          {activeGroup && activeValue
            ? `${filtered.length} אתרים — ${GROUP_LABELS[activeGroup]}: ${activeValue}`
            : `${filtered.length} אתרים מוצגים`}
        </p>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-lg border border-stone-light p-5">
        <p className="text-xs text-ink-soft mb-4">
          {activeGroup
            ? `בחר ערך מ"${GROUP_LABELS[activeGroup]}" — לחץ שוב על הקבוצה לאיפוס`
            : 'לחץ על קבוצת סינון כדי לפתח אפשרויות'}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <FilterGroup group="status" label="עדיפות וסטטוס" />
          <FilterGroup group="type" label="קטגוריה" />
          <FilterGroup group="neighborhood" label="אזור" />
        </div>
        {(activeGroup || activeValue) && (
          <button
            onClick={() => { setActiveGroup(null); setActiveValue(null); }}
            className="mt-4 text-xs px-3 py-1 rounded"
            style={{ backgroundColor: '#EDE0CC', color: '#8B7355' }}
          >
            × איפוס כל הסינונים
          </button>
        )}
      </div>

      {/* Map */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-stone-light h-[400px] flex items-center justify-center">
          <div>
            <p className="text-ink-soft mb-3">אין אתרים התואמים את הסינון</p>
            <button onClick={() => { setActiveGroup(null); setActiveValue(null); }}
              className="px-4 py-2 rounded text-sm text-white" style={{ backgroundColor: '#C8B89A' }}>
              איפוס
            </button>
          </div>
        </div>
      ) : (
        <BuildingsMap buildings={mapBuildings} />
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg border border-stone-light p-4">
        <p className="text-xs font-semibold text-ink-soft uppercase mb-3">מקרא — צבע לפי סטטוס</p>
        <div className="flex gap-6 flex-wrap">
          {[
            { color: STATUS_COLORS['לא_התחיל'], label: 'לא התחיל' },
            { color: STATUS_COLORS['בתהליך'], label: 'בתהליך' },
            { color: STATUS_COLORS['הוגש'], label: 'הוגש' },
            { color: STATUS_COLORS['אושר'], label: 'אושר' },
            { color: STATUS_COLORS['הוחזר'], label: 'הוחזר' },
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

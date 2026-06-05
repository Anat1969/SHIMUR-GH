'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo, useCallback, useEffect } from 'react';
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

const STORAGE_KEY = 'shimur-pin-overrides';

function loadPinOverrides(): Record<string, { lat: number; lng: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePinOverrides(overrides: Record<string, { lat: number; lng: number }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function applyOverrides(buildings: Building[], overrides: Record<string, { lat: number; lng: number }>): Building[] {
  return buildings.map(b => {
    const override = overrides[b.id];
    if (override) {
      return { ...b, lat: override.lat, lng: override.lng };
    }
    return b;
  });
}

export default function MapPage() {
  const [activeGroup, setActiveGroup] = useState<FilterGroup>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pinTarget, setPinTarget] = useState<Building | null>(null);
  const [pinOverrides, setPinOverrides] = useState<Record<string, { lat: number; lng: number }>>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    setPinOverrides(loadPinOverrides());
  }, []);

  const handleGroupClick = (group: FilterGroup) => {
    if (activeGroup === group) {
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

  const buildingsWithOverrides = useMemo(
    () => applyOverrides(DEMO_BUILDINGS, pinOverrides),
    [pinOverrides]
  );

  const filtered = useMemo(() => {
    if (!activeGroup || !activeValue) return buildingsWithOverrides;
    return buildingsWithOverrides.filter(b => {
      switch (activeGroup) {
        case 'status': return b.status === activeValue;
        case 'type': return getTypeGroup(b) === activeValue;
        case 'neighborhood': return b.neighborhood === activeValue;
        default: return true;
      }
    });
  }, [activeGroup, activeValue, buildingsWithOverrides]);

  const handlePinDrop = useCallback((buildingId: string, lat: number, lng: number) => {
    const updated = { ...pinOverrides, [buildingId]: { lat, lng } };
    setPinOverrides(updated);
    savePinOverrides(updated);

    const building = DEMO_BUILDINGS.find(b => b.id === buildingId);
    setLastSaved(building?.name ?? buildingId);
    setPinTarget(null);

    setTimeout(() => setLastSaved(null), 3000);
  }, [pinOverrides]);

  const handleExitPinMode = () => {
    setPinMode(false);
    setPinTarget(null);
  };

  const overrideCount = Object.keys(pinOverrides).length;

  const handleResetOverride = (buildingId: string) => {
    const updated = { ...pinOverrides };
    delete updated[buildingId];
    setPinOverrides(updated);
    savePinOverrides(updated);
    if (pinTarget?.id === buildingId) {
      setPinTarget(null);
    }
  };

  const handleResetAll = () => {
    setPinOverrides({});
    savePinOverrides({});
    setPinTarget(null);
  };

  const handleExportOverrides = () => {
    const data = Object.entries(pinOverrides).map(([id, coords]) => {
      const building = DEMO_BUILDINGS.find(b => b.id === id);
      return {
        id,
        name: building?.name ?? '',
        address: building?.address ?? '',
        lat: coords.lat,
        lng: coords.lng,
      };
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shimur-pin-overrides-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const FilterGroupComponent = ({ group, label }: { group: NonNullable<FilterGroup>; label: string }) => {
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">מפת אתרי שימור</h1>
          <p className="text-ink-soft">
            {activeGroup && activeValue
              ? `${filtered.length} אתרים — ${GROUP_LABELS[activeGroup]}: ${activeValue}`
              : `${filtered.length} אתרים מוצגים`}
          </p>
        </div>
        <button
          onClick={() => pinMode ? handleExitPinMode() : setPinMode(true)}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          style={{
            backgroundColor: pinMode ? '#8B3A1E' : '#F7F0E3',
            color: pinMode ? 'white' : '#8B3A1E',
            border: pinMode ? '2px solid #8B3A1E' : '2px solid #C4582A',
          }}
        >
          <span style={{ fontSize: '1.1em' }}>{pinMode ? '✕' : '📌'}</span>
          {pinMode ? 'סגור דקירה' : 'דקירת מיקום'}
        </button>
      </div>

      {/* Success toast */}
      {lastSaved && (
        <div className="rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 animate-pulse"
          style={{ backgroundColor: '#4A5C45', color: 'white' }} dir="rtl">
          <span>✓</span>
          <span>המיקום של &quot;{lastSaved}&quot; נשמר בהצלחה</span>
        </div>
      )}

      {/* Pin mode panel */}
      {pinMode && (
        <div className="bg-white rounded-lg border-2 p-5 space-y-4"
          style={{ borderColor: '#C4582A' }} dir="rtl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-rust flex items-center gap-2">
                <span>📌</span> דקירת מיקום אתר
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                בחר אתר מהרשימה, ואז לחץ על המפה למיקום המדויק שלו
              </p>
            </div>
            {overrideCount > 0 && (
              <div className="flex gap-2">
                <button onClick={handleExportOverrides}
                  className="px-3 py-1.5 rounded text-xs border transition-colors"
                  style={{ borderColor: '#4A5C45', color: '#4A5C45' }}>
                  ↓ ייצוא ({overrideCount})
                </button>
                <button onClick={handleResetAll}
                  className="px-3 py-1.5 rounded text-xs border transition-colors"
                  style={{ borderColor: '#8B3A1E', color: '#8B3A1E' }}>
                  איפוס הכל
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
            {buildingsWithOverrides.map(b => {
              const isSelected = pinTarget?.id === b.id;
              const hasOverride = pinOverrides[b.id] !== undefined;
              return (
                <button
                  key={b.id}
                  onClick={() => setPinTarget(isSelected ? null : b)}
                  className="text-right px-3 py-2.5 rounded-lg border text-sm transition-all flex items-start gap-2"
                  style={{
                    borderColor: isSelected ? '#C4582A' : hasOverride ? '#4A5C45' : '#EDE0CC',
                    backgroundColor: isSelected ? '#FFF5F0' : hasOverride ? '#F0F5EF' : 'white',
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[b.status] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{b.name}</p>
                    <p className="text-xs text-ink-soft truncate">{b.address}</p>
                    {hasOverride && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs" style={{ color: '#4A5C45' }}>✓ מיקום עודכן</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleResetOverride(b.id); }}
                          className="text-xs underline"
                          style={{ color: '#8B3A1E' }}
                        >
                          בטל
                        </button>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <span className="text-rust text-lg shrink-0">◉</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter panel */}
      {!pinMode && (
        <div className="bg-white rounded-lg border border-stone-light p-5">
          <p className="text-xs text-ink-soft mb-4">
            {activeGroup
              ? `בחר ערך מ"${GROUP_LABELS[activeGroup]}" — לחץ שוב על הקבוצה לאיפוס`
              : 'לחץ על קבוצת סינון כדי לפתח אפשרויות'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <FilterGroupComponent group="status" label="עדיפות וסטטוס" />
            <FilterGroupComponent group="type" label="קטגוריה" />
            <FilterGroupComponent group="neighborhood" label="אזור" />
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
      )}

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
        <BuildingsMap
          buildings={filtered}
          pinModeTarget={pinMode ? pinTarget : null}
          onPinDrop={handlePinDrop}
        />
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

'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { Building, STATUS_COLORS } from '@/lib/types';

const BuildingsMap = dynamic(
  () => import('@/components/map/BuildingsMap').then(m => m.BuildingsMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-lg bg-parchment animate-pulse glass-card" /> }
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

interface HistoricalMap {
  id: string;
  title: string;
  url: string;
  year: string;
  description: string;
}

const STORAGE_KEY = 'shimur_historical_maps';

function loadMaps(): HistoricalMap[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function saveMaps(maps: HistoricalMap[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
}

export default function MapPage() {
  const [activeGroup, setActiveGroup] = useState<FilterGroup>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [historicalMaps, setHistoricalMaps] = useState<HistoricalMap[]>(() => loadMaps());
  const [mapForm, setMapForm] = useState({ title: '', url: '', year: '', description: '' });

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

  const addHistoricalMap = () => {
    if (!mapForm.title.trim() || !mapForm.url.trim()) return;
    const newMap: HistoricalMap = {
      id: Date.now().toString(),
      ...mapForm,
    };
    const updated = [...historicalMaps, newMap];
    setHistoricalMaps(updated);
    saveMaps(updated);
    setMapForm({ title: '', url: '', year: '', description: '' });
  };

  const removeHistoricalMap = (id: string) => {
    const updated = historicalMaps.filter(m => m.id !== id);
    setHistoricalMaps(updated);
    saveMaps(updated);
  };

  const FilterGroupEl = ({ group, label }: { group: NonNullable<FilterGroup>; label: string }) => {
    const isActive = activeGroup === group;
    const isDimmed = activeGroup !== null && activeGroup !== group;
    return (
      <div style={{ opacity: isDimmed ? 0.35 : 1, transition: 'opacity 0.25s' }}>
        <button
          onClick={() => handleGroupClick(group)}
          className="w-full text-right text-xs font-semibold uppercase tracking-wide mb-2 flex items-center justify-between px-1"
          style={{ color: isActive ? 'var(--ocean)' : 'var(--navy)' }}
        >
          <span>{label}</span>
          {isActive && <span style={{ color: 'var(--rust-light)', fontSize: '0.65rem' }}>× סגירה</span>}
        </button>
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS[group].map(v => {
            const isSelected = isActive && activeValue === v;
            return (
              <button
                key={v}
                onClick={() => { if (!isActive) handleGroupClick(group); handleValueClick(v); }}
                disabled={isDimmed}
                className="px-2.5 py-1 rounded-full text-xs transition-all"
                style={{
                  border: `1px solid ${isSelected ? 'var(--ocean)' : 'var(--stone-light)'}`,
                  backgroundColor: isSelected ? 'var(--ocean)' : isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  color: isSelected ? 'white' : 'var(--navy)',
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
      <div className="page-intro">
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--navy)' }}>מפת אתרי שימור</h1>
        <p style={{ color: 'var(--navy-soft)' }}>
          מפה אינטראקטיבית של <span className="highlight-text">{DEMO_BUILDINGS.length} אתרי שימור</span> באשדוד.
          סנן לפי סטטוס, קטגוריה או אזור. כל סמן מייצג אתר בעל ערך שימורי —
          <span className="highlight-text">לחץ על סמן</span> לפרטים נוספים.
          ניתן להוסיף מפות היסטוריות כשכבות על המפה.
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--navy-soft)' }}>
          {activeGroup && activeValue
            ? `מוצגים ${filtered.length} אתרים — ${GROUP_LABELS[activeGroup]}: ${activeValue}`
            : `${filtered.length} אתרים מוצגים`}
        </p>
      </div>

      {/* Filter panel */}
      <div className="glass-card p-5">
        <p className="text-xs mb-4" style={{ color: 'var(--navy-soft)' }}>
          {activeGroup
            ? `בחר ערך מ"${GROUP_LABELS[activeGroup]}" — לחץ שוב לאיפוס`
            : 'לחץ על קבוצת סינון לפתיחה'}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <FilterGroupEl group="status" label="עדיפות וסטטוס" />
          <FilterGroupEl group="type" label="קטגוריה" />
          <FilterGroupEl group="neighborhood" label="אזור" />
        </div>
        {(activeGroup || activeValue) && (
          <button
            onClick={() => { setActiveGroup(null); setActiveValue(null); }}
            className="mt-4 text-xs px-3 py-1 rounded"
            style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}
          >
            × איפוס סינונים
          </button>
        )}
      </div>

      {/* Map */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center glass-card h-[400px] flex items-center justify-center">
          <div>
            <p className="mb-3" style={{ color: 'var(--navy-soft)' }}>אין אתרים התואמים את הסינון</p>
            <button onClick={() => { setActiveGroup(null); setActiveValue(null); }}
              className="px-4 py-2 rounded text-sm text-white" style={{ backgroundColor: 'var(--ocean)' }}>
              איפוס
            </button>
          </div>
        </div>
      ) : (
        <BuildingsMap buildings={filtered} />
      )}

      {/* Historical Maps Section */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>מפות היסטוריות</h2>
            <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>
              הוסף מפות עתיקות כשכבות רקע — מפות מנדטוריות, תכניות הסתדרותיות, מפות שימור
            </p>
          </div>
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--ocean)' }}
          >
            {showHistorical ? '× סגור' : '+ הוסף מפה היסטורית'}
          </button>
        </div>

        {showHistorical && (
          <div className="p-4 rounded-lg mb-4 space-y-3" style={{ backgroundColor: 'var(--ocean-pale)' }}>
            <input
              value={mapForm.title}
              onChange={e => setMapForm(f => ({ ...f, title: e.target.value }))}
              placeholder="שם המפה *"
              className="w-full px-4 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--ocean-light)', backgroundColor: 'white', color: 'var(--navy)' }}
            />
            <input
              value={mapForm.url}
              onChange={e => setMapForm(f => ({ ...f, url: e.target.value }))}
              placeholder="קישור לתמונת המפה (URL) *"
              className="w-full px-4 py-2 rounded-lg text-sm font-mono"
              style={{ border: '1px solid var(--ocean-light)', backgroundColor: 'white', color: 'var(--navy)' }}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={mapForm.year}
                onChange={e => setMapForm(f => ({ ...f, year: e.target.value }))}
                placeholder="שנה (למשל: 1946)"
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--ocean-light)', backgroundColor: 'white', color: 'var(--navy)' }}
              />
              <input
                value={mapForm.description}
                onChange={e => setMapForm(f => ({ ...f, description: e.target.value }))}
                placeholder="תיאור קצר"
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--ocean-light)', backgroundColor: 'white', color: 'var(--navy)' }}
              />
            </div>
            <button
              onClick={addHistoricalMap}
              disabled={!mapForm.title.trim() || !mapForm.url.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
              style={{ backgroundColor: 'var(--ocean)' }}
            >
              שמור מפה
            </button>
          </div>
        )}

        {historicalMaps.length > 0 && (
          <div className="space-y-2">
            {historicalMaps.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(27, 107, 125, 0.04)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>{m.title}</p>
                  <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>
                    {m.year && `${m.year} · `}{m.description}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={m.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1 rounded" style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}>
                    צפה
                  </a>
                  <button onClick={() => removeHistoricalMap(m.id)}
                    className="text-xs px-2 py-1 rounded" style={{ color: 'var(--rust)' }}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {historicalMaps.length === 0 && !showHistorical && (
          <p className="text-xs italic" style={{ color: 'var(--navy-soft)' }}>
            אין מפות היסטוריות עדיין. הוסף מפות מנדטוריות, תכניות ישנות או מפות ארכאולוגיות.
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold uppercase mb-3" style={{ color: 'var(--navy-soft)' }}>מקרא — צבע לפי סטטוס</p>
        <div className="flex gap-6 flex-wrap">
          {[
            { color: STATUS_COLORS['לא_התחיל'], label: 'לא התחיל' },
            { color: STATUS_COLORS['בתהליך'], label: 'בתהליך' },
            { color: STATUS_COLORS['הוגש'], label: 'הוגש' },
            { color: STATUS_COLORS['אושר'], label: 'אושר' },
            { color: STATUS_COLORS['הוחזר'], label: 'הוחזר' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs" style={{ color: 'var(--navy)' }}>
              <div className="w-4 h-4 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

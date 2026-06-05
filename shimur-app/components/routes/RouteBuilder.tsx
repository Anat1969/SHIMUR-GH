'use client';

import { useState } from 'react';
import { Building } from '@/lib/types';

interface RouteSiteEntry {
  building_id: string;
  narrative_text: string;
}

interface RouteBuilderProps {
  buildings: Building[];
  initialSites?: RouteSiteEntry[];
  onSave: (data: { title: string; description: string; theme: string; sites: RouteSiteEntry[] }) => void;
}

export function RouteBuilder({ buildings, initialSites = [], onSave }: RouteBuilderProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('');
  const [sites, setSites] = useState<RouteSiteEntry[]>(initialSites);

  const availableBuildings = buildings.filter(
    (b) => !sites.some((s) => s.building_id === b.id)
  );

  const addSite = (buildingId: string) => {
    setSites([...sites, { building_id: buildingId, narrative_text: '' }]);
  };

  const removeSite = (index: number) => {
    setSites(sites.filter((_, i) => i !== index));
  };

  const moveSite = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sites.length) return;
    const next = [...sites];
    [next[index], next[target]] = [next[target], next[index]];
    setSites(next);
  };

  const updateNarrative = (index: number, text: string) => {
    const next = [...sites];
    next[index] = { ...next[index], narrative_text: text };
    setSites(next);
  };

  const getBuildingName = (id: string) =>
    buildings.find((b) => b.id === id)?.name ?? id;

  const canSave = title.trim() && sites.length >= 2;

  return (
    <div className="space-y-6">
      <div className="card-heritage p-6 space-y-4">
        <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--ink)' }}>
          פרטי מסלול
        </h3>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>
            שם המסלול
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="למשל: שנות ה-60 — העיר מתעצבת"
            className="w-full px-4 py-2.5 rounded-lg text-sm"
            style={{
              border: '1px solid var(--stone-light)',
              backgroundColor: 'white',
              color: 'var(--ink)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>
            תיאור
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תיאור קצר של המסלול..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg text-sm resize-none"
            style={{
              border: '1px solid var(--stone-light)',
              backgroundColor: 'white',
              color: 'var(--ink)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--ink-soft)' }}>
            חוט משותף (נושא)
          </label>
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="למשל: תקופה, ארכאולוגיה, שכונה, טבע"
            className="w-full px-4 py-2.5 rounded-lg text-sm"
            style={{
              border: '1px solid var(--stone-light)',
              backgroundColor: 'white',
              color: 'var(--ink)',
            }}
          />
        </div>
      </div>

      <div className="card-heritage p-6 space-y-4">
        <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--ink)' }}>
          אתרים במסלול ({sites.length})
        </h3>

        {sites.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            בחר אתרים מהרשימה למטה כדי להוסיף למסלול
          </p>
        )}

        <div className="space-y-3">
          {sites.map((site, index) => (
            <div
              key={`${site.building_id}-${index}`}
              className="flex items-start gap-3 p-4 rounded-lg"
              style={{ backgroundColor: 'var(--ocean-pale)' }}
            >
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: 'var(--ocean)' }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {getBuildingName(site.building_id)}
                </p>
                <textarea
                  value={site.narrative_text}
                  onChange={(e) => updateNarrative(index, e.target.value)}
                  placeholder="טקסט נרטיבי מקשר..."
                  rows={2}
                  className="w-full px-3 py-2 rounded text-xs resize-none"
                  style={{
                    border: '1px solid var(--ocean-light)',
                    backgroundColor: 'white',
                    color: 'var(--ink)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => moveSite(index, -1)}
                  disabled={index === 0}
                  className="text-xs px-2 py-1 rounded disabled:opacity-30"
                  style={{ backgroundColor: 'white', color: 'var(--ocean)' }}
                >
                  ▲
                </button>
                <button
                  onClick={() => moveSite(index, 1)}
                  disabled={index === sites.length - 1}
                  className="text-xs px-2 py-1 rounded disabled:opacity-30"
                  style={{ backgroundColor: 'white', color: 'var(--ocean)' }}
                >
                  ▼
                </button>
                <button
                  onClick={() => removeSite(index)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: 'white', color: 'var(--rust)' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {availableBuildings.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--ink-soft)' }}>
              הוסף אתר:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableBuildings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => addSite(b.id)}
                  className="text-xs text-right px-3 py-2 rounded-lg transition-colors hover:shadow-sm"
                  style={{
                    backgroundColor: 'var(--parchment)',
                    color: 'var(--ink)',
                    border: '1px solid var(--stone-light)',
                  }}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onSave({ title, description, theme, sites })}
        disabled={!canSave}
        className="w-full px-6 py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
        style={{ backgroundColor: 'var(--ocean)' }}
      >
        {canSave ? 'שמור מסלול' : 'הוסף לפחות 2 אתרים ושם מסלול'}
      </button>
    </div>
  );
}

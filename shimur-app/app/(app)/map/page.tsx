'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSites } from '@/components/providers/SiteData';
import type { HistoricalMap } from '@/lib/types';
import type { Basemap, OverlayLayer } from '@/components/map/BuildingsMap';
import { apiFetch } from '@/lib/supabase/browser';
import { EditorGate, useEditor } from '@/components/providers/Editor';
import {
  CATEGORIES, COLOR_BY_LABELS, ColorBy, categoryOf, legendFor, markerColor, matchesQuery,
} from '@/lib/sites';

const BuildingsMap = dynamic(
  () => import('@/components/map/BuildingsMap').then(m => m.BuildingsMap),
  { ssr: false, loading: () => <div className="w-full h-full min-h-[420px] rounded-xl animate-pulse" style={{ backgroundColor: 'var(--parchment-deep)' }} /> },
);

type Bounds = [[number, number], [number, number]];

const chip = (active: boolean) => ({
  border: `1px solid ${active ? 'var(--ocean)' : 'var(--stone-light)'}`,
  backgroundColor: active ? 'var(--ocean)' : 'white',
  color: active ? 'white' : 'var(--navy)',
});

export default function MapPage() {
  const sites = useSites();
  const { isEditor } = useEditor();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [colorBy, setColorBy] = useState<ColorBy>('category');
  const [basemap, setBasemap] = useState<Basemap>('streets');
  const [showLabels, setShowLabels] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [maps, setMaps] = useState<HistoricalMap[]>([]);
  const [active, setActive] = useState<Record<string, number>>({});
  const [view, setView] = useState<Bounds | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', year: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/historical-maps').then(r => r.json()).then(j => setMaps(j.maps ?? [])).catch(() => setMaps([]));
  }, []);

  const neighborhoods = useMemo(
    () => [...new Set(sites.map(b => b.neighborhood).filter(Boolean) as string[])],
    [sites],
  );

  const filtered = useMemo(() => sites.filter(b =>
    matchesQuery(b, query)
    && (!category || categoryOf(b) === category)
    && (!neighborhood || b.neighborhood === neighborhood),
  ), [sites, query, category, neighborhood]);

  const overlays: OverlayLayer[] = useMemo(
    () => maps.filter(m => active[m.id] !== undefined).map(m => ({ map: m, opacity: active[m.id] })),
    [maps, active],
  );

  const resetFilters = () => { setQuery(''); setCategory(null); setNeighborhood(null); setSelectedId(null); };

  const saveMap = async () => {
    if (!view) return;
    setSaving(true); setFormError(null);
    const res = await apiFetch('/api/historical-maps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, bounds: view }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : { error: 'אין חיבור לשרת — נסי שוב' };
    setSaving(false);
    if (!res?.ok) { setFormError(json.error ?? 'השמירה נכשלה'); return; }
    setMaps(m => [...m, json.map]);
    setActive(a => ({ ...a, [json.map.id]: 0.7 }));
    setForm({ title: '', url: '', year: '', description: '' });
    setShowForm(false);
  };

  const removeMap = async (id: string) => {
    if (!confirm('למחוק את המפה ההיסטורית?')) return;
    const res = await apiFetch(`/api/historical-maps?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { const j = await res.json().catch(() => ({})); alert(j.error ?? 'המחיקה נכשלה'); return; }
    setMaps(m => m.filter(x => x.id !== id));
    setActive(a => { const n = { ...a }; delete n[id]; return n; });
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold" style={{ color: 'var(--navy)' }}>מפת אתרי השימור</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--navy-soft)' }}>
            {filtered.length === sites.length ? `${sites.length} אתרים` : `${filtered.length} מתוך ${sites.length} אתרים`}
            {' · '}לחיצה על אתר ברשימה או על המפה מתמקדת בו
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tour" className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>
            סיור מודרך במסך מלא
          </Link>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* פאנל צד */}
        <aside className="glass-card p-4 space-y-4 lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto order-2 lg:order-1">
          <div>
            <label htmlFor="site-search" className="block text-xs font-semibold mb-1" style={{ color: 'var(--navy-soft)' }}>חיפוש</label>
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="שם, רחוב, שכונה או סוג"
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ border: '1px solid var(--stone)', backgroundColor: 'white', color: 'var(--navy)' }}
            />
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--navy-soft)' }}>קטגוריה</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(v => v === c ? null : c)} aria-pressed={category === c}
                  className="px-3 py-1.5 rounded-full text-xs transition-colors" style={chip(category === c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--navy-soft)' }}>אזור</p>
            <div className="flex flex-wrap gap-1.5">
              {neighborhoods.map(n => (
                <button key={n} onClick={() => setNeighborhood(v => v === n ? null : n)} aria-pressed={neighborhood === n}
                  className="px-3 py-1.5 rounded-full text-xs transition-colors" style={chip(neighborhood === n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {(query || category || neighborhood) && (
            <button onClick={resetFilters} className="text-xs underline" style={{ color: 'var(--rust)' }}>ניקוי סינון</button>
          )}

          <ol className="space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--stone-light)' }}>
            {filtered.length === 0 && (
              <li className="text-sm py-6 text-center" style={{ color: 'var(--navy-soft)' }}>
                אין אתרים התואמים את החיפוש. נסי מילה אחרת או נקי את הסינון.
              </li>
            )}
            {filtered.map(b => {
              const sel = b.id === selectedId;
              return (
                <li key={b.id}>
                  <button
                    onClick={() => setSelectedId(sel ? null : b.id)}
                    className="w-full text-right flex items-start gap-3 p-2.5 rounded-lg transition-colors"
                    style={{ backgroundColor: sel ? 'var(--ocean-pale)' : 'transparent', border: `1px solid ${sel ? 'var(--ocean-light)' : 'transparent'}` }}
                  >
                    <span className="mt-1.5 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: markerColor(b, colorBy) }} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium" style={{ color: 'var(--navy)' }}>{b.name}</span>
                      <span className="block text-xs truncate" style={{ color: 'var(--navy-soft)' }}>{b.address}</span>
                    </span>
                  </button>
                  {sel && (
                    <div className="px-3 pb-3 pt-1 text-xs leading-relaxed space-y-2" style={{ color: 'var(--navy-soft)' }}>
                      {b.full_description && <p>{b.full_description}</p>}
                      <div className="flex gap-2">
                        <Link href={`/buildings/${b.id}`} className="px-3 py-1.5 rounded-md font-semibold text-white" style={{ backgroundColor: 'var(--ocean)' }}>לדף האתר</Link>
                        <Link href={`/tour?site=${b.id}`} className="px-3 py-1.5 rounded-md font-semibold" style={{ border: '1px solid var(--ocean)', color: 'var(--ocean)' }}>במצגת</Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        {/* מפה */}
        <section className="space-y-3 order-1 lg:order-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span style={{ color: 'var(--navy-soft)' }}>צבע לפי:</span>
            {(Object.keys(COLOR_BY_LABELS) as ColorBy[]).map(k => (
              <button key={k} onClick={() => setColorBy(k)} aria-pressed={colorBy === k}
                className="px-3 py-1.5 rounded-full" style={chip(colorBy === k)}>{COLOR_BY_LABELS[k]}</button>
            ))}
            <span className="mx-1 w-px h-5" style={{ backgroundColor: 'var(--stone)' }} />
            <button onClick={() => setBasemap(b => b === 'streets' ? 'satellite' : 'streets')}
              className="px-3 py-1.5 rounded-full" style={chip(basemap === 'satellite')}>
              {basemap === 'satellite' ? 'תצלום אוויר' : 'מפת רחובות'}
            </button>
            <button onClick={() => setShowLabels(v => !v)} aria-pressed={showLabels}
              className="px-3 py-1.5 rounded-full" style={chip(showLabels)}>שמות אתרים</button>
          </div>

          <div className="relative h-[60vh] lg:h-[calc(100vh-240px)] min-h-[420px]">
            <BuildingsMap
              buildings={filtered}
              colorBy={colorBy}
              basemap={basemap}
              selectedId={selectedId}
              onSelect={setSelectedId}
              overlays={overlays}
              onViewChange={setView}
              showLabels={showLabels}
              className="w-full h-full rounded-xl overflow-hidden shadow-md"
            />
            <div className="absolute bottom-8 right-3 z-[500] glass-card px-3 py-2 text-xs space-y-1 pointer-events-none">
              {legendFor(colorBy).map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2" style={{ color: 'var(--navy)' }}>
                  <span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* מפות היסטוריות */}
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>מפות היסטוריות</h2>
                <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>שכבות שקופות מעל המפה — מנדט, תכניות ישנות, תצלומי אוויר</p>
              </div>
              {isEditor && <button onClick={() => { setShowForm(s => !s); setFormError(null); }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--ocean)' }}>
                {showForm ? 'ביטול' : 'הוספת מפה'}
              </button>}
            </div>

            {showForm && (
              <div className="p-4 rounded-lg mb-3 space-y-3" style={{ backgroundColor: 'var(--ocean-pale)' }}>
                <p className="text-xs" style={{ color: 'var(--ocean-dark)' }}>
                  המפה תמוקם על התחום המוצג כרגע במפה. כווני את התצוגה לאזור שהמפה ההיסטורית מכסה, ואז שמרי.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="שם המפה"
                    className="px-3 py-2.5 rounded-lg text-sm bg-white" style={{ border: '1px solid var(--ocean-light)' }} />
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="שנה (למשל 1946)"
                    className="px-3 py-2.5 rounded-lg text-sm bg-white" style={{ border: '1px solid var(--ocean-light)' }} />
                </div>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="קישור לקובץ התמונה (https://...)" dir="ltr"
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-white" style={{ border: '1px solid var(--ocean-light)' }} />
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="תיאור קצר"
                  className="w-full px-3 py-2.5 rounded-lg text-sm bg-white" style={{ border: '1px solid var(--ocean-light)' }} />
                {formError && <p role="alert" className="text-sm" style={{ color: 'var(--rust)' }}>{formError}</p>}
                <button onClick={saveMap} disabled={saving || !form.title.trim() || !form.url.trim()}
                  className="px-6 py-3 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: 'var(--ocean)' }}>
                  {saving ? 'שומר…' : 'שמירה והצגה על המפה'}
                </button>
              </div>
            )}

            {maps.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>אין עדיין מפות היסטוריות במאגר.</p>
            ) : (
              <ul className="space-y-2">
                {maps.map(m => {
                  const on = active[m.id] !== undefined;
                  return (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: on ? 'var(--ocean-pale)' : 'rgba(27,107,125,0.04)' }}>
                      <label className="flex items-center gap-2 flex-1 min-w-[180px] cursor-pointer">
                        <input type="checkbox" checked={on}
                          onChange={() => setActive(a => { const n = { ...a }; if (on) delete n[m.id]; else n[m.id] = 0.7; return n; })} />
                        <span className="text-sm font-medium" style={{ color: 'var(--navy)' }}>{m.title}</span>
                        {m.year && <span className="text-xs" style={{ color: 'var(--navy-soft)' }}>{m.year}</span>}
                      </label>
                      {on && (
                        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--navy-soft)' }}>
                          שקיפות
                          <input type="range" min={0.1} max={1} step={0.05} value={active[m.id]}
                            onChange={e => setActive(a => ({ ...a, [m.id]: Number(e.target.value) }))} />
                        </label>
                      )}
                      {isEditor && <button onClick={() => removeMap(m.id)} className="text-xs px-2 py-1" style={{ color: 'var(--rust)' }}>מחיקה</button>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

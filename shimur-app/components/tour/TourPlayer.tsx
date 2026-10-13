'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSites, useRoutes } from '@/components/providers/SiteData';
import type { Basemap } from '@/components/map/BuildingsMap';
import { CATEGORIES, CATEGORY_COLORS, categoryOf } from '@/lib/sites';
import { STATUS_LABELS } from '@/lib/types';

const BuildingsMap = dynamic(
  () => import('@/components/map/BuildingsMap').then(m => m.BuildingsMap),
  { ssr: false, loading: () => <div className="absolute inset-0" style={{ backgroundColor: 'var(--navy)' }} /> },
);

const AUTOPLAY_MS = 9000;

export function TourPlayer() {
  const allSites = useSites();
  const routes = useRoutes();
  const params = useSearchParams();
  const router = useRouter();

  const route = routes.find(r => r.id === params.get('route')) ?? null;

  // סדר השקפים: מסלול נבחר, או כל האתרים
  const steps = useMemo(() => {
    if (route) {
      return [...(route.sites ?? [])]
        .sort((a, b) => a.position - b.position)
        .map(s => ({ site: allSites.find(b => b.id === s.building_id), narrative: s.narrative_text }))
        .filter((s): s is { site: NonNullable<typeof s.site>; narrative: string | null } => !!s.site);
    }
    return allSites.filter(s => s.lat && s.lng).map(site => ({ site, narrative: null as string | null }));
  }, [route, allSites]);

  // 0 = פתיחה, 1..n = אתרים, n+1 = סיום
  const startSite = params.get('site');
  const initial = startSite ? Math.max(0, steps.findIndex(s => s.site.id === startSite) + 1) : 0;
  const [index, setIndex] = useState(initial);
  const [playing, setPlaying] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>('satellite');
  const last = steps.length + 1;
  const [offset, setOffset] = useState<[number, number]>([0, 0]);

  // הכרטיס מסתיר חלק מהמסך: בדסקטופ בצד ימין, בנייד בתחתית
  useEffect(() => {
    const calc = () => setOffset(window.innerWidth >= 640 ? [220, 0] : [0, Math.round(window.innerHeight * 0.22)]);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const go = useCallback((d: number) => setIndex(i => Math.min(last, Math.max(0, i + d))), [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // בעברית: שמאלה = קדימה
      if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowRight' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
      else if (e.key === 'Home') setIndex(0);
      else if (e.key === 'End') setIndex(last);
      else if (e.key === 'Escape' && !document.fullscreenElement) router.push('/overview');
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
      else if (e.key.toLowerCase() === 'p') setPlaying(p => !p);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, last, router]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) { setPlaying(false); return; }
    const t = setTimeout(() => go(1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, index, last, go]);

  const current = index >= 1 && index <= steps.length ? steps[index - 1] : null;
  const mapSites = useMemo(() => steps.map(s => s.site), [steps]);

  const byCategory = CATEGORIES.map(c => ({ c, n: mapSites.filter(s => categoryOf(s) === c).length })).filter(x => x.n > 0);
  const levelA = mapSites.filter(s => s.protection_level === 'א').length;
  const documented = mapSites.filter(s => s.status !== 'לא_התחיל').length;

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: 'var(--navy)' }}>
      <div className="absolute inset-0">
        <BuildingsMap
          buildings={mapSites}
          selectedId={current?.site.id ?? null}
          basemap={basemap}
          focusZoom={17}
          focusOffset={offset}
          popups={false}
          showLabels={index === last}
          className="w-full h-full"
        />
      </div>

      {/* פתיחה */}
      {index === 0 && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center p-6 tour-fade" style={{ background: 'linear-gradient(180deg, rgba(27,42,74,0.6) 0%, rgba(27,42,74,0.88) 100%)', backdropFilter: 'blur(2px)' }}>
          <div className="max-w-3xl text-center text-white space-y-6">
            <p className="text-sm font-medium" style={{ color: 'var(--amber-light)' }}>עיריית אשדוד · יחידת השימור</p>
            <h1 className="text-4xl sm:text-6xl font-serif font-bold leading-tight">
              {route ? route.title : 'מורשת אשדוד'}
            </h1>
            <p className="text-lg sm:text-xl opacity-90 leading-relaxed">
              {route?.description ?? 'מסע בין שכבות הזמן של העיר — מתל מור ועד שכונת האם. כל נקודה במפה היא סיפור שעוד אפשר לשמר.'}
            </p>
            {!route && (
              <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-2">
                <Stat n={mapSites.length} label="אתרים ברשימה" />
                <Stat n={levelA} label="דרגה א׳ מוצעת" />
                <Stat n={routes.length} label="מסלולי סיור" />
              </div>
            )}
            {!route && (
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                {byCategory.map(({ c, n }) => (
                  <span key={c} className="px-3 py-1 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }}>{c} · {n}</span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button onClick={() => go(1)} className="px-8 py-4 rounded-xl text-lg font-semibold" style={{ backgroundColor: 'var(--amber)', color: 'var(--navy)' }}>
                התחלת הסיור
              </button>
              <button onClick={() => { setIndex(1); setPlaying(true); }} className="px-8 py-4 rounded-xl text-lg font-semibold border border-white/60 text-white">
                ניגון אוטומטי
              </button>
              <Link href="/overview" className="px-8 py-4 rounded-xl text-lg font-semibold text-white underline underline-offset-4 decoration-white/50 hover:decoration-white">
                כניסה לאפליקציה
              </Link>
            </div>
            <p className="hidden sm:block text-xs opacity-70">מקשים: חיצים למעבר · F למסך מלא · P לניגון · Esc לאפליקציה</p>
          </div>
        </div>
      )}

      {/* כרטיס אתר */}
      {current && (
        <article key={current.site.id} className="absolute z-[600] tour-slide inset-x-3 bottom-20 sm:inset-x-auto sm:bottom-auto sm:top-6 sm:right-6 sm:w-[420px] max-h-[48vh] sm:max-h-[calc(100vh-140px)] overflow-y-auto rounded-xl shadow-2xl" style={{ backgroundColor: 'rgba(247,240,227,0.97)' }}>
          {current.site.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.site.image_url} alt={current.site.name} className="w-full h-28 sm:h-56 object-cover rounded-t-2xl photo-mono" />
          )}
          <div className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: CATEGORY_COLORS[categoryOf(current.site)] }}>{categoryOf(current.site)}</span>
              {current.site.protection_level && <span className="px-2.5 py-1 rounded-full" style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--rust)' }}>שימור {current.site.protection_level}׳</span>}
              <span className="ms-auto" style={{ color: 'var(--navy-soft)' }}>{index} / {steps.length}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-serif font-bold leading-tight" style={{ color: 'var(--navy)' }}>{current.site.name}</h2>
            <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>{current.site.address}{current.site.neighborhood ? ` · ${current.site.neighborhood}` : ''}</p>
            {current.narrative && (
              <p className="text-base font-medium leading-relaxed ps-3" style={{ color: 'var(--ocean-dark)', borderInlineStart: '3px solid var(--ocean)' }}>{current.narrative}</p>
            )}
            {current.site.full_description && <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{current.site.full_description}</p>}
            {(current.site.historical_periods ?? []).length > 0 && (
              <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>תקופות: {current.site.historical_periods!.join(' · ')}</p>
            )}
            <Link href={`/buildings/${current.site.id}`} className="inline-block text-sm font-semibold underline" style={{ color: 'var(--ocean)' }}>לתיק האתר</Link>
          </div>
        </article>
      )}

      {/* סיום */}
      {index === last && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center p-6 tour-fade" style={{ background: 'rgba(27,42,74,0.88)' }}>
          <div className="max-w-2xl text-center text-white space-y-6">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold">מה שלא מתועד — נעלם</h2>
            <p className="text-lg opacity-90 leading-relaxed">
              {mapSites.length} אתרים ברשימה. {documented > 0 ? `תיעוד החל ב-${documented} מהם.` : 'תיק התיעוד הראשון מחכה להיפתח.'}
              {' '}המערכת מוכנה: מפה ציבורית, מסלולי סיור, תיק תיעוד לכל אתר וכלי שטח לאדריכלים.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map(s => (
                <div key={s} className="rounded-lg p-2" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl font-bold">{mapSites.filter(b => b.status === s).length}</div>
                  {STATUS_LABELS[s]}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => setIndex(0)} className="px-6 py-3 rounded-xl font-semibold border border-white/60">מההתחלה</button>
              <Link href="/map" className="px-6 py-3 rounded-xl font-semibold" style={{ backgroundColor: 'var(--amber)', color: 'var(--navy)' }}>למפה המלאה</Link>
              <Link href="/routes" className="px-6 py-3 rounded-xl font-semibold border border-white/60">למסלולים</Link>
            </div>
          </div>
        </div>
      )}

      {/* פס בקרה */}
      <nav className="absolute z-[700] bottom-0 inset-x-0 p-3 sm:p-4" aria-label="ניווט במצגת" style={{ background: 'linear-gradient(0deg, rgba(27,42,74,0.9), rgba(27,42,74,0))' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3 text-white">
          <button onClick={() => go(-1)} disabled={index === 0} className="px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-30" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>הקודם</button>
          <button onClick={() => go(1)} disabled={index === last} className="px-5 py-3 rounded-lg text-sm font-semibold disabled:opacity-30" style={{ backgroundColor: 'var(--amber)', color: 'var(--navy)' }}>הבא</button>
          <button onClick={() => setPlaying(p => !p)} className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>{playing ? 'השהיה' : 'ניגון'}</button>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full transition-all duration-500" style={{ width: `${(index / last) * 100}%`, backgroundColor: 'var(--amber-light)' }} />
          </div>
          <button onClick={() => setBasemap(b => b === 'satellite' ? 'streets' : 'satellite')} className="hidden sm:block px-3 py-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            {basemap === 'satellite' ? 'מפת רחובות' : 'תצלום אוויר'}
          </button>
          <button onClick={toggleFullscreen} className="hidden sm:block px-3 py-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>מסך מלא</button>
          <Link href="/overview" className="px-3 py-3 rounded-lg text-xs whitespace-nowrap" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>לאפליקציה</Link>
        </div>
      </nav>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
      <div className="text-3xl sm:text-4xl font-serif font-bold" style={{ color: 'var(--amber-light)' }}>{n}</div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
}

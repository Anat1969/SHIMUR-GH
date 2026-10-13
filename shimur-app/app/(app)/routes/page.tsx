'use client';

import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSites, useRoutes } from '@/components/providers/SiteData';
import { SiteImage } from '@/components/sites/SiteImage';
import { apiFetch } from '@/lib/supabase/browser';
import { EditorGate, useEditor } from '@/components/providers/Editor';
import { RouteBuilder } from '@/components/routes/RouteBuilder';

const RoutesMap = dynamic(
  () => import('@/components/map/RoutesMap').then((m) => m.RoutesMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-xl bg-stone-100 animate-pulse" /> }
);


export default function RoutesPage() {
  const [showBuilder, setShowBuilder] = useState(false);

  const router = useRouter();
  const { isEditor } = useEditor();
  const allBuildings = useSites();
  const routes = useRoutes();

  const getBuildingName = (buildingId: string) =>
    allBuildings.find((b) => b.id === buildingId)?.name ?? '';

  const themeColors: Record<string, string> = {
    'תקופה': 'var(--amber)',
    'ארכאולוגיה': 'var(--rust)',
    'שכונה': 'var(--sage)',
    'טבע': 'var(--sage-light)',
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="page-intro">
        <p className="text-sm uppercase mb-3" style={{ color: 'var(--ocean)' }}>
          מסלולי סיור
        </p>
        <h1 className="text-4xl font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>
          מורשת אשדוד — מסלולים
        </h1>
        <p className="leading-relaxed" style={{ color: 'var(--navy-soft)' }}>
          מסלולים נרטיביים המחברים בין אתרי השימור על פי <span className="highlight-text">חוט משותף</span> —
          תקופה, נושא, שכונה או סיפור. כל מסלול מספר סיפור אחד דרך מספר אתרים.
          שימור הוא לא רק הגנה — הוא <span className="highlight-text">סיפור</span>.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>{routes.length} מסלולים · לחיצה על מסלול פותחת סיור מפורט</p>

        {isEditor && <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--ocean)' }}
        >
          {showBuilder ? 'סגור' : 'צור מסלול חדש'}
        </button>}
      </div>

      {showBuilder && (
        <RouteBuilder
          buildings={allBuildings}
          onSave={async (data) => {
            const res = await apiFetch('/api/routes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });
            const json = await res.json().catch(() => ({ error: 'תקלת תקשורת — נסי שוב' }));
            if (!res.ok) return json.error ?? 'השמירה נכשלה';
            setShowBuilder(false);
            router.push(`/routes/${json.id}`);
            router.refresh();
            return null;
          }}
        />
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-serif font-bold" style={{ color: 'var(--navy)' }}>
          מפת המסלולים
        </h2>
        <RoutesMap
          routes={routes}
          buildings={allBuildings}
          themeColors={themeColors}
        />
        <div className="flex flex-wrap gap-3 justify-end pt-1">
          {Object.entries(themeColors).map(([theme, color]) => (
            <span key={theme} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--navy-soft)' }}>
              <span className="w-4 h-1 rounded-full inline-block" style={{ backgroundColor: color }} />
              {theme}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/routes/${route.id}`}
            className="glass-card group block overflow-hidden"

          >
            <div className="flex h-28">
              {(route.sites ?? []).slice(0, 4).map(s => {
                const b = allBuildings.find(x => x.id === s.building_id);
                return b ? <SiteImage key={s.id} site={b} size="card" className="!h-28 !rounded-none flex-1 min-w-0" /> : null;
              })}
            </div>
            <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-serif font-bold text-xl group-hover:underline" style={{ color: 'var(--navy)' }}>
                {route.title}
              </h3>
              {route.theme && (
                <span
                  className="text-xs px-3 py-1 rounded-full text-white shrink-0"
                  style={{ backgroundColor: themeColors[route.theme] ?? 'var(--ocean)' }}
                >
                  {route.theme}
                </span>
              )}
            </div>

            {route.description && (
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--navy-soft)' }}>
                {route.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--ocean)', color: 'white' }}
              >
                {route.sites?.length ?? 0}
              </span>
              <span className="text-xs" style={{ color: 'var(--ocean-dark)' }}>אתרים</span>
              <span className="text-xs mx-1" style={{ color: 'var(--stone)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--navy-soft)' }}>
                {(route.sites ?? []).slice(0, 3).map((s) => getBuildingName(s.building_id)).filter(Boolean).join(' · ')}
                {(route.sites?.length ?? 0) > 3 && ' ועוד'}
              </span>
            </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

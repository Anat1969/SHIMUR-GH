'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEMO_ROUTES } from '@/lib/demo/routes';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { RouteBuilder } from '@/components/routes/RouteBuilder';

type Filter = 'all' | 'public';

export default function RoutesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [showBuilder, setShowBuilder] = useState(false);

  const routes = DEMO_ROUTES.filter((r) => {
    if (filter === 'public') return r.is_public;
    return true;
  });

  const getBuildingName = (buildingId: string) =>
    DEMO_BUILDINGS.find((b) => b.id === buildingId)?.name ?? '';

  const themeColors: Record<string, string> = {
    'תקופה': 'var(--amber)',
    'ארכאולוגיה': 'var(--rust)',
    'שכונה': 'var(--sage)',
    'טבע': 'var(--sage-light)',
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="page-intro">
        <p className="text-sm tracking-widest uppercase mb-3" style={{ color: 'var(--ocean)' }}>
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
        <div className="flex gap-2">
          {([['all', 'כל המסלולים'], ['public', 'ציבוריים']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: filter === key ? 'var(--ocean)' : 'var(--ocean-pale)',
                color: filter === key ? 'white' : 'var(--ocean-dark)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--ocean)' }}
        >
          {showBuilder ? 'סגור' : 'צור מסלול חדש'}
        </button>
      </div>

      {showBuilder && (
        <RouteBuilder
          buildings={DEMO_BUILDINGS}
          onSave={(data) => {
            setShowBuilder(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map((route) => (
          <Link
            key={route.id}
            href={`/routes/${route.id}`}
            className="group block rounded-xl p-6 transition-all hover:shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--ocean-pale) 0%, var(--parchment) 100%)',
              border: '1px solid var(--ocean-pale)',
            }}
          >
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
                {(route.sites ?? []).slice(0, 3).map((s) => getBuildingName(s.building_id)).filter(Boolean).join(' → ')}
                {(route.sites?.length ?? 0) > 3 && ' →…'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

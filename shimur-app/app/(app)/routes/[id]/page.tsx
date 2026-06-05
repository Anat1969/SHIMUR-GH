'use client';

import { use } from 'react';
import Link from 'next/link';
import { DEMO_ROUTES } from '@/lib/demo/routes';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { RouteNarrative } from '@/components/routes/RouteNarrative';

export default function RouteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const route = DEMO_ROUTES.find((r) => r.id === id);

  if (!route) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--ink)' }}>
          מסלול לא נמצא
        </h1>
        <Link
          href="/routes"
          className="px-6 py-2 rounded-lg text-sm text-white"
          style={{ backgroundColor: 'var(--ocean)' }}
        >
          חזרה למסלולים
        </Link>
      </div>
    );
  }

  const sortedSites = [...(route.sites ?? [])].sort((a, b) => a.position - b.position);
  const routeBuildings = sortedSites
    .map((s) => DEMO_BUILDINGS.find((b) => b.id === s.building_id))
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/routes"
          className="text-sm mb-4 inline-block transition-colors"
          style={{ color: 'var(--ocean)' }}
        >
          ← חזרה למסלולים
        </Link>

        <div
          className="rounded-xl p-8"
          style={{
            background: 'linear-gradient(135deg, var(--ocean-pale) 0%, var(--parchment) 100%)',
            borderBottom: '3px solid var(--ocean)',
          }}
        >
          {route.theme && (
            <span
              className="text-xs px-3 py-1 rounded-full text-white inline-block mb-3"
              style={{ backgroundColor: 'var(--ocean)' }}
            >
              {route.theme}
            </span>
          )}
          <h1 className="text-3xl font-serif font-bold mb-3" style={{ color: 'var(--ink)' }}>
            {route.title}
          </h1>
          {route.description && (
            <p className="leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {route.description}
            </p>
          )}
          <p className="text-sm mt-4" style={{ color: 'var(--ocean)' }}>
            {sortedSites.length} אתרים במסלול
          </p>
        </div>
      </div>

      <RouteNarrative route={route} buildings={DEMO_BUILDINGS} />

      <div className="text-center py-6">
        <Link
          href="/routes"
          className="px-6 py-3 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--ocean-pale)',
            color: 'var(--ocean-dark)',
            border: '1px solid var(--ocean-light)',
          }}
        >
          חזרה לכל המסלולים
        </Link>
      </div>
    </div>
  );
}

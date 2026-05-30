'use client';

import dynamic from 'next/dynamic';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

const BuildingsMap = dynamic(
  () => import('@/components/map/BuildingsMap').then(m => m.BuildingsMap),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-lg border border-stone-light bg-parchment animate-pulse" /> }
);

export default function MapPage() {
  const buildings = DEMO_BUILDINGS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">מפת מבנים</h1>
        <p className="text-ink-soft">{buildings.length} מבנים במערכת</p>
      </div>

      <BuildingsMap buildings={buildings} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-stone-light p-4">
          <p className="text-xs font-semibold text-ink-soft uppercase mb-3">מקרא</p>
          <div className="space-y-2">
            {[
              { color: '#8B7355', label: 'לא התחיל' },
              { color: '#C4582A', label: 'בתהליך' },
              { color: '#4A5C45', label: 'הוגש' },
              { color: '#1A1410', label: 'אושר' },
              { color: '#8B3A1E', label: 'הוחזר' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

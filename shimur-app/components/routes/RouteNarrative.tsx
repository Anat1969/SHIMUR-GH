'use client';

import { Route, RouteSite, Building } from '@/lib/types';
import { SiteCard } from '@/components/buildings/SiteCard';

interface RouteNarrativeProps {
  route: Route;
  buildings: Building[];
}

export function RouteNarrative({ route, buildings }: RouteNarrativeProps) {
  const sortedSites = [...(route.sites ?? [])].sort((a, b) => a.position - b.position);

  const getBuildingForSite = (site: RouteSite): Building | undefined =>
    buildings.find((b) => b.id === site.building_id);

  return (
    <div className="relative">
      <div
        className="absolute top-0 bottom-0 hidden md:block"
        style={{
          right: '24px',
          width: '2px',
          backgroundColor: 'var(--ocean)',
          opacity: 0.15,
        }}
      />

      <div className="space-y-8">
        {sortedSites.map((site, index) => {
          const building = getBuildingForSite(site);
          if (!building) return null;

          return (
            <div key={site.id} className="relative">
              <div className="flex items-start gap-6">
                <div
                  className="hidden md:flex shrink-0 w-12 h-12 rounded-full items-center justify-center text-white font-serif font-bold text-lg z-10"
                  style={{ backgroundColor: 'var(--ocean)' }}
                >
                  {index + 1}
                </div>

                <div className="flex-1 space-y-3">
                  {site.narrative_text && (
                    <p
                      className="text-sm leading-relaxed italic pr-4"
                      style={{ color: 'var(--ocean-dark)' }}
                    >
                      {site.narrative_text}
                    </p>
                  )}
                  <SiteCard building={building} variant="public" showActions={false} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

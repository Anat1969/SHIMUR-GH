'use client';

import Link from 'next/link';
import { Building, STATUS_COLORS, STATUS_LABELS, BuildingStatus } from '@/lib/types';
import { SITE_IMAGES } from '@/lib/demo/site-images';

interface SiteCardProps {
  building: Building;
  variant: 'professional' | 'public';
  onAddToRoute?: (buildingId: string) => void;
  showActions?: boolean;
}

export function SiteCard({ building, variant, onAddToRoute, showActions = true }: SiteCardProps) {
  if (variant === 'professional') {
    return <ProfessionalCard building={building} showActions={showActions} />;
  }
  return <PublicCard building={building} onAddToRoute={onAddToRoute} showActions={showActions} />;
}

function ProfessionalCard({ building, showActions }: { building: Building; showActions: boolean }) {
  const statusColor = STATUS_COLORS[building.status];
  const statusLabel = STATUS_LABELS[building.status];
  const imgSrc = SITE_IMAGES[building.id];

  return (
    <div className="card-heritage pro-accent relative overflow-hidden rounded-xl" style={{ minHeight: imgSrc ? 220 : undefined }}>
      {/* Background photo covering the entire card */}
      {imgSrc && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <img
            src={imgSrc}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.15, filter: 'grayscale(40%) sepia(20%)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, var(--parchment) 30%, transparent 70%)' }} />
        </div>
      )}

      <div className="flex relative" style={{ zIndex: 1 }}>
        {/* Left: status + priority (the large area) */}
        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-xs px-3 py-1 rounded-full font-medium text-white"
              style={{ backgroundColor: statusColor }}
            >
              {statusLabel}
            </span>
            {building.priority_level && (
              <span className="text-xs" style={{ color: 'var(--stone-dark)' }}>
                עדיפות: {building.priority_level}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--navy-soft)' }}>
            {building.taba && <span>גוש: {building.taba}</span>}
            {building.parcel && <span>חלקה: {building.parcel}</span>}
            {building.year_built && <span>נבנה: {building.year_built}</span>}
          </div>
        </div>

        {/* Right: photo thumbnail + info */}
        <div className="shrink-0 p-6 flex gap-4 items-start" style={{ maxWidth: '55%' }}>
          {imgSrc && (
            <div
              className="rounded-lg overflow-hidden shrink-0 shadow-md"
              style={{
                width: 120,
                height: 90,
                border: '2px solid var(--stone-light)',
              }}
            >
              <img
                src={imgSrc}
                alt={building.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-end min-w-0">
            <p className="font-mono text-xs mb-1" style={{ color: 'var(--stone-dark)' }}>
              {building.city_registry_id}
            </p>
            <h3 className="font-serif font-bold text-xl mb-1" style={{ color: 'var(--navy)' }}>
              {building.name}
            </h3>
            <p className="text-sm mb-2" style={{ color: 'var(--navy-soft)' }}>
              {building.address}
            </p>
            {building.protection_level && (
              <span
                className="text-xs px-2 py-0.5 rounded font-bold inline-block"
                style={{ backgroundColor: 'var(--amber-pale)', color: 'var(--amber-dark)' }}
              >
                רמה {building.protection_level}
              </span>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-3 px-6 pb-5 relative" style={{ zIndex: 1 }}>
          <Link
            href={`/buildings/${building.id}/file`}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--amber)' }}
          >
            פתח תיק
          </Link>
          <Link
            href={`/buildings/${building.id}`}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--navy-soft)' }}
          >
            פרטי אתר
          </Link>
        </div>
      )}
    </div>
  );
}

function PublicCard({
  building,
  onAddToRoute,
  showActions,
}: {
  building: Building;
  onAddToRoute?: (buildingId: string) => void;
  showActions: boolean;
}) {
  const tags = [
    building.style,
    ...(building.historical_periods?.slice(0, 2) ?? []),
    ...(building.preservation_reasons?.slice(0, 2) ?? []),
  ].filter(Boolean);
  const imgSrc = SITE_IMAGES[building.id];

  return (
    <div className="public-accent rounded-xl relative overflow-hidden" style={{ minHeight: imgSrc ? 200 : undefined }}>
      {/* Background photo */}
      {imgSrc && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <img
            src={imgSrc}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.12, filter: 'grayscale(40%) sepia(10%)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, rgba(232,244,247,0.9) 25%, transparent 75%)' }} />
        </div>
      )}

      <div className="flex relative" style={{ zIndex: 1 }}>
        {/* Left: description */}
        <div className="flex-1 p-6 min-w-0">
          {building.full_description && (
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'var(--navy-soft)' }}
            >
              {building.full_description.length > 200
                ? building.full_description.slice(0, 200) + '…'
                : building.full_description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: photo + title */}
        <div className="shrink-0 p-6 flex gap-4 items-start" style={{ maxWidth: '55%' }}>
          {imgSrc && (
            <div
              className="rounded-lg overflow-hidden shrink-0 shadow-md"
              style={{
                width: 120,
                height: 90,
                border: '2px solid var(--ocean-pale)',
              }}
            >
              <img
                src={imgSrc}
                alt={building.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-end min-w-0">
            <div className="flex items-baseline gap-3 mb-1 justify-end">
              <h3 className="font-serif font-bold text-2xl" style={{ color: 'var(--navy)' }}>
                {building.name}
              </h3>
            </div>
            {building.year_built && (
              <span className="text-sm font-mono" style={{ color: 'var(--ocean)' }}>
                {building.year_built}
              </span>
            )}
            <p className="text-sm mt-1" style={{ color: 'var(--navy-soft)' }}>
              {building.address}
              {building.neighborhood && ` — ${building.neighborhood}`}
            </p>
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-3 px-6 pb-5 relative" style={{ borderTop: '1px solid var(--ocean-pale)', zIndex: 1, paddingTop: 16 }}>
          <Link
            href={`/buildings/${building.id}`}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--ocean)' }}
          >
            קרא עוד
          </Link>
          {onAddToRoute && (
            <button
              onClick={() => onAddToRoute(building.id)}
              className="px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'var(--ocean-pale)',
                color: 'var(--ocean-dark)',
                border: '1px solid var(--ocean-light)',
              }}
            >
              הוסף למסלול
            </button>
          )}
        </div>
      )}
    </div>
  );
}

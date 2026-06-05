'use client';

import Link from 'next/link';
import { Building, STATUS_COLORS, STATUS_LABELS, BuildingStatus } from '@/lib/types';

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

  return (
    <div className="card-heritage pro-accent p-6">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs mb-1" style={{ color: 'var(--stone-dark)' }}>
            {building.city_registry_id}
          </p>
          <h3 className="font-serif font-bold text-xl mb-2" style={{ color: 'var(--ink)' }}>
            {building.name}
          </h3>
          <p className="text-sm mb-3" style={{ color: 'var(--ink-soft)' }}>
            {building.address}
          </p>

          <div className="flex flex-wrap gap-3 text-xs mb-4" style={{ color: 'var(--ink-soft)' }}>
            {building.taba && <span>גוש: {building.taba}</span>}
            {building.parcel && <span>חלקה: {building.parcel}</span>}
            {building.protection_level && (
              <span
                className="px-2 py-0.5 rounded font-bold"
                style={{ backgroundColor: 'var(--amber-pale)', color: 'var(--amber-dark)' }}
              >
                רמה {building.protection_level}
              </span>
            )}
            {building.year_built && <span>נבנה: {building.year_built}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
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
      </div>

      {showActions && (
        <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--stone-light)' }}>
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
            style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--ink-soft)' }}
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

  return (
    <div className="public-accent rounded-xl p-6">
      <div className="mb-4">
        <div className="flex items-baseline gap-3 mb-2">
          <h3 className="font-serif font-bold text-2xl" style={{ color: 'var(--ink)' }}>
            {building.name}
          </h3>
          {building.year_built && (
            <span className="text-sm font-mono" style={{ color: 'var(--ocean)' }}>
              {building.year_built}
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
          {building.address}
          {building.neighborhood && ` — ${building.neighborhood}`}
        </p>
      </div>

      {building.full_description && (
        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: 'var(--ink-soft)' }}
        >
          {building.full_description.length > 200
            ? building.full_description.slice(0, 200) + '…'
            : building.full_description}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
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

      {showActions && (
        <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--ocean-pale)' }}>
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

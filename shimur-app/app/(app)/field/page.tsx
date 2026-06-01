import Link from 'next/link';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { StatusBadge } from '@/components/buildings/StatusBadge';

export default function FieldPage() {
  const buildings = DEMO_BUILDINGS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">מצב שטח</h1>
        <p className="text-ink-soft">בחר אתר לתיעוד בשטח</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buildings.map((building) => (
          <Link
            key={building.id}
            href={`/field/${building.id}`}
            className="bg-white rounded-lg border border-stone-light p-5 hover:bg-parchment transition-colors flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-ink">{building.name}</p>
                <p className="text-sm text-ink-soft mt-0.5">{building.address}</p>
              </div>
              <StatusBadge status={building.status} />
            </div>
            <div className="flex gap-4 text-xs text-ink-soft">
              <span>רמה: {building.protection_level}</span>
              {building.is_complex && <span>מתחם</span>}
              {building.year_built && <span>{building.year_built}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

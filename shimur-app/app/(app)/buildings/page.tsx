import Link from 'next/link';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

export default function BuildingsPage() {
  const buildings = DEMO_BUILDINGS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">רשימת מבנים</h1>
        <p className="text-ink-soft">{buildings.length} מבנים במערכת</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg border border-stone-light">
          <thead>
            <tr className="border-b border-stone-light bg-parchment-deep">
              <th className="px-6 py-3 text-right text-sm font-semibold text-ink">שם</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-ink">כתובת</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-ink">שכונה</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-ink">מס׳ רישום</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-ink">סטטוס</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-ink">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-light">
            {buildings.map((building) => (
              <tr key={building.id} className="hover:bg-parchment transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-ink">{building.name}</td>
                <td className="px-6 py-4 text-sm text-ink-soft">{building.address}</td>
                <td className="px-6 py-4 text-sm text-ink-soft">{building.neighborhood || '—'}</td>
                <td className="px-6 py-4 text-sm text-ink-soft font-mono">{building.city_registry_id}</td>
                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={building.status} />
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/buildings/${building.id}`}
                    className="text-sm font-medium transition-colors"
                    style={{ color: '#8B7355' }}
                  >
                    פתח
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

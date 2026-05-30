import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BuildingDetailPage({ params }: Props) {
  const { id } = await params;
  const building = DEMO_BUILDINGS.find(b => b.id === id);

  if (!building) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/buildings" className="text-sm mb-3 inline-block transition-colors" style={{ color: '#8B7355' }}>
            ← חזרה לרשימה
          </Link>
          <h1 className="text-3xl font-serif font-bold text-ink">{building.name}</h1>
          <p className="text-ink-soft mt-1">{building.address}</p>
        </div>
        <StatusBadge status={building.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-stone-light p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">מס׳ רישום בעיר</label>
            <p className="text-lg font-mono text-ink">{building.city_registry_id}</p>
          </div>
          {building.neighborhood && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">שכונה</label>
              <p className="text-ink">{building.neighborhood}</p>
            </div>
          )}
          {building.year_built && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">שנת בנייה</label>
              <p className="text-ink">{building.year_built}</p>
            </div>
          )}
          {building.floors && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">קומות</label>
              <p className="text-ink">{building.floors}</p>
            </div>
          )}
          {building.total_built_area && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">שטח בנוי</label>
              <p className="text-ink">{building.total_built_area.toLocaleString()} מ"ר</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-stone-light p-6 space-y-4">
          {building.architect && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">אדריכל</label>
              <p className="text-ink">{building.architect}</p>
            </div>
          )}
          {building.protection_level && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">רמת שימור</label>
              <p className="text-lg font-semibold" style={{ color: '#8B3A1E' }}>{building.protection_level}</p>
            </div>
          )}
          {building.construction_type && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">סוג בנייה</label>
              <p className="text-ink">{building.construction_type}</p>
            </div>
          )}
          {building.is_complex && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">סוג</label>
              <p className="text-ink">מתחם</p>
            </div>
          )}
        </div>
      </div>

      {building.current_use && (
        <div className="bg-white rounded-lg border border-stone-light p-6">
          <label className="block text-xs font-semibold text-ink-soft uppercase mb-2">שימוש קיים</label>
          <p className="text-ink">{building.current_use}</p>
        </div>
      )}

      {building.documentation_reason && (
        <div className="bg-white rounded-lg border border-stone-light p-6">
          <label className="block text-xs font-semibold text-ink-soft uppercase mb-2">סיבת תיעוד</label>
          <p className="text-ink">{building.documentation_reason}</p>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link
          href={`/buildings/${building.id}/file`}
          className="px-6 py-3 text-white font-medium rounded-md transition-colors text-sm"
          style={{ backgroundColor: '#8B7355' }}
        >
          פתח תיק תיעוד
        </Link>
        <Link
          href={`/field/${building.id}`}
          className="px-6 py-3 font-medium rounded-md transition-colors text-sm border"
          style={{ backgroundColor: 'white', color: '#4A5C45', borderColor: '#4A5C45' }}
        >
          מצב שטח
        </Link>
      </div>
    </div>
  );
}

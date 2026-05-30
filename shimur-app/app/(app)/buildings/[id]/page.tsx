import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { notFound } from 'next/navigation';
import { isDemoMode, getDemoBuildingById } from '@/lib/demo/utils';

interface BuildingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BuildingDetailPage({
  params,
}: BuildingDetailPageProps) {
  const { id } = await params;
  const demoMode = await isDemoMode();

  let building = null;
  let error = false;

  if (demoMode) {
    building = getDemoBuildingById(id);
  } else {
    const supabase = await createClient();
    const { data, error: fetchError } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      error = true;
    } else {
      building = data;
    }
  }

  if (error || !building) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/buildings" className="text-sm text-stone hover:text-stone-dark mb-3 inline-block">
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
            <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
              מס׳ רישום בעיר
            </label>
            <p className="text-lg font-mono text-ink">{building.city_registry_id}</p>
          </div>
          {building.neighborhood && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                שכונה
              </label>
              <p className="text-ink">{building.neighborhood}</p>
            </div>
          )}
          {building.year_built && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                שנת בנייה
              </label>
              <p className="text-ink">{building.year_built}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-stone-light p-6 space-y-4">
          {building.architect && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                אדריכל
              </label>
              <p className="text-ink">{building.architect}</p>
            </div>
          )}
          {building.protection_level && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                רמת שימור
              </label>
              <p className="text-lg font-semibold text-rust">{building.protection_level}</p>
            </div>
          )}
          {building.is_complex && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                סוג
              </label>
              <p className="text-ink">מתחם</p>
            </div>
          )}
        </div>
      </div>

      {building.current_use && (
        <div className="bg-white rounded-lg border border-stone-light p-6">
          <label className="block text-xs font-semibold text-ink-soft uppercase mb-2">
            שימוש קיים
          </label>
          <p className="text-ink">{building.current_use}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-stone text-white rounded-md hover:bg-stone-dark transition-colors text-sm font-medium">
          פתח תיק תיעוד
        </button>
        <button className="px-4 py-2 bg-white text-stone border border-stone rounded-md hover:bg-stone-light transition-colors text-sm font-medium">
          עדכן נתונים
        </button>
      </div>
    </div>
  );
}

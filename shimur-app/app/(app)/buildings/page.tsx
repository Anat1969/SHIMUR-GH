import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { isDemoMode, getDemoBuildings } from '@/lib/demo/utils';

export default async function BuildingsPage() {
  let buildings = [];
  let error = null;
  const demoMode = await isDemoMode();

  if (demoMode) {
    buildings = getDemoBuildings();
  } else {
    const supabase = await createClient();

    try {
      const { data, error: fetchError } = await supabase
        .from('buildings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        error = fetchError.message;
      } else {
        buildings = data || [];
      }
    } catch (err) {
      error = 'שגיאה בטעינת הנתונים';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">
          רשימת מבנים
        </h1>
        <p className="text-ink-soft">
          {buildings.length} מבנים במערכת
        </p>
      </div>

      {error ? (
        <div className="p-6 bg-rust-light/10 border border-rust-light rounded-lg text-rust">
          <p className="font-medium mb-2">שגיאה בטעינת הנתונים</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-4">
            💡 ודא שהגדרת את משתני הסביבה בהצלחה:
          </p>
          <ul className="text-sm mt-2 list-disc list-inside space-y-1">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      ) : buildings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-stone-light">
          <p className="text-ink-soft mb-4">אין מבנים עדיין במערכת</p>
          <p className="text-xs text-ink-soft/70">
            כאשר תוגדרו מבנים, הם יופיעו כאן
          </p>
        </div>
      ) : (
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
                  <td className="px-6 py-4 text-sm font-medium text-ink">
                    {building.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-soft">
                    {building.address}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-soft">
                    {building.neighborhood || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-ink-soft font-mono">
                    {building.city_registry_id}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={building.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/buildings/${building.id}`}
                      className="text-stone hover:text-stone-dark text-sm font-medium transition-colors"
                    >
                      פתח
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { BuildingsMap } from '@/components/map/BuildingsMap';
import { isDemoMode, getDemoBuildings } from '@/lib/demo/utils';

export default async function MapPage() {
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
        .limit(200);

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
          מפת מבנים
        </h1>
        <p className="text-ink-soft">
          {buildings.length} מבנים במערכת
        </p>
      </div>

      {error ? (
        <div className="p-6 bg-rust-light/10 border border-rust-light rounded-lg text-rust">
          <p className="font-medium mb-2">שגיאה בטעינת הנתונים</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : buildings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg border border-stone-light h-[500px] flex items-center justify-center">
          <div>
            <p className="text-ink-soft mb-4">אין מבנים עם קואורדינטות עדיין במערכת</p>
            <p className="text-xs text-ink-soft/70">
              כאשר תיווסף מידע מיקום למבנים, הם יופיעו על המפה
            </p>
          </div>
        </div>
      ) : (
        <BuildingsMap buildings={buildings} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status legend */}
        <div className="bg-white rounded-lg border border-stone-light p-4">
          <p className="text-xs font-semibold text-ink-soft uppercase mb-3">
            תרגום צבעים
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#8B7355' }}
              />
              <span>לא התחיל</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#C4582A' }}
              />
              <span>בתהליך</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#4A5C45' }}
              />
              <span>הוגש</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#1A1410' }}
              />
              <span>אושר</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: '#8B3A1E' }}
              />
              <span>הוחזר</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

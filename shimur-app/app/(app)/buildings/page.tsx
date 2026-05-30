import { BuildingsTable } from '@/components/buildings/BuildingsTable';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { getAdminClient } from '@/lib/supabase/admin';

async function getActivity(): Promise<Record<string, { date: string; note: string }>> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
    const admin = getAdminClient();

    // Get latest chapter update per building
    const { data: chapters } = await admin
      .from('chapters')
      .select('updated_at, title, documentation_files(building_id, buildings(city_registry_id))')
      .order('updated_at', { ascending: false });

    // Get latest finding per building
    const { data: findings } = await admin
      .from('findings')
      .select('created_at, location_desc, documentation_files(building_id, buildings(city_registry_id))')
      .order('created_at', { ascending: false });

    const activity: Record<string, { date: string; note: string }> = {};

    (chapters || []).forEach((c: any) => {
      const regId = c.documentation_files?.buildings?.city_registry_id;
      if (!regId || activity[regId]) return;
      activity[regId] = { date: c.updated_at, note: `עודכן פרק: ${c.title}` };
    });

    (findings || []).forEach((f: any) => {
      const regId = f.documentation_files?.buildings?.city_registry_id;
      if (!regId) return;
      const existing = activity[regId];
      if (!existing || new Date(f.created_at) > new Date(existing.date)) {
        activity[regId] = { date: f.created_at, note: `ממצא: ${f.location_desc}` };
      }
    });

    return activity;
  } catch { return {}; }
}

export default async function BuildingsPage() {
  const activity = await getActivity();
  const buildings = DEMO_BUILDINGS.map(b => ({
    ...b,
    lastActivity: activity[b.city_registry_id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-2">רשימת מבנים</h1>
        <p className="text-ink-soft">{buildings.length} מבנים במערכת</p>
      </div>
      <BuildingsTable buildings={buildings} />
    </div>
  );
}

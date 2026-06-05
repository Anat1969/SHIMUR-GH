import { BuildingsTable } from '@/components/buildings/BuildingsTable';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { getAdminClient } from '@/lib/supabase/admin';

async function getActivity(): Promise<Record<string, { date: string; note: string }>> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
    const admin = getAdminClient();

    // Step 1: get all buildings from Supabase to map id → city_registry_id
    const { data: dbBuildings } = await admin
      .from('buildings')
      .select('id, city_registry_id');
    if (!dbBuildings?.length) return {};

    const idToReg: Record<string, string> = {};
    dbBuildings.forEach(b => { idToReg[b.id] = b.city_registry_id; });

    // Step 2: get all documentation_files to map file_id → building_id
    const { data: files } = await admin
      .from('documentation_files')
      .select('id, building_id');
    if (!files?.length) return {};

    const fileToBuilding: Record<string, string> = {};
    files.forEach(f => { fileToBuilding[f.id] = f.building_id; });

    const activity: Record<string, { date: string; note: string }> = {};

    // Step 3: latest chapter per file
    const { data: chapters } = await admin
      .from('chapters')
      .select('file_id, updated_at, title')
      .order('updated_at', { ascending: false })
      .limit(100);

    (chapters || []).forEach(c => {
      const buildingId = fileToBuilding[c.file_id];
      const regId = buildingId ? idToReg[buildingId] : null;
      if (!regId || activity[regId]) return;
      activity[regId] = { date: c.updated_at, note: `עודכן: ${c.title}` };
    });

    // Step 4: latest finding per file
    const { data: findings } = await admin
      .from('findings')
      .select('file_id, created_at, location_desc')
      .order('created_at', { ascending: false })
      .limit(100);

    (findings || []).forEach(f => {
      const buildingId = fileToBuilding[f.file_id];
      const regId = buildingId ? idToReg[buildingId] : null;
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
      <div className="page-intro">
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--navy)' }}>ניהול רשומות — אתרי שימור</h1>
        <p style={{ color: 'var(--navy-soft)' }}>
          <span className="highlight-text">{buildings.length} אתרים</span> במערכת.
          ניהול כל רשומות השימור — סטטוס תיעוד, עדיפות, והתקדמות.
          שימור מתחיל בתיעוד שיטתי.
        </p>
      </div>
      <BuildingsTable buildings={buildings} />
    </div>
  );
}

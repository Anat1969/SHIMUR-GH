import { BuildingsTable } from '@/components/buildings/BuildingsTable';
import { getSites } from '@/lib/data';
import { T } from '@/lib/supabase/config';
import { getAdminClient } from '@/lib/supabase/admin';

async function getActivity(): Promise<Record<string, { date: string; note: string }>> {
  const admin = getAdminClient();
  if (!admin) return {};
  try {
    // קובץ → מספר רישום, בשאילתה אחת
    const { data: files, error } = await admin
      .from(T.files)
      .select('id, shimur_buildings(city_registry_id)');
    if (error) throw error;
    const fileToReg: Record<string, string> = {};
    (files as unknown as { id: string; shimur_buildings: { city_registry_id: string } | null }[] ?? [])
      .forEach(f => { if (f.shimur_buildings) fileToReg[f.id] = f.shimur_buildings.city_registry_id; });

    const [{ data: chapters }, { data: findings }] = await Promise.all([
      admin.from(T.chapters).select('file_id, updated_at, title').order('updated_at', { ascending: false }).limit(200),
      admin.from(T.findings).select('file_id, created_at, location_desc').order('created_at', { ascending: false }).limit(200),
    ]);

    const activity: Record<string, { date: string; note: string }> = {};
    const consider = (fileId: string, date: string, note: string) => {
      const reg = fileToReg[fileId];
      if (!reg) return;
      const cur = activity[reg];
      if (!cur || new Date(date) > new Date(cur.date)) activity[reg] = { date, note };
    };
    (chapters ?? []).forEach(c => consider(c.file_id, c.updated_at, `עודכן: ${c.title}`));
    (findings ?? []).forEach(f => consider(f.file_id, f.created_at, `ממצא: ${f.location_desc}`));
    return activity;
  } catch (err) {
    console.error('[buildings] activity:', err);
    return {};
  }
}

export default async function BuildingsPage() {
  const [activity, { sites }] = await Promise.all([getActivity(), getSites()]);
  const buildings = sites.map(b => ({
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

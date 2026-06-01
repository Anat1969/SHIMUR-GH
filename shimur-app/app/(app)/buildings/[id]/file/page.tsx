import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { FileActions } from '@/components/file/FileActions';
import { getAdminClient } from '@/lib/supabase/admin';
import { ConfigBanner } from '@/components/ConfigBanner';

const CHAPTERS_SINGLE = [
  { id: 'aleph', letter: 'א', title: 'פרטים מינהליים' },
  { id: 'bet',   letter: 'ב', title: 'תיאור ארכיטקטוני' },
  { id: 'gimel', letter: 'ג', title: 'סקר חזיתות' },
  { id: 'dalet', letter: 'ד', title: 'פרטי בינוי' },
  { id: 'heh',   letter: 'ה', title: 'היסטוריה ורקע' },
  { id: 'vav',   letter: 'ו', title: 'ממצאים ופגיעות' },
  { id: 'zayin', letter: 'ז', title: 'הערכת ערכים' },
  { id: 'het',   letter: 'ח', title: 'מסקנות והמלצות' },
  { id: 'tet',   letter: 'ט', title: 'הצהרת מתעד' },
];

const CHAPTERS_COMPLEX = [
  ...CHAPTERS_SINGLE.slice(0, 2),
  { id: 'gimel', letter: 'ג', title: 'ניתוח טופוגרפי ואורבני' },
  { id: 'dalet', letter: 'ד', title: 'סקר חזיתות' },
  { id: 'heh',   letter: 'ה', title: 'היסטוריה קרטוגרפית' },
  { id: 'vav',   letter: 'ו', title: 'פרטי בינוי' },
  { id: 'zayin', letter: 'ז', title: 'ממצאים ופגיעות' },
  { id: 'het',   letter: 'ח', title: 'הערכת ערכים' },
  { id: 'tet',   letter: 'ט', title: 'מסקנות והמלצות' },
  { id: 'yod',   letter: 'י', title: 'הצהרת מתעד' },
];

async function getChapterStatuses(cityRegistryId: string, chapterIds: string[]) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
    const admin = getAdminClient();
    const { data: building } = await admin.from('buildings').select('id').eq('city_registry_id', cityRegistryId).maybeSingle();
    if (!building) return {};
    const { data: file } = await admin.from('documentation_files').select('id').eq('building_id', building.id).maybeSingle();
    if (!file) return {};
    const { data: chapters } = await admin.from('chapters').select('chapter_key, status').eq('file_id', file.id);
    const map: Record<string, string> = {};
    (chapters || []).forEach(c => { map[c.chapter_key] = c.status; });
    return map;
  } catch { return {}; }
}

interface Props { params: Promise<{ id: string }> }

export default async function FilePage({ params }: Props) {
  const { id } = await params;
  const building = DEMO_BUILDINGS.find(b => b.id === id);
  if (!building) notFound();

  const chapters = building!.is_complex ? CHAPTERS_COMPLEX : CHAPTERS_SINGLE;
  const statuses = await getChapterStatuses(building!.city_registry_id, chapters.map(c => c.id));

  const STATUS_COLORS: Record<string, string> = { 'מושלם': '#4A5C45', 'בתהליך': '#C4582A', 'ריק': '#C8B89A' };
  const STATUS_LABELS: Record<string, string> = { 'מושלם': 'הושלם', 'בתהליך': 'בתהליך', 'ריק': 'לא התחיל' };

  return (
    <div className="space-y-6">
      <ConfigBanner type="file" />
      <div>
        <Link href={`/buildings/${id}`} className="text-sm mb-3 inline-block" style={{ color: '#8B7355' }}>
          ← חזרה לאתר
        </Link>
        <h1 className="text-3xl font-serif font-bold text-ink">{building!.name}</h1>
        <p className="text-ink-soft mt-1">
          תיק תיעוד — {building!.is_complex ? 'מתחם' : 'אתר'} | {chapters.length} פרקים
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((ch) => {
          const status = statuses[ch.id] ?? 'ריק';
          const pct = status === 'מושלם' ? 100 : status === 'בתהליך' ? 50 : 0;
          return (
            <Link key={ch.id} href={`/buildings/${id}/file/${ch.id}`}
              className="bg-white rounded-lg border border-stone-light p-5 hover:bg-parchment transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-serif font-bold" style={{ color: '#C8B89A' }}>{ch.letter}</span>
                <span className="text-sm font-medium text-ink">{ch.title}</span>
              </div>
              <div className="w-full h-1.5 rounded-full mt-3" style={{ backgroundColor: '#EDE0CC' }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] }} />
              </div>
              <p className="text-xs mt-2" style={{ color: STATUS_COLORS[status] }}>{STATUS_LABELS[status]}</p>
            </Link>
          );
        })}
      </div>

      <FileActions
        buildingId={id}
        buildingName={building!.name}
        cityRegistryId={building!.city_registry_id}
        firstChapterId={chapters[0].id}
      />
    </div>
  );
}

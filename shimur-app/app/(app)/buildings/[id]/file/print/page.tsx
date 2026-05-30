import { notFound } from 'next/navigation';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { getAdminClient } from '@/lib/supabase/admin';

const ALL_CHAPTERS = [
  { id: 'aleph', letter: 'א', title: 'פרטים מינהליים' },
  { id: 'bet',   letter: 'ב', title: 'תיאור ארכיטקטוני' },
  { id: 'gimel', letter: 'ג', title: 'סקר חזיתות / ניתוח טופוגרפי' },
  { id: 'dalet', letter: 'ד', title: 'פרטי בינוי / סקר חזיתות' },
  { id: 'heh',   letter: 'ה', title: 'היסטוריה ורקע' },
  { id: 'vav',   letter: 'ו', title: 'ממצאים ופגיעות' },
  { id: 'zayin', letter: 'ז', title: 'הערכת ערכים' },
  { id: 'het',   letter: 'ח', title: 'מסקנות והמלצות' },
  { id: 'tet',   letter: 'ט', title: 'הצהרת מתעד' },
];

async function loadAllChapters(cityRegistryId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
    const admin = getAdminClient();
    const { data: building } = await admin.from('buildings').select('id').eq('city_registry_id', cityRegistryId).maybeSingle();
    if (!building) return {};
    const { data: file } = await admin.from('documentation_files').select('id').eq('building_id', building.id).maybeSingle();
    if (!file) return {};
    const { data: chapters } = await admin.from('chapters').select('chapter_key, title, content, status').eq('file_id', file.id);
    const map: Record<string, { title: string; content: Record<string, string>; status: string }> = {};
    (chapters || []).forEach(c => { map[c.chapter_key] = { title: c.title, content: c.content as Record<string, string>, status: c.status }; });
    return map;
  } catch { return {}; }
}

interface Props { params: Promise<{ id: string }> }

export default async function PrintPage({ params }: Props) {
  const { id } = await params;
  const building = DEMO_BUILDINGS.find(b => b.id === id);
  if (!building) notFound();

  const chaptersData = await loadAllChapters(building!.city_registry_id);
  const today = new Date().toLocaleDateString('he-IL');

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 1.5cm; }
          body { font-family: 'Heebo', Arial, sans-serif; direction: rtl; }
          .chapter-section { page-break-before: always; }
          .chapter-section:first-of-type { page-break-before: auto; }
        }
        body { direction: rtl; font-family: Arial, sans-serif; background: #F7F0E3; }
        .print-page { max-width: 800px; margin: 0 auto; padding: 2rem; }
      `}</style>

      <div className="print-page" style={{ backgroundColor: '#F7F0E3', minHeight: '100vh' }}>
        {/* Controls */}
        <div className="no-print flex gap-3 mb-8 p-4 bg-white rounded-lg border border-stone-light">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 text-white rounded-md text-sm font-medium"
            style={{ backgroundColor: '#4A5C45' }}
          >
            הדפס / שמור PDF
          </button>
          <a href={`/buildings/${id}/file`} className="px-6 py-2 rounded-md text-sm font-medium border" style={{ color: '#8B7355', borderColor: '#C8B89A' }}>
            ← חזרה לתיק
          </a>
        </div>

        {/* Cover */}
        <div style={{ borderBottom: '3px solid #C8B89A', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <p className="text-xs text-ink-soft uppercase tracking-widest mb-2">תיק תיעוד שימור — עיריית אשדוד</p>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'Georgia, serif', color: '#1A1410', marginBottom: '0.5rem' }}>{building!.name}</h1>
          <p style={{ color: '#3D3228', fontSize: '1.1rem' }}>{building!.address}</p>
          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              ['מס׳ רישום', building!.city_registry_id],
              ['רמת שימור', building!.protection_level ?? '—'],
              ['שנת בנייה', building!.year_built?.toString() ?? '—'],
              ['תאריך הפקה', today],
            ].map(([k, v]) => (
              <div key={k}>
                <span style={{ fontSize: '0.7rem', color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                <p style={{ fontWeight: 600, color: '#1A1410' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chapters */}
        {ALL_CHAPTERS.map((ch) => {
          const data = chaptersData[ch.id];
          const content = data?.content ?? {};
          const hasContent = Object.values(content).some(v => v?.trim());

          return (
            <div key={ch.id} className="chapter-section" style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: '1px solid #EDE0CC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '2rem', fontFamily: 'Georgia, serif', color: '#C8B89A', fontWeight: 700 }}>{ch.letter}</span>
                <h2 style={{ fontSize: '1.3rem', fontFamily: 'Georgia, serif', color: '#1A1410', margin: 0 }}>{ch.title}</h2>
                {!hasContent && (
                  <span style={{ fontSize: '0.75rem', color: '#C4582A', backgroundColor: 'rgba(196,88,42,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                    טרם מולא
                  </span>
                )}
              </div>

              {hasContent ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {Object.entries(content).filter(([, v]) => v?.trim()).map(([field, value]) => (
                    <div key={field} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: 6, border: '1px solid #EDE0CC' }}>
                      <p style={{ fontSize: '0.75rem', color: '#8B7355', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>{field}</p>
                      <p style={{ color: '#1A1410', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#8B7355', fontStyle: 'italic', fontSize: '0.9rem' }}>פרק זה טרם מולא</p>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div className="no-print" style={{ textAlign: 'center', color: '#8B7355', fontSize: '0.8rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #EDE0CC' }}>
          SHIMUR.ASHDOD v2.0 | הופק: {today}
        </div>
      </div>
    </>
  );
}

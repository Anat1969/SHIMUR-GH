import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { getAdminClient } from '@/lib/supabase/admin';
import { PrintButton } from '@/components/PrintButton';

async function loadCardData(cityRegistryId: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { chapters: {}, findings: [] };
    const admin = getAdminClient();

    const { data: building } = await admin.from('buildings').select('id').eq('city_registry_id', cityRegistryId).maybeSingle();
    if (!building) return { chapters: {}, findings: [] };

    const { data: file } = await admin.from('documentation_files').select('id').eq('building_id', building.id).maybeSingle();
    if (!file) return { chapters: {}, findings: [] };

    const [{ data: chaptersRaw }, { data: findingsRaw }] = await Promise.all([
      admin.from('chapters').select('chapter_key, title, content').eq('file_id', file.id),
      admin.from('findings').select('id, location_desc, notes, photo_ids, created_at').eq('file_id', file.id).order('created_at', { ascending: false }),
    ]);

    const chapters: Record<string, Record<string, string>> = {};
    (chaptersRaw || []).forEach(c => { chapters[c.chapter_key] = c.content as Record<string, string>; });

    // Enrich findings with photo URLs
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const findings = await Promise.all((findingsRaw || []).map(async (f) => {
      let photo_url: string | null = null;
      if (f.photo_ids?.length > 0) {
        const { data: photo } = await admin.from('photos').select('storage_path').eq('id', f.photo_ids[0]).maybeSingle();
        if (photo) photo_url = `${supabaseUrl}/storage/v1/object/public/findings-photos/${photo.storage_path}`;
      }
      return { ...f, photo_url };
    }));

    return { chapters, findings };
  } catch { return { chapters: {}, findings: [] }; }
}

const SLIDE_STYLE = {
  minHeight: '56.25vw',
  maxWidth: '100%',
  backgroundColor: 'white',
  border: '1px solid #EDE0CC',
  borderRadius: 8,
  padding: '3rem',
  marginBottom: '1.5rem',
  display: 'flex' as const,
  flexDirection: 'column' as const,
  direction: 'rtl' as const,
};

const SLIDE_TITLE = { fontSize: '0.7rem', color: '#8B7355', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '0.75rem' };
const HEADING = { fontSize: '2rem', fontFamily: 'Georgia, serif', color: '#1A1410', marginBottom: '1.5rem', borderBottom: '3px solid #C8B89A', paddingBottom: '0.75rem' };
const FIELD_BOX = { backgroundColor: '#F7F0E3', padding: '1rem', borderRadius: 6, marginBottom: '0.75rem' };
const FIELD_LABEL = { fontSize: '0.7rem', color: '#8B7355', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '0.35rem' };

function getField(content: Record<string, string> | undefined, key: string): string {
  if (!content) return '';
  return content[key] ?? '';
}

function SlideHeader({ num, title }: { num: string; title: string }) {
  return (
    <div style={SLIDE_TITLE}>פרק {num} — {title}</div>
  );
}

interface Props { params: Promise<{ id: string }> }

export default async function CardPage({ params }: Props) {
  const { id } = await params;
  const building = DEMO_BUILDINGS.find(b => b.id === id);
  if (!building) notFound();

  const { chapters, findings } = await loadCardData(building!.city_registry_id);
  const today = new Date().toLocaleDateString('he-IL');

  const emptyChapters = ['aleph','bet','gimel','dalet','heh','vav','zayin','het','tet']
    .filter(k => !chapters[k] || !Object.values(chapters[k]).some(v => v?.trim()));

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4 landscape; margin: 1cm; }
          body { background: white !important; }
          .slide { page-break-after: always; min-height: auto !important; height: 190mm; overflow: hidden; border: none !important; border-radius: 0 !important; margin: 0 !important; }
          .slide:last-of-type { page-break-after: auto; }
        }
        body { background: #F7F0E3; direction: rtl; }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem', direction: 'rtl' }}>
        {/* Controls */}
        <div className="no-print" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <PrintButton label="הדפס מצגת (Landscape)" />
          <Link href={`/buildings/${id}`}
            style={{ padding: '0.6rem 1.5rem', border: '1px solid #C8B89A', borderRadius: 6, color: '#8B7355', textDecoration: 'none' }}>
            ← חזרה למבנה
          </Link>
        </div>

        {/* Slide 1 — זיהוי */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="א" title="זיהוי" />
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'Georgia, serif', color: '#1A1410', marginBottom: '0.5rem' }}>{building!.name}</h1>
          <p style={{ fontSize: '1.2rem', color: '#3D3228', marginBottom: '2rem' }}>{building!.address}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: 'auto' }}>
            {[
              ['מס׳ רישום', building!.city_registry_id],
              ['רמת שימור', building!.protection_level ?? '—'],
              ['שנת בנייה', building!.year_built?.toString() ?? '—'],
              ['אדריכל', building!.architect ?? '—'],
              ['סוג בנייה', building!.construction_type ?? '—'],
              ['תאריך הפקה', today],
            ].map(([k, v]) => (
              <div key={k} style={FIELD_BOX}>
                <p style={FIELD_LABEL}>{k}</p>
                <p style={{ fontWeight: 600, color: '#1A1410' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Slide 2 — תקציר */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ב" title="תקציר" />
          <h2 style={HEADING}>תקציר ומיקום בשימור</h2>
          {[
            ['שימוש קיים', building!.current_use],
            ['סיבת תיעוד', building!.documentation_reason],
            ['המלצת שימור', getField(chapters['zayin'], 'המלצת צוות')],
            ['מסקנות כלליות', getField(chapters['het'], 'מסקנות כלליות')],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k as string} style={FIELD_BOX}>
              <p style={FIELD_LABEL}>{k as string}</p>
              <p style={{ color: '#1A1410', lineHeight: 1.7 }}>{v as string}</p>
            </div>
          ))}
        </div>

        {/* Slide 3 — רקע היסטורי */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ג" title="רקע היסטורי" />
          <h2 style={HEADING}>היסטוריה ורקע</h2>
          {chapters['heh'] && Object.entries(chapters['heh']).filter(([,v]) => v?.trim()).map(([k, v]) => (
            <div key={k} style={FIELD_BOX}>
              <p style={FIELD_LABEL}>{k}</p>
              <p style={{ color: '#1A1410', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{v}</p>
            </div>
          ))}
          {!chapters['heh'] && <p style={{ color: '#8B7355', fontStyle: 'italic' }}>פרק ה׳ טרם מולא</p>}
        </div>

        {/* Slide 4 — תיאור אדריכלי */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ד" title="תיאור אדריכלי" />
          <h2 style={HEADING}>תיאור אדריכלי</h2>
          {chapters['bet'] && Object.entries(chapters['bet']).filter(([,v]) => v?.trim()).map(([k, v]) => (
            <div key={k} style={FIELD_BOX}>
              <p style={FIELD_LABEL}>{k}</p>
              <p style={{ color: '#1A1410', lineHeight: 1.7 }}>{v}</p>
            </div>
          ))}
          {!chapters['bet'] && <p style={{ color: '#8B7355', fontStyle: 'italic' }}>פרק ב׳ טרם מולא</p>}
        </div>

        {/* Slide 5 — מצב קיים + ממצאים */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ה" title="מצב קיים וממצאים" />
          <h2 style={HEADING}>מצב קיים — ממצאי שטח ({findings.length})</h2>
          {findings.length === 0 && <p style={{ color: '#8B7355', fontStyle: 'italic' }}>טרם נרשמו ממצאי שטח</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', flex: 1 }}>
            {findings.slice(0, 6).map(f => (
              <div key={f.id} style={{ display: 'flex', gap: '0.75rem', ...FIELD_BOX }}>
                {f.photo_url && (
                  <img src={f.photo_url} alt="ממצא" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontWeight: 600, color: '#1A1410', fontSize: '0.9rem' }}>{f.location_desc}</p>
                  {f.notes && <p style={{ color: '#3D3228', fontSize: '0.8rem', marginTop: 4 }}>{f.notes}</p>}
                  <p style={{ color: '#8B7355', fontSize: '0.7rem', marginTop: 4 }}>{new Date(f.created_at).toLocaleDateString('he-IL')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide 6 — מדידה ושרטוט */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ו" title="מדידה ושרטוט" />
          <h2 style={HEADING}>סקר חזיתות ופרטי בינוי</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p style={{ ...FIELD_LABEL, fontSize: '0.85rem', marginBottom: '0.75rem' }}>פרק ג — סקר חזיתות</p>
              {chapters['gimel'] ? Object.entries(chapters['gimel']).filter(([,v]) => v?.trim()).map(([k,v]) => (
                <div key={k} style={FIELD_BOX}><p style={FIELD_LABEL}>{k}</p><p style={{ color: '#1A1410', fontSize: '0.85rem' }}>{v}</p></div>
              )) : <p style={{ color: '#8B7355', fontStyle: 'italic', fontSize: '0.85rem' }}>טרם מולא</p>}
            </div>
            <div>
              <p style={{ ...FIELD_LABEL, fontSize: '0.85rem', marginBottom: '0.75rem' }}>פרק ד — פרטי בינוי</p>
              {chapters['dalet'] ? Object.entries(chapters['dalet']).filter(([,v]) => v?.trim()).map(([k,v]) => (
                <div key={k} style={FIELD_BOX}><p style={FIELD_LABEL}>{k}</p><p style={{ color: '#1A1410', fontSize: '0.85rem' }}>{v}</p></div>
              )) : <p style={{ color: '#8B7355', fontStyle: 'italic', fontSize: '0.85rem' }}>טרם מולא</p>}
            </div>
          </div>
        </div>

        {/* Slide 7 — הערכת ערכים */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ז" title="הערכת ערכים" />
          <h2 style={HEADING}>הערכת ערכי שימור — מגילת בורה</h2>
          {chapters['zayin'] && Object.entries(chapters['zayin']).filter(([,v]) => v?.trim()).map(([k,v]) => (
            <div key={k} style={{ ...FIELD_BOX, borderRight: '4px solid #C8B89A' }}>
              <p style={FIELD_LABEL}>{k}</p>
              <p style={{ color: '#1A1410', lineHeight: 1.7 }}>{v}</p>
            </div>
          ))}
          {!chapters['zayin'] && <p style={{ color: '#8B7355', fontStyle: 'italic' }}>פרק ז׳ טרם מולא</p>}
        </div>

        {/* Slide 8 — המלצות */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ח" title="המלצות לשימור" />
          <h2 style={HEADING}>מסקנות והמלצות לשימור</h2>
          {chapters['het'] && Object.entries(chapters['het']).filter(([,v]) => v?.trim()).map(([k,v]) => (
            <div key={k} style={{ ...FIELD_BOX, borderRight: '4px solid #4A5C45' }}>
              <p style={FIELD_LABEL}>{k}</p>
              <p style={{ color: '#1A1410', lineHeight: 1.7 }}>{v}</p>
            </div>
          ))}
          {!chapters['het'] && <p style={{ color: '#8B7355', fontStyle: 'italic' }}>פרק ח׳ טרם מולא</p>}
        </div>

        {/* Slide 9 — נספחים + חוסרים */}
        <div className="slide" style={SLIDE_STYLE}>
          <SlideHeader num="ט" title="נספחים, מקורות וחוסרים" />
          <h2 style={HEADING}>נספחים ומקורות</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              {chapters['tet'] && Object.entries(chapters['tet']).filter(([,v]) => v?.trim()).map(([k,v]) => (
                <div key={k} style={FIELD_BOX}><p style={FIELD_LABEL}>{k}</p><p style={{ color: '#1A1410' }}>{v}</p></div>
              ))}
              {!chapters['tet'] && <p style={{ color: '#8B7355', fontStyle: 'italic' }}>הצהרת מתעד טרם מולאה</p>}
            </div>
            <div>
              <p style={{ ...FIELD_LABEL, fontSize: '0.85rem', marginBottom: '0.75rem', color: '#8B3A1E' }}>פרקים חסרים או חלקיים</p>
              {emptyChapters.length === 0 ? (
                <p style={{ color: '#4A5C45', fontWeight: 600 }}>✓ כל הפרקים מולאו</p>
              ) : (
                emptyChapters.map(k => (
                  <div key={k} style={{ ...FIELD_BOX, backgroundColor: 'rgba(139,58,30,0.07)' }}>
                    <p style={{ color: '#8B3A1E', fontSize: '0.85rem' }}>פרק {k} — טרם מולא</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <p style={{ color: '#8B7355', fontSize: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #EDE0CC' }}>
            SHIMUR.ASHDOD v2.0 | עיריית אשדוד | הופק: {today}
          </p>
        </div>
      </div>
    </>
  );
}

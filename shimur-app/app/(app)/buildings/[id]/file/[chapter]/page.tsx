import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

const CHAPTERS_SINGLE: Record<string, { letter: string; title: string; description: string; fields: string[] }> = {
  aleph: { letter: 'א', title: 'פרטים מינהליים', description: 'נתוני זיהוי, כתובת, גוש/חלקה, בעלות, שימוש', fields: ['כתובת מלאה','גוש','חלקה','שם בעל הנכס','שימוש קיים','שימוש מקורי','יוזם התיעוד'] },
  bet: { letter: 'ב', title: 'תיאור ארכיטקטוני', description: 'תיאור כללי של המבנה, סגנון, חומרים, מאפיינים', fields: ['תיאור כללי','סגנון אדריכלי','שנת בנייה','שנת בנייה – מקור','אדריכל','חומרי בנייה עיקריים','מספר קומות','שטח בנוי'] },
  gimel: { letter: 'ג', title: 'סקר חזיתות', description: 'תיעוד צילומי ותיאורי של כל חזיתות המבנה', fields: ['חזית צפונית','חזית דרומית','חזית מזרחית','חזית מערבית','כניסות ופתחים','גג ומרזבים'] },
  dalet: { letter: 'ד', title: 'פרטי בינוי', description: 'פרטים טכניים: יסודות, קירות, תקרות, גג', fields: ['שיטת בינוי','יסודות','מערכת קירות','תקרות ורצפות','מערכת גג','פרטים מיוחדים'] },
  heh: { letter: 'ה', title: 'היסטוריה ורקע', description: 'תולדות המבנה, שינויים לאורך השנים, תיעוד ארכיוני', fields: ['רקע היסטורי','שינויים ידועים','מקורות ארכיוניים','תצלומים היסטוריים','תוכניות היסטוריות'] },
  vav: { letter: 'ו', title: 'ממצאים ופגיעות', description: 'תיעוד נזקים, בליה, שינויים מאוחרים ופגיעות שימור', fields: ['ממצאי בליה','נזקי רטיבות','שינויים מאוחרים','פגיעות חריגות','רמת דחיפות טיפול'] },
  zayin: { letter: 'ז', title: 'הערכת ערכים', description: 'ניתוח ערכי השימור לפי מגילת בורה', fields: ['ערך היסטורי-תרבותי','ערך אדריכלי','ערך אורבני-סביבתי','ערך קהילתי-חברתי','המלצת צוות'] },
  het: { letter: 'ח', title: 'מסקנות והמלצות', description: 'המלצות לשימור, עדיפויות טיפול, תנאי אישור', fields: ['מסקנות כלליות','המלצות שימור','תנאים לאישור','עדיפויות טיפול','הערות מיוחדות'] },
  tet: { letter: 'ט', title: 'הצהרת מתעד', description: 'הצהרה חוקית חתומה של האדריכל המתעד', fields: ['שם מתעד','מספר ת.ז.','מספר רישיון','תאריך סיור','תאריך חתימה','חתימה'] },
};

const CHAPTERS_COMPLEX: Record<string, { letter: string; title: string; description: string; fields: string[] }> = {
  aleph: CHAPTERS_SINGLE.aleph,
  bet: CHAPTERS_SINGLE.bet,
  gimel: { letter: 'ג', title: 'ניתוח טופוגרפי ואורבני', description: 'ניתוח המתחם בהקשר האורבני והטופוגרפי', fields: ['הקשר אורבני','טופוגרפיה','גבולות המתחם','מבנים שכנים','ניתוח מרקם'] },
  dalet: { letter: 'ד', title: 'סקר חזיתות', description: 'תיעוד חזיתות כל מבני המתחם', fields: ['חזיתות חיצוניות','חזיתות פנימיות','מרחבים ציבוריים','שערים וכניסות'] },
  heh: { letter: 'ה', title: 'היסטוריה קרטוגרפית', description: 'מפות היסטוריות ושינויים לאורך הזמן', fields: ['מפות היסטוריות','שלבי פיתוח','שינויי גבולות','תצלומי אוויר היסטוריים'] },
  vav: { letter: 'ו', title: 'פרטי בינוי', description: 'פרטים טכניים של מבני המתחם', fields: ['שיטות בינוי','יסודות','מערכות קירות','תקרות ורצפות','גגות','פרטים מיוחדים'] },
  zayin: { letter: 'ז', title: 'ממצאים ופגיעות', description: 'תיעוד נזקים ופגיעות בכל מבני המתחם', fields: ['ממצאי בליה','נזקי רטיבות','שינויים מאוחרים','פגיעות חריגות','רמת דחיפות'] },
  het: { letter: 'ח', title: 'הערכת ערכים', description: 'ניתוח ערכי השימור לכל מבן במתחם', fields: ['ערך היסטורי-תרבותי','ערך אדריכלי','ערך אורבני-סביבתי','ערך קהילתי-חברתי','המלצה לכל מבנה'] },
  tet: { letter: 'ט', title: 'מסקנות והמלצות', description: 'המלצות לשימור המתחם כמכלול', fields: ['מסקנות כלליות','המלצות שימור','תנאים לאישור','עדיפויות'] },
  yod: { letter: 'י', title: 'הצהרת מתעד', description: 'הצהרה חוקית חתומה של האדריכל המתעד', fields: ['שם מתעד','מספר ת.ז.','מספר רישיון','תאריך סיור','תאריך חתימה','חתימה'] },
};

interface Props {
  params: Promise<{ id: string; chapter: string }>;
}

export default async function ChapterPage({ params }: Props) {
  const { id, chapter } = await params;
  const building = DEMO_BUILDINGS.find(b => b.id === id);

  if (!building) notFound();

  const allChapters = building.is_complex ? CHAPTERS_COMPLEX : CHAPTERS_SINGLE;
  const ch = allChapters[chapter];

  if (!ch) notFound();

  const chapterKeys = Object.keys(allChapters);
  const currentIndex = chapterKeys.indexOf(chapter);
  const prevChapter = currentIndex > 0 ? chapterKeys[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapterKeys.length - 1 ? chapterKeys[currentIndex + 1] : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm" style={{ color: '#8B7355' }}>
        <Link href="/buildings">מבנים</Link>
        <span>/</span>
        <Link href={`/buildings/${id}`}>{building.name}</Link>
        <span>/</span>
        <Link href={`/buildings/${id}/file`}>תיק תיעוד</Link>
        <span>/</span>
        <span style={{ color: '#1A1410' }}>פרק {ch.letter}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl font-serif font-bold" style={{ color: '#C8B89A' }}>{ch.letter}</span>
          <h1 className="text-3xl font-serif font-bold text-ink">{ch.title}</h1>
        </div>
        <p className="text-ink-soft">{ch.description}</p>
      </div>

      {/* Status notice */}
      <div className="p-4 rounded-lg border" style={{ backgroundColor: '#EDE3D0', borderColor: '#C8B89A' }}>
        <p className="text-sm font-medium text-ink mb-1">פרק זה בשלב פיתוח</p>
        <p className="text-sm text-ink-soft">
          עורך הפרק המלא יהיה זמין בקרוב. להלן השדות שיש למלא בפרק זה:
        </p>
      </div>

      {/* Fields list */}
      <div className="bg-white rounded-lg border border-stone-light p-6">
        <h2 className="text-sm font-semibold text-ink-soft uppercase mb-4">שדות הפרק</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ch.fields.map((field) => (
            <div key={field} className="flex items-center gap-3 p-3 rounded-md" style={{ backgroundColor: '#F7F0E3' }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#C8B89A' }} />
              <span className="text-sm text-ink">{field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation between chapters */}
      <div className="flex justify-between items-center pt-4 border-t border-stone-light">
        {prevChapter ? (
          <Link
            href={`/buildings/${id}/file/${prevChapter}`}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border"
            style={{ borderColor: '#C8B89A', color: '#8B7355' }}
          >
            → פרק {allChapters[prevChapter].letter}: {allChapters[prevChapter].title}
          </Link>
        ) : <div />}

        {nextChapter ? (
          <Link
            href={`/buildings/${id}/file/${nextChapter}`}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border"
            style={{ borderColor: '#C8B89A', color: '#8B7355' }}
          >
            פרק {allChapters[nextChapter].letter}: {allChapters[nextChapter].title} ←
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}

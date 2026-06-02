import Link from 'next/link';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';

const PERIODS = [
  {
    id: 'ancient',
    label: 'תקופה קדומה',
    years: 'לפנה"ס 3000–1200',
    color: '#6B4226',
    desc: 'ישובים כנעניים וחופיים קדומים. מסחר ימי עם מצרים ואוגריט. תל מור כנקודת שליטה על פי הנחל.',
    keywords: ['תקופות קדומות', 'תקופת הברונזה'],
    backgroundImage: '/timeline/ancient.jpg',
  },
  {
    id: 'iron',
    label: 'תקופת הברזל',
    years: 'לפנה"ס 1200–586',
    color: '#8B5E3C',
    desc: 'אשדוד — אחת מחמש ערי הפלשתים הגדולות. מרכז כלכלי ותרבותי מרכזי. שרידי יישוב בתל מור.',
    keywords: ['תקופת הברזל'],
    backgroundImage: '/timeline/iron.jpg',
  },
  {
    id: 'persian',
    label: 'תקופה פרסית-הלניסטית',
    years: 'לפנה"ס 586–63',
    color: '#7A5C8A',
    desc: 'אשדוד — נמל מסחרי תוסס. שרידים מהתקופה בתל מור ובמצודת אשדוד-ים.',
    keywords: ['תקופות קדומות', 'תקופה פרסית-הלניסטית'],
    backgroundImage: '/timeline/persian.jpg',
  },
  {
    id: 'roman',
    label: 'תקופה רומית-ביזנטית',
    years: 'לפנה"ס 63 — 636 לסה"נ',
    color: '#5C5C8A',
    desc: 'אזוטוס — עיר נמל רומית. כנסיה ביזנטית במצודת אשדוד-ים. מתחם פולחן חשוב.',
    keywords: ['תקופה ביזנטית'],
    backgroundImage: '/timeline/roman.jpg',
  },
  {
    id: 'islamic',
    label: 'תקופה אסלאמית',
    years: '636–1260 לסה"נ',
    color: '#4A7A5C',
    desc: 'מצודת אשדוד-ים כריבאט — ביצור דתי-צבאי. אל-מוקדסי (מאה ה-10) מזכיר את האתר.',
    keywords: ['תקופה אסלאמית קדומה'],
    backgroundImage: '/timeline/islamic.jpg',
  },
  {
    id: 'mamluk',
    label: 'תקופה ממלוכית-עות׳מאנית',
    years: '1260–1917',
    color: '#7A6A4A',
    desc: 'גשר עד הלום נבנה על יסודות רומיים. האזור שומם יחסית. שרידי ישובי דייגים.',
    keywords: ['תקופה מנדטורית'],
    backgroundImage: '/timeline/mamluk.jpg',
  },
  {
    id: 'mandate',
    label: 'תקופה מנדטורית',
    years: '1917–1948',
    color: '#6A7A4A',
    desc: 'פארק עד הלום — מצדית בטון בריטית (1936). 15.5.1948: גשר עד הלום מפוצץ לעצור צבא מצרים.',
    keywords: ['תקופה מנדטורית'],
    backgroundImage: '/timeline/mandate.jpg',
  },
  {
    id: 'israeli',
    label: 'תקופה ישראלית',
    years: '1948–היום',
    color: '#4A7A72',
    desc: 'הקמת עיר אשדוד מ-1956. רובע א׳ ראשון. נמל (1965). המגדלור, בנקים, בית קנדה, הגן האדום ועוד.',
    keywords: ['תקופה ישראלית'],
    backgroundImage: '/timeline/israeli.jpg',
  },
];

export default function TimelinePage() {
  const buildings = DEMO_BUILDINGS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-1">ציר זמן — אתרי שימור אשדוד</h1>
        <p className="text-ink-soft">מהתקופה הקדומה עד ימינו</p>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {PERIODS.map((period, idx) => {
          const periodBuildings = buildings.filter(b =>
            (b.historical_periods ?? []).some(hp =>
              period.keywords.some(k => hp.includes(k) || k.includes(hp))
            )
          );
          const isLast = idx === PERIODS.length - 1;

          return (
            <div key={period.id} className="flex gap-0">
              {/* Timeline spine */}
              <div className="flex flex-col items-center" style={{ width: 48, flexShrink: 0 }}>
                <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm mt-6" style={{ backgroundColor: period.color }} />
                {!isLast && <div className="flex-1 w-0.5 my-1" style={{ backgroundColor: '#EDE0CC', minHeight: 40 }} />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6 pr-2">
                <div className="bg-white rounded-xl border border-stone-light p-5 relative overflow-hidden">
                  {/* Background image with 50% opacity */}
                  {period.backgroundImage && (
                    <div className="absolute inset-0 opacity-50 -z-10"
                      style={{ backgroundImage: `url('${period.backgroundImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  )}
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-ink">{period.label}</h3>
                      <p className="text-2xl font-bold font-serif" style={{ color: period.color }}>{period.years}</p>
                    </div>
                    {periodBuildings.length > 0 && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ backgroundColor: `${period.color}15`, color: period.color }}>
                        {periodBuildings.length} אתרים
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft leading-relaxed mb-3">{period.desc}</p>

                  {periodBuildings.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {periodBuildings.map(b => (
                        <Link key={b.id} href={`/buildings/${b.id}`}
                          className="text-xs px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
                          style={{ borderColor: period.color, color: period.color, backgroundColor: `${period.color}10` }}>
                          {b.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {periodBuildings.length === 0 && (
                    <p className="text-xs text-ink-soft italic">אין אתרים ברשימה מתקופה זו</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="flex gap-3 justify-center pt-4">
        <Link href="/map" className="px-6 py-2 text-white rounded-lg text-sm" style={{ backgroundColor: '#8B7355' }}>
          צפה במפה
        </Link>
        <Link href="/overview" className="px-6 py-2 rounded-lg text-sm border" style={{ borderColor: '#C8B89A', color: '#8B7355' }}>
          סקירה כללית
        </Link>
      </div>
    </div>
  );
}

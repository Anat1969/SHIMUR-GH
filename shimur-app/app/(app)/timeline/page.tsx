'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSites } from '@/components/providers/SiteData';
import { SiteImage } from '@/components/sites/SiteImage';
import type { Building } from '@/lib/types';

const TIMELINE_START = -3000;
const TIMELINE_END = 2030;

interface Period {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  color: string;
  desc: string;
  preservationNote: string;
  keywords: string[];
}

const PERIODS: Period[] = [
  {
    id: 'bronze', label: 'ברונזה', startYear: -3000, endYear: -1200, color: '#6B4226',
    desc: 'יישובים כנעניים על החוף ובפי הנחל. בברונזה המאוחרת — מבנים מבוצרים בתל מור, ככל הנראה חיל מצב מצרי.',
    preservationNote: 'שימור ארכאולוגי — חפירות מתועדות, שימור במקום, כיסוי מגן.',
    keywords: ['תקופת הברונזה'],
  },
  {
    id: 'iron', label: 'ברזל', startYear: -1200, endYear: -586, color: '#8B5E3C',
    desc: 'אשדוד — אחת מחמש ערי הפלשתים. ביצורי אשדוד-ים מהמאה ה-8 לפנה"ס.',
    preservationNote: 'שימור שכבות — תיעוד סטרטיגרפי ושמירת ממצאים בשלמותם.',
    keywords: ['תקופת הברזל'],
  },
  {
    id: 'persian', label: 'פרסית-הלניסטית', startYear: -586, endYear: -63, color: '#7A5C8A',
    desc: 'נמל מסחרי פעיל. שרידים הלניסטיים בתל מור ובאשדוד-ים.',
    preservationNote: 'אנסטילוזה — החזרת רכיבים מקוריים למקומם.',
    keywords: ['תקופה פרסית-הלניסטית'],
  },
  {
    id: 'roman', label: 'רומית-ביזנטית', startYear: -63, endYear: 636, color: '#5C5C8A',
    desc: 'אזוטוס פרליוס — עיר הנמל של אשדוד.',
    preservationNote: 'שימור פסיפסים ומבני דת — ניקוי, ייצוב והגנה סביבתית.',
    keywords: ['תקופה ביזנטית'],
  },
  {
    id: 'islamic', label: 'אסלאמית קדומה', startYear: 636, endYear: 1099, color: '#4A7A5C',
    desc: 'מבצר אומיי על החוף באשדוד-ים, חלק משרשרת מבצרי חוף (רבאטאת).',
    preservationNote: 'שימור ביצורים — ייצוב קירות, ניקוז והגנה מקורוזיה.',
    keywords: ['תקופה אסלאמית קדומה'],
  },
  {
    id: 'mamluk', label: 'ממלוכית-עות׳מנית', startYear: 1099, endYear: 1917, color: '#7A6A4A',
    desc: 'גשר אבן ממלוכי מהמאה ה-13 נבנה על דרך הים, מעל נחל לכיש.',
    preservationNote: 'שימור גשרים — חיזוק מבני, עמידות למים ושמירת חומרים מקוריים.',
    keywords: ['תקופה ממלוכית', 'תקופה עות׳מנית'],
  },
  {
    id: 'mandate', label: 'מנדטורית', startYear: 1917, endYear: 1948, color: '#6A7A4A',
    desc: 'ביצורי בטון מתקופת המנדט ומלחמת העצמאות. 1948: גשר עד הלום מפוצץ.',
    preservationNote: 'שימור בטון היסטורי — טיפול בקורוזיה ושמירת אותנטיות החומר.',
    keywords: ['תקופה מנדטורית'],
  },
  {
    id: 'israeli', label: 'ישראלית', startYear: 1948, endYear: 2030, color: '#1B6B7D',
    desc: 'הקמת אשדוד מ-1956, רובע א׳ ונמל אשדוד. מודרניזם וברוטליזם של עיר צעירה.',
    preservationNote: 'שימור מודרניזם — תיעוד, שיקום חזיתות, חומרים מקוריים ושימוש מחודש.',
    keywords: ['תקופה ישראלית'],
  },
];

const fmtYear = (y: number) => (y < 0 ? `${Math.abs(y)} לפנה"ס` : String(y));

function siteYear(b: Building): number | null {
  if (b.year_built) return b.year_built;
  const p = b.historical_periods ?? [];
  if (p.includes('תקופת הברונזה')) return -1400;
  if (p.includes('תקופת הברזל')) return -800;
  if (p.includes('תקופה פרסית-הלניסטית')) return -300;
  if (p.includes('תקופה ביזנטית')) return 400;
  if (p.includes('תקופה אסלאמית קדומה')) return 750;
  if (p.includes('תקופה ממלוכית')) return 1270;
  if (p.includes('תקופה מנדטורית')) return 1936;
  if (p.includes('תקופה ישראלית')) return 1962;
  return null;
}

const inPeriod = (b: Building, p: Period) => (b.historical_periods ?? []).some(hp => p.keywords.includes(hp));

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="h-96 glass-card animate-pulse" />}>
      <Timeline />
    </Suspense>
  );
}

function Timeline() {
  const sites = useSites();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const period = PERIODS.find(p => p.id === params.get('period')) ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState<'periods' | 'years'>('periods');
  const [zoom, setZoom] = useState(1);

  const go = useCallback((id: string | null) => {
    setSelectedId(null);
    router.replace(id ? `${pathname}?period=${id}` : pathname, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router, pathname]);

  const bySite = useMemo(() => PERIODS.map(p => ({ p, list: sites.filter(b => inPeriod(b, p)) })), [sites]);
  const visible = period ? bySite.find(x => x.p.id === period.id)!.list : sites;
  const selected = visible.find(s => s.id === selectedId) ?? null;
  const idx = period ? PERIODS.indexOf(period) : -1;

  // סרגל: בתצוגה הראשית — "לפי תקופות" (רוחב שווה לכל תקופה, ללא צפיפות) או "לפי שנים" (קנה מידה אמיתי)
  const range = period
    ? (() => { const pad = (period.endYear - period.startYear) * 0.08; return [period.startYear - pad, period.endYear + pad]; })()
    : [TIMELINE_START, TIMELINE_END];
  const linear = (y: number) => ((Math.min(Math.max(y, range[0]), range[1]) - range[0]) / (range[1] - range[0])) * 100;
  const byPeriods = !period && scale === 'periods';
  // רוחב כל תקופה לפי מספר האתרים בה — תקופה צפופה מקבלת יותר מקום
  const weights = PERIODS.map(p => 1 + sites.filter(b => { const y = siteYear(b); return y !== null && y >= p.startYear && y < p.endYear; }).length);
  const totalW = weights.reduce((a, w) => a + w, 0);
  const startW = weights.map((_, k) => weights.slice(0, k).reduce((a, w) => a + w, 0));
  const slot = (k: number, f: number) => ((startW[k] + weights[k] * f) / totalW) * 100;
  const periodIndex = (y: number) => {
    if (y >= PERIODS[PERIODS.length - 1].endYear) return PERIODS.length - 1;
    return Math.max(0, PERIODS.findIndex(p => y >= p.startYear && y < p.endYear));
  };
  const pos = (y: number) => {
    if (!byPeriods) return linear(y);
    if (y >= PERIODS[PERIODS.length - 1].endYear) return 100;
    const k = periodIndex(y);
    const p = PERIODS[k];
    return slot(k, (y - p.startYear) / (p.endYear - p.startYear));
  };

  const sortedMarkers = visible
    .map(b => ({ b, y: siteYear(b) }))
    .filter((x): x is { b: Building; y: number } => x.y !== null)
    .sort((a, b) => a.y - b.y);

  // מיקום כל אתר באחוזים. בכל מקטע (תקופה) האתרים נפרסים בשווה לפי סדרם — כך אין אתרים זה על זה
  const markers: { b: Building; x: number }[] = (() => {
    if (period) {
      const n = sortedMarkers.length;
      return sortedMarkers.map((m, i) => ({ b: m.b, x: linear(period.startYear + ((period.endYear - period.startYear) * (i + 0.5)) / Math.max(n, 1)) }));
    }
    if (byPeriods) {
      const slots: Record<number, { b: Building; y: number }[]> = {};
      sortedMarkers.forEach(m => {
        (slots[periodIndex(m.y)] ??= []).push(m);
      });
      return Object.entries(slots).flatMap(([k, list]) =>
        list.map((m, i) => ({ b: m.b, x: slot(Number(k), (i + 0.5) / list.length) })));
    }
    return sortedMarkers.map(m => ({ b: m.b, x: linear(m.y) }));
  })();

  // תוויות שנים — רק כשיש מקום, כדי שלא יעלו זו על זו
  const ticks: number[] = (byPeriods
    ? PERIODS.map(p => p.startYear)
    : Array.from({ length: 6 }, (_, i) => range[0] + ((range[1] - range[0]) * i) / 5)
  ).filter((y, i, all) => i === 0 || pos(y) - pos(all[i - 1]) > 7 / zoom);

  return (
    <div className="space-y-6">
      {/* ניווט תקופות — תמיד גלוי */}
      <nav aria-label="תקופות" className="sticky top-16 z-30 -mx-4 px-4 py-3 sm:mx-0 sm:px-0" style={{ backgroundColor: 'rgba(247,240,227,0.92)', backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => go(null)}
            aria-pressed={!period}
            className="shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
            style={{ backgroundColor: !period ? 'var(--navy)' : 'white', color: !period ? 'white' : 'var(--navy)', border: '1px solid var(--navy)' }}
          >
            כל התקופות
          </button>
          {bySite.map(({ p, list }) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              aria-pressed={period?.id === p.id}
              className="shrink-0 px-4 py-2.5 rounded-full text-sm transition-colors"
              style={{
                backgroundColor: period?.id === p.id ? p.color : 'white',
                color: period?.id === p.id ? 'white' : p.color,
                border: `1px solid ${p.color}`,
                opacity: list.length ? 1 : 0.55,
              }}
            >
              {p.label}{list.length ? ` · ${list.length}` : ''}
            </button>
          ))}
        </div>
      </nav>

      {/* כותרת */}
      {period ? (
        <header className="rounded-2xl p-6 sm:p-8 text-white shadow-lg" style={{ background: `linear-gradient(120deg, ${period.color} 0%, var(--navy) 130%)` }}>
          <p className="text-sm opacity-85">{fmtYear(period.startYear)} — {fmtYear(period.endYear)}</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mt-1">התקופה ה{period.label}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed opacity-95">{period.desc}</p>
          <p className="mt-3 text-sm max-w-2xl opacity-85">שיטת שימור מומלצת: {period.preservationNote}</p>
        </header>
      ) : (
        <header className="page-intro">
          <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--navy)' }}>ציר זמן — מורשת אשדוד</h1>
          <p style={{ color: 'var(--navy-soft)' }}>
            <span className="highlight-text">5,000 שנות היסטוריה</span> על קו חוף אחד.
            לחיצה על תקופה מציגה אותה ואת האתרים שלה. הכפתור &quot;כל התקופות&quot; מחזיר לתמונה המלאה.
          </p>
        </header>
      )}

      {/* סרגל */}
      <section className="glass-card p-4 sm:p-6" aria-label="סרגל זמן">
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          {!period && (
            <>
              <span style={{ color: 'var(--navy-soft)' }}>קנה מידה:</span>
              {([['periods', 'לפי תקופות'], ['years', 'לפי שנים']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setScale(k)} aria-pressed={scale === k}
                  className="px-3 py-1.5 rounded-full"
                  style={{ border: `1px solid ${scale === k ? 'var(--ocean)' : 'var(--stone-light)'}`, backgroundColor: scale === k ? 'var(--ocean)' : 'white', color: scale === k ? 'white' : 'var(--navy)' }}>
                  {l}
                </button>
              ))}
              <span className="mx-1 w-px h-5" style={{ backgroundColor: 'var(--stone)' }} />
            </>
          )}
          <span style={{ color: 'var(--navy-soft)' }}>מרווח:</span>
          <button onClick={() => setZoom(z => Math.max(1, z - 1))} disabled={zoom === 1} className="px-3 py-1.5 rounded-full disabled:opacity-40" style={{ border: '1px solid var(--stone-light)', backgroundColor: 'white', color: 'var(--navy)' }}>צמצום</button>
          <button onClick={() => setZoom(z => Math.min(4, z + 1))} disabled={zoom === 4} className="px-3 py-1.5 rounded-full disabled:opacity-40" style={{ border: '1px solid var(--stone-light)', backgroundColor: 'white', color: 'var(--navy)' }}>ריווח</button>
          {zoom > 1 && <span style={{ color: 'var(--navy-soft)' }}>גללי הצידה לצפייה בכל הציר</span>}
        </div>
        <div className="overflow-x-auto pb-2">
        <div className="relative" style={{ minWidth: 720 * zoom }}>
          <div className="relative h-12 rounded-lg overflow-hidden">
            {(period ? [period] : PERIODS).map(p => {
              const right = pos(p.startYear);
              const width = pos(p.endYear) - right;
              return (
                <button
                  key={p.id}
                  onClick={() => go(period ? null : p.id)}
                  title={period ? 'חזרה לכל התקופות' : `הצגת התקופה ה${p.label}`}
                  className="absolute top-0 h-full flex items-center justify-center text-white text-xs font-bold transition-opacity hover:opacity-100"
                  style={{ right: `${right}%`, width: `${width}%`, backgroundColor: p.color, opacity: 0.85, borderInlineStart: '1px solid rgba(255,255,255,0.35)' }}
                >
                  {width > 5 && <span className="truncate px-1">{p.label}</span>}
                </button>
              );
            })}
          </div>
          <div className="relative h-6 mt-1 text-[11px]" style={{ color: 'var(--navy-soft)' }}>
            {ticks.map(y => (
              <span key={y} className="absolute -translate-x-1/2" style={{ right: `${pos(y)}%`, transform: 'translateX(50%)' }}>{fmtYear(Math.round(y))}</span>
            ))}
          </div>
          <div className="relative h-36 mt-2">
            {markers.map(({ b, x }, i) => {
              const sel = b.id === selectedId;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(sel ? null : b.id)}
                  className="absolute group"
                  style={{ right: `${x}%`, top: (i % 3) * 44, transform: 'translateX(50%)', zIndex: sel ? 20 : 10 }}
                  aria-label={b.name}
                >
                  <SiteImage site={b} size="thumb" className={`!w-10 !h-10 ring-2 transition-transform group-hover:scale-125 ${sel ? 'ring-[var(--amber)] scale-125' : 'ring-white'} shadow-md`} />
                  <span className="pointer-events-none absolute top-full mt-1 right-1/2 translate-x-1/2 whitespace-nowrap rounded px-2 py-0.5 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--navy)', color: 'white' }}>
                    {b.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        </div>
      </section>

      {/* אתר נבחר */}
      {selected && (
        <article className="glass-card overflow-hidden grid sm:grid-cols-[280px_1fr]" style={{ borderInlineStart: '3px solid var(--amber)' }}>
          <SiteImage site={selected} size="card" className="!h-48 sm:!h-full !rounded-none" />
          <div className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif font-bold text-xl" style={{ color: 'var(--navy)' }}>{selected.name}</h2>
              <button onClick={() => setSelectedId(null)} className="text-sm px-3 py-1 rounded" style={{ color: 'var(--navy-soft)', border: '1px solid var(--stone-light)' }}>סגירה</button>
            </div>
            <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>{selected.address}</p>
            {selected.full_description && <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{selected.full_description}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/buildings/${selected.id}`} className="px-5 py-2.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: 'var(--ocean)' }}>לדף האתר</Link>
              <Link href={`/tour?site=${selected.id}`} className="px-5 py-2.5 rounded-lg text-sm font-medium" style={{ border: '1px solid var(--ocean)', color: 'var(--ocean)' }}>במצגת</Link>
            </div>
          </div>
        </article>
      )}

      {period ? (
        /* תצוגת תקופה: האתרים שלה */
        <section className="space-y-4">
          <h2 className="font-serif font-bold text-xl" style={{ color: 'var(--navy)' }}>
            {visible.length > 1 ? `${visible.length} אתרים מהתקופה` : visible.length === 1 ? 'אתר אחד מהתקופה' : 'אין עדיין אתרים ברשימה מהתקופה הזו'}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(b => (
              <button key={b.id} onClick={() => setSelectedId(b.id)} className="text-right glass-card overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg">
                <SiteImage site={b} size="card" />
                <div className="p-4">
                  <p className="font-serif font-bold" style={{ color: 'var(--navy)' }}>{b.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--navy-soft)' }}>{b.address}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-3 pt-2">
            {idx > 0 ? <button onClick={() => go(PERIODS[idx - 1].id)} className="px-5 py-3 rounded-lg text-sm" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>התקופה הקודמת: {PERIODS[idx - 1].label}</button> : <span />}
            <button onClick={() => go(null)} className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>חזרה לכל התקופות</button>
            {idx < PERIODS.length - 1 ? <button onClick={() => go(PERIODS[idx + 1].id)} className="px-5 py-3 rounded-lg text-sm" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>התקופה הבאה: {PERIODS[idx + 1].label}</button> : <span />}
          </div>
        </section>
      ) : (
        /* תצוגה ראשית: כרטיס לכל תקופה */
        <section className="grid sm:grid-cols-2 gap-4">
          {bySite.map(({ p, list }) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              className="text-right glass-card p-5 transition-transform hover:-translate-y-1 hover:shadow-lg"
              style={{ borderInlineStart: `4px solid ${p.color}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>{p.label}</h3>
                  <p className="text-xs" style={{ color: p.color }}>{fmtYear(p.startYear)} — {fmtYear(p.endYear)}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full text-white shrink-0" style={{ backgroundColor: p.color }}>{list.length === 1 ? 'אתר אחד' : `${list.length} אתרים`}</span>
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--navy-soft)' }}>{p.desc}</p>
              {list.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  {list.slice(0, 5).map(b => <SiteImage key={b.id} site={b} size="thumb" className="ring-2 ring-white shadow" />)}
                  {list.length > 5 && <span className="text-xs ms-1" style={{ color: 'var(--navy-soft)' }}>ועוד {list.length - 5}</span>}
                </div>
              )}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

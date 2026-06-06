'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { SITE_IMAGES } from '@/lib/demo/site-images';
import { Building } from '@/lib/types';

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
    id: 'ancient', label: 'ברונזה', startYear: -3000, endYear: -1200,
    color: '#6B4226',
    desc: 'ישובים כנעניים וחופיים קדומים. מסחר ימי עם מצרים ואוגריט.',
    preservationNote: 'שימור ארכאולוגי — חפירות מתועדות, שימור in-situ, כיסוי מגן.',
    keywords: ['תקופות קדומות', 'תקופת הברונזה'],
  },
  {
    id: 'iron', label: 'ברזל', startYear: -1200, endYear: -586,
    color: '#8B5E3C',
    desc: 'אשדוד — אחת מחמש ערי הפלשתים. מרכז כלכלי ותרבותי.',
    preservationNote: 'שימור שכבות — תיעוד סטרטיגרפי, שמירת ממצאים בשלמותם.',
    keywords: ['תקופת הברזל'],
  },
  {
    id: 'persian', label: 'פרסית-הלניסטית', startYear: -586, endYear: -63,
    color: '#7A5C8A',
    desc: 'נמל מסחרי תוסס. שרידים בתל מור ובמצודת אשדוד-ים.',
    preservationNote: 'שימור אנסטילוזה — שחזור מרכיבים מקוריים במקומם.',
    keywords: ['תקופות קדומות', 'תקופה פרסית-הלניסטית'],
  },
  {
    id: 'roman', label: 'רומית-ביזנטית', startYear: -63, endYear: 636,
    color: '#5C5C8A',
    desc: 'אזוטוס — עיר נמל רומית. כנסיה ביזנטית במצודת אשדוד-ים.',
    preservationNote: 'שימור פסיפסים ומבנים דתיים — ניקוי, קונסולידציה, הגנה סביבתית.',
    keywords: ['תקופה ביזנטית'],
  },
  {
    id: 'islamic', label: 'אסלאמית קדומה', startYear: 636, endYear: 1260,
    color: '#4A7A5C',
    desc: 'ריבאט — ביצור דתי-צבאי. אל-מוקדסי מזכיר את האתר.',
    preservationNote: 'שימור ביצורים — ייצוב קירות, ניקוז, הגנה מקורוזיה.',
    keywords: ['תקופה אסלאמית קדומה'],
  },
  {
    id: 'mamluk', label: 'ממלוכית-עות׳מנית', startYear: 1260, endYear: 1917,
    color: '#7A6A4A',
    desc: 'גשר עד הלום על יסודות רומיים. האזור שומם יחסית.',
    preservationNote: 'שימור גשרים — חיזוק מבני, עמידות למים, שמירת חומרים מקוריים.',
    keywords: ['תקופה מנדטורית'],
  },
  {
    id: 'mandate', label: 'מנדטורית', startYear: 1917, endYear: 1948,
    color: '#6A7A4A',
    desc: 'מצדית בריטית (1936). 1948: גשר עד הלום מפוצץ.',
    preservationNote: 'שימור בטון מתקופה — טיפול בקורוזיה, שימור אותנטיות חומר.',
    keywords: ['תקופה מנדטורית'],
  },
  {
    id: 'israeli', label: 'ישראלית', startYear: 1948, endYear: 2030,
    color: '#1B6B7D',
    desc: 'הקמת אשדוד מ-1956. רובע א׳. נמל (1965). ברוטליזם ומודרניזם.',
    preservationNote: 'שימור מודרניזם — תיעוד, שיקום חזיתות, שימור חומרים מקוריים, adaptive reuse.',
    keywords: ['תקופה ישראלית'],
  },
];

const TOTAL_WIDTH = 1200;

function yearToPixel(year: number): number {
  if (year < -586) {
    return ((year - TIMELINE_START) / 2414) * 300;
  } else if (year < 636) {
    return 300 + ((year - (-586)) / 1222) * 250;
  } else if (year < 1917) {
    return 550 + ((year - 636) / 1281) * 200;
  } else {
    return 750 + ((year - 1917) / 113) * 450;
  }
}

function getTickYears(): { year: number; major: boolean }[] {
  const ticks: { year: number; major: boolean }[] = [];
  for (let y = -3000; y <= -586; y += 500) {
    ticks.push({ year: y, major: y % 1000 === 0 });
  }
  for (let y = -500; y <= 636; y += 200) {
    if (y >= -586) ticks.push({ year: y, major: Math.abs(y) % 500 === 0 || y === 0 });
  }
  for (let y = 700; y <= 1917; y += 200) {
    ticks.push({ year: y, major: y % 500 === 0 });
  }
  for (let y = 1920; y <= 2030; y += 10) {
    ticks.push({ year: y, major: y % 50 === 0 });
  }
  return ticks;
}

function getBuildingYear(b: Building): number | null {
  if (b.year_built) return b.year_built;
  const periods = b.historical_periods ?? [];
  if (periods.includes('תקופת הברונזה')) return -2000;
  if (periods.includes('תקופת הברזל')) return -900;
  if (periods.includes('תקופה פרסית-הלניסטית')) return -300;
  if (periods.includes('תקופה ביזנטית')) return 400;
  if (periods.includes('תקופה אסלאמית קדומה')) return 900;
  if (periods.includes('תקופה מנדטורית')) return 1935;
  if (periods.includes('תקופה ישראלית')) return 1960;
  return null;
}

export default function TimelinePage() {
  const buildings = DEMO_BUILDINGS;
  const [selected, setSelected] = useState<Building | null>(null);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const buildingsWithYears = buildings.map(b => ({ building: b, year: getBuildingYear(b) })).filter(x => x.year !== null) as { building: Building; year: number }[];
  const ticks = getTickYears();

  useEffect(() => {
    if (scrollRef.current) {
      const modernStart = yearToPixel(1900);
      scrollRef.current.scrollLeft = modernStart - 100;
    }
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-intro">
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--navy)' }}>
          ציר זמן — מורשת אשדוד
        </h1>
        <p style={{ color: 'var(--navy-soft)' }}>
          <span className="highlight-text">5,000 שנות היסטוריה</span> על קו חוף אחד.
          הסרגל מציג את <span className="highlight-text">הרצף ההיסטורי המלא</span> — מהברונזה הקדומה ועד ימינו.
          גרור להחלקה, לחץ על אתר לפרטים ולהמלצת שיטת שימור.
        </p>
      </div>

      {/* Scrollable Timeline Ruler */}
      <div className="glass-card p-4">
        <p className="text-xs mb-2" style={{ color: 'var(--navy-soft)' }}>
          גרור ← → להחלקה | תקופות עתיקות דחוסות, תקופה מודרנית מורחבת
        </p>
        <div
          ref={scrollRef}
          className="overflow-x-auto select-none"
          style={{ cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div style={{ width: TOTAL_WIDTH, position: 'relative' }}>
            {/* Periods bar */}
            <div className="relative h-14 rounded-lg overflow-hidden mb-1">
              {PERIODS.map(period => {
                const left = yearToPixel(period.startYear);
                const right = yearToPixel(period.endYear);
                const width = right - left;
                const isHovered = hoveredPeriod === period.id;
                return (
                  <div
                    key={period.id}
                    className="absolute top-0 h-full flex items-center justify-center cursor-pointer transition-all"
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      backgroundColor: period.color,
                      opacity: hoveredPeriod && !isHovered ? 0.4 : 0.85,
                      borderLeft: '1px solid rgba(255,255,255,0.3)',
                    }}
                    onMouseEnter={() => setHoveredPeriod(period.id)}
                    onMouseLeave={() => setHoveredPeriod(null)}
                  >
                    {width > 40 && (
                      <span className="text-white text-xs font-bold truncate px-1">{period.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tick marks */}
            <div className="relative h-8">
              {ticks.map(({ year, major }) => {
                const pos = yearToPixel(year);
                return (
                  <div
                    key={year}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pos}px`, transform: 'translateX(-50%)' }}
                  >
                    <div
                      style={{
                        width: major ? 2 : 1,
                        height: major ? 16 : 8,
                        backgroundColor: major ? 'var(--navy)' : 'var(--stone)',
                        opacity: major ? 0.6 : 0.3,
                      }}
                    />
                    {major && (
                      <span className="text-xs mt-0.5 whitespace-nowrap" style={{ color: 'var(--navy-soft)', fontSize: '0.6rem' }}>
                        {year < 0 ? `${Math.abs(year)} לפנה"ס` : year}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Building markers */}
            <div className="relative h-24 mt-1">
              {buildingsWithYears.map(({ building, year }, idx) => {
                const pos = yearToPixel(year);
                const isSelected = selected?.id === building.id;
                const offset = (idx % 3) * 24;
                const imgSrc = SITE_IMAGES[building.id];
                return (
                  <button
                    key={building.id}
                    className="absolute transition-all"
                    style={{
                      left: `${pos}px`,
                      top: offset,
                      transform: 'translateX(-50%)',
                      zIndex: isSelected ? 20 : 10,
                    }}
                    onClick={() => setSelected(isSelected ? null : building)}
                  >
                    {imgSrc ? (
                      <div
                        className="rounded-full border-2 overflow-hidden transition-all"
                        style={{
                          width: isSelected ? 28 : 20,
                          height: isSelected ? 28 : 20,
                          borderColor: isSelected ? 'var(--amber)' : 'white',
                          boxShadow: isSelected ? '0 0 8px rgba(212, 146, 42, 0.5)' : '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      >
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="rounded-full border-2 transition-all"
                        style={{
                          width: isSelected ? 18 : 12,
                          height: isSelected ? 18 : 12,
                          backgroundColor: isSelected ? 'var(--amber)' : 'var(--ocean)',
                          borderColor: 'white',
                          boxShadow: isSelected ? '0 0 8px rgba(212, 146, 42, 0.5)' : '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    )}
                    <div
                      className="absolute top-full mt-1 text-center whitespace-nowrap"
                      style={{
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.55rem',
                        color: isSelected ? 'var(--amber-dark)' : 'var(--navy-soft)',
                        fontWeight: isSelected ? 700 : 400,
                        maxWidth: 80,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {building.name.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected building detail */}
      {selected && (() => {
        const imgSrc = SITE_IMAGES[selected.id];
        return (
          <div className="glass-card p-6 relative overflow-hidden" style={{ borderRight: '3px solid var(--amber)' }}>
            {imgSrc && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                <img src={imgSrc} alt="" className="w-full h-full object-cover" style={{ opacity: 0.06, filter: 'grayscale(60%)' }} />
              </div>
            )}
            <div className="flex items-start justify-between gap-4 relative" style={{ zIndex: 1 }}>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-xl mb-1" style={{ color: 'var(--navy)' }}>
                  {selected.name}
                </h3>
                <p className="text-sm mb-2" style={{ color: 'var(--navy-soft)' }}>{selected.address}</p>
                {selected.year_built && (
                  <span className="highlight-text text-sm">נבנה: {selected.year_built}</span>
                )}
                {selected.full_description && (
                  <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--navy-soft)' }}>
                    {selected.full_description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-lg px-3 py-1 rounded"
                style={{ color: 'var(--navy-soft)' }}
              >
                ×
              </button>
            </div>

            {(() => {
              const period = PERIODS.find(p =>
                (selected.historical_periods ?? []).some(hp =>
                  p.keywords.some(k => hp.includes(k) || k.includes(hp))
                )
              );
              return period ? (
                <div className="mt-4 p-4 rounded-lg relative" style={{ backgroundColor: 'rgba(27, 107, 125, 0.06)', zIndex: 1 }}>
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--ocean)' }}>
                    המלצת שימור — {period.label}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--navy)' }}>{period.preservationNote}</p>
                </div>
              ) : null;
            })()}

            <div className="flex gap-3 mt-4 relative" style={{ zIndex: 1 }}>
              <Link
                href={`/buildings/${selected.id}`}
                className="px-5 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--ocean)' }}
              >
                פרטי אתר
              </Link>
              <Link
                href={`/buildings/${selected.id}/file`}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--amber-pale)', color: 'var(--amber-dark)' }}
              >
                תיק תיעוד
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Period cards */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>תקופות היסטוריות</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERIODS.map(period => {
            const periodBuildings = buildings.filter(b =>
              (b.historical_periods ?? []).some(hp =>
                period.keywords.some(k => hp.includes(k) || k.includes(hp))
              )
            );
            return (
              <div
                key={period.id}
                className="glass-card p-5"
                style={{ borderRight: `3px solid ${period.color}` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-serif font-bold" style={{ color: 'var(--navy)' }}>{period.label}</h3>
                    <p className="text-sm font-mono" style={{ color: period.color }}>
                      {period.startYear < 0 ? `${Math.abs(period.startYear)} לפנה"ס` : period.startYear} — {period.endYear < 0 ? `${Math.abs(period.endYear)} לפנה"ס` : period.endYear}
                    </p>
                  </div>
                  {periodBuildings.length > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: period.color }}>
                      {periodBuildings.length} אתרים
                    </span>
                  )}
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--navy-soft)' }}>{period.desc}</p>
                <p className="text-xs italic" style={{ color: 'var(--ocean)' }}>{period.preservationNote}</p>

                {periodBuildings.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {periodBuildings.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSelected(b)}
                        className="text-xs px-2.5 py-1 rounded-full transition-colors"
                        style={{
                          backgroundColor: selected?.id === b.id ? period.color : `${period.color}15`,
                          color: selected?.id === b.id ? 'white' : period.color,
                          border: `1px solid ${period.color}30`,
                        }}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 justify-center pt-4">
        <Link href="/map" className="px-6 py-2 text-white rounded-lg text-sm" style={{ backgroundColor: 'var(--ocean)' }}>
          צפה במפה
        </Link>
        <Link href="/overview" className="px-6 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--navy)', border: '1px solid var(--stone)' }}>
          סקירה כללית
        </Link>
      </div>
    </div>
  );
}

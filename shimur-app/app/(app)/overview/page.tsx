'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSites, useRoutes } from '@/components/providers/SiteData';
import { Building, LIST_STATUS_LABELS, LIST_STATUS_NOTES, ListStatus } from '@/lib/types';
import { CLUSTERS, SOURCE_CREDIT } from '@/lib/clusters';
import { LIST_STATUS_COLORS, LIST_STATUS_NOTES_SHORT, needsVerification } from '@/components/sites/ListInfo';
import { SiteImage } from '@/components/sites/SiteImage';

type Selection = { label: string; sites: Building[] } | null;

export default function OverviewPage() {
  const buildings = useSites();
  const routes = useRoutes();
  const [selected, setSelected] = useState<Selection>(null);

  const select = (label: string, sites: Building[]) => {
    setSelected(s => (s?.label === label ? null : { label, sites }));
  };

  const byPriority = {
    'גבוהה': buildings.filter(b => b.priority_level === 'גבוהה'),
    'בינונית': buildings.filter(b => b.priority_level === 'בינונית'),
    'נמוכה': buildings.filter(b => b.priority_level === 'נמוכה'),
  };
  const byProtection = {
    'א': buildings.filter(b => b.protection_level === 'א'),
    'ב': buildings.filter(b => b.protection_level === 'ב'),
    'ג': buildings.filter(b => b.protection_level === 'ג'),
  };
  const neighborhoods = [...new Set(buildings.map(b => b.neighborhood).filter(Boolean) as string[])];
  // מקבצים: הרשימה הקבועה מהוועדה, ואחריה כל אזור שקיים בנתונים ואינו ברשימה
  const clusters = [
    ...CLUSTERS,
    ...neighborhoods.filter(n => !CLUSTERS.some(c => c.name === n)).map(name => ({ name, description: '', textual: false })),
  ];
  const committeeCount = buildings.filter(b => b.committee_no).length;
  const byListStatus = (Object.keys(LIST_STATUS_LABELS) as ListStatus[]).map(s => ({ s, sites: buildings.filter(b => b.list_status === s) }));
  const toVerify = buildings.filter(needsVerification);
  const typeGroups: Record<string, Building[]> = {};
  buildings.forEach(b => {
    const t = b.building_type ?? b.style ?? 'אחר';
    typeGroups[t] = [...(typeGroups[t] ?? []), b];
  });
  const reasons: Record<string, Building[]> = {};
  buildings.forEach(b => {
    (b.preservation_reasons ?? []).forEach(r => { reasons[r] = [...(reasons[r] ?? []), b]; });
  });

  const maxPriority = Math.max(...Object.values(byPriority).map(a => a.length));

  const SelectedPanel = () => !selected ? null : (
    <>
      <div className="fixed inset-0 z-[1150] bg-black/20" onClick={() => setSelected(null)} aria-hidden="true" />
      <aside role="dialog" aria-label={selected.label}
        className="fixed right-0 top-0 w-full sm:w-96 h-screen shadow-2xl z-[1200] flex flex-col"
        style={{ background: 'linear-gradient(180deg, var(--stone-light) 0%, var(--parchment) 100%)' }}>
        <div className="flex items-center justify-between gap-3 p-5 border-b" style={{ borderColor: 'var(--stone)' }}>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>{selected.label}</h3>
            <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>{selected.sites.length === 1 ? 'אתר אחד' : `${selected.sites.length} אתרים`}</p>
          </div>
          <button onClick={() => setSelected(null)} autoFocus aria-label="סגירת החלון"
            className="shrink-0 w-11 h-11 rounded-full text-xl font-bold transition-colors hover:bg-white"
            style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>×</button>
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto p-5">
          {selected.sites.map(b => (
            <Link key={b.id} href={`/buildings/${b.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors"
              style={{ borderInlineStart: '4px solid var(--amber)', backgroundColor: '#FAFAF8' }}>
              <SiteImage site={b} size="thumb" />
              <span className="min-w-0">
                <span className="text-sm font-medium block" style={{ color: 'var(--navy)' }}>{b.name}</span>
                <span className="text-xs block mt-1" style={{ color: 'var(--navy-soft)' }}>{b.address}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="p-5 border-t" style={{ borderColor: 'var(--stone)' }}>
          <button onClick={() => setSelected(null)} className="w-full px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>חזרה לסקירה</button>
        </div>
      </aside>
    </>
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <>
    <div>
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="page-intro">
        <p className="text-sm mb-3" style={{ color: 'var(--ocean)' }}>עיריית אשדוד — יחידת השימור</p>
        <h1 className="text-4xl font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>אתרי השימור של אשדוד</h1>
        <p className="max-w-3xl leading-relaxed" style={{ color: 'var(--navy-soft)' }}>
          אשדוד היא עיר צעירה (1956) על קרקע עתיקה. רשימת השימור שלה מספרת את שני הסיפורים יחד:
          <span className="highlight-text">שכבות של אלפי שנים</span> לאורך החוף ונחל לכיש,
          ו<span className="highlight-text">העיר המתוכננת של דור המייסדים</span> ברובע א׳ — שכונות, מבני ציבור ומרכז רובעי
          שהם היום ה&quot;עתיק&quot; של העיר המודרנית.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { num: buildings.length, label: 'אתרים מתועדים במערכת', sites: buildings, color: 'var(--amber)' },
          { num: byProtection['א'].length, label: 'דרגה א׳ מוצעת', sites: byProtection['א'], color: 'var(--rust)' },
          { num: byPriority['גבוהה'].length, label: 'עדיפות תיעוד גבוהה', sites: byPriority['גבוהה'], color: 'var(--amber-dark)' },
          { num: clusters.length, label: 'מקבצים עירוניים', sites: buildings, color: 'var(--ocean)', anchor: '#clusters' },
        ].map(({ num, label, sites, color, anchor }) => {
          const isActive = selected?.label === label;
          return anchor ? (
            <a key={label} href={anchor} className="glass-card p-6 text-center transition-all hover:shadow-md">
              <p className="text-4xl font-serif font-bold mb-1" style={{ color }}>{num}</p>
              <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>{label}</p>
            </a>
          ) : (
            <button key={label} onClick={() => select(label, sites)}
              className="glass-card p-6 text-center transition-all hover:shadow-md"
              style={{ borderColor: isActive ? color : undefined, borderWidth: isActive ? 2 : undefined }}>
              <p className="text-4xl font-serif font-bold mb-1" style={{ color }}>{num}</p>
              <p className="text-xs" style={{ color: 'var(--navy-soft)' }}>{label}</p>
            </button>
          );
        })}
      </div>

      <section className="glass-card p-6 space-y-5" aria-labelledby="about-list">
        <h2 id="about-list" className="text-xl font-serif font-bold" style={{ color: 'var(--navy)' }}>על הרשימה — מי קבע, ומה המספרים אומרים</h2>
        <div className="grid md:grid-cols-2 gap-5 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--navy)' }}>מי קבע את הרשימה</h3>
            <p>הוועדה העירונית לשימור אתרים, בישיבה 201601 מיום 17.8.2016, מכוח התוספת הרביעית לחוק התכנון והבנייה (סעיף 12). הוועדה אישרה &quot;רשימת אתרים וסביבתם לשימור בתחום העיר&quot;, מאורגנת במקבצים עירוניים — חוף הים, נחל לכיש, רובע א׳ ומסדרון אקולוגי — והחליטה להוסיף את כל בתי הכנסת המייצגים את תרבויות העיר ואת כל האנדרטאות.</p>
          </div>
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--navy)' }}>למה {buildings.length} אתרים</h3>
            <p>
              {buildings.length} אתרים במערכת: {committeeCount} אתרים ממוספרים ברשימת הוועדה
              {byListStatus.filter(x => x.s !== 'committee_2016' && x.sites.length).map(x => `, ${x.sites.length} ${LIST_STATUS_NOTES_SHORT[x.s]}`).join('')}.
              {' '}כל אתר נכנס למערכת עם תיק תיעוד משלו. המספר מחושב מהנתונים ויגדל עם כל אתר שנוסף.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--navy)' }}>מה פירוש דרגה א׳ / ב׳</h3>
            <p>הוועדה החליטה (סעיף 3) שהצוות המקצועי יציע דרגת שימור לכל אתר, באישור הוועדה. הדרגות במערכת הן <strong>הצעת עבודה שטרם אושרה</strong>: <strong>א׳</strong> — שימור מלא של המבנה או האתר וערכיו; <strong>ב׳</strong> — שימור הערכים העיקריים, עם גמישות לשינויים ותוספות לפי תיק תיעוד.</p>
          </div>
          <div>
            <h3 className="font-bold mb-1" style={{ color: 'var(--navy)' }}>מה פירוש עדיפות גבוהה</h3>
            <p>עדיפות לסדר התיעוד, לא לחשיבות האתר: אתרים בעלי ערך לאומי או ארכאולוגי, או אתרים שעלולים להיפגע מפיתוח והתחדשות עירונית בסביבתם. גם זו הערכת עבודה של הצוות, שתוצג לוועדה.</p>
          </div>
        </div>

        <div className="border-t pt-5" style={{ borderColor: 'var(--stone-light)' }}>
          <h3 className="font-bold mb-3 text-sm" style={{ color: 'var(--navy)' }}>מעמד האתר ברשימה — לחיצה מציגה את האתרים</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {byListStatus.map(({ s, sites }) => (
              <button key={s} onClick={() => sites.length && select(LIST_STATUS_LABELS[s], sites)} disabled={!sites.length}
                className="flex gap-3 items-start text-right p-3 rounded-lg transition-colors hover:bg-white disabled:opacity-60 disabled:hover:bg-transparent"
                style={{ border: '1px solid var(--stone-light)' }}>
                <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: LIST_STATUS_COLORS[s] }} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold" style={{ color: 'var(--navy)' }}>{LIST_STATUS_LABELS[s]} ({sites.length})</span>
                  <span className="block text-xs leading-relaxed" style={{ color: 'var(--navy-soft)' }}>{LIST_STATUS_NOTES[s]}</span>
                </span>
              </button>
            ))}
          </div>
          {toVerify.length > 0 && (
            <button onClick={() => select('רשומות לאימות', toVerify)} className="mt-3 text-sm underline" style={{ color: 'var(--rust)' }}>
              {toVerify.length} רשומות מסומנות &quot;לאימות&quot; — מקורות סותרים או מידע חסר
            </button>
          )}
        </div>

        <p className="text-xs leading-relaxed border-t pt-4" style={{ color: 'var(--navy-soft)', borderColor: 'var(--stone-light)' }}>{SOURCE_CREDIT}</p>
      </section>

      <section className="glass-card p-6 space-y-4" aria-labelledby="fourth-schedule">
        <h2 id="fourth-schedule" className="text-xl font-serif font-bold" style={{ color: 'var(--navy)' }}>התוספת הרביעית לחוק התכנון והבנייה</h2>
        <dl className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {[
            ['מהו אתר לשימור', 'בניין או קבוצת בניינים, או חלק מהם, לרבות סביבתם הקרובה, שלדעת מוסד תכנון הם בעלי חשיבות היסטורית, לאומית, אדריכלית או ארכאולוגית.'],
            ['מעמד הרשימה', 'כלי עבודה ואינוונטר. הכללה ברשימה אינה תכנית סטטוטורית, אבל היא בסיס לתכניות שימור ולהפעלת סמכויות רישוי.'],
            ['תכנית לשימור', 'דינה כדין תכנית מתאר מקומית. היא קובעת שימושים, הוראות שימור ותוספות בנייה.'],
            ['הרכב הוועדה', 'יו״ר, שלושה חברי מועצה, נציג מקצועי של הרשות ומומחה שימור בעל דעה מייעצת. מהנדס העיר ומתכנן המחוז מוזמנים קבועים.'],
            ['פיצויים ותמריצים', 'לפי סעיף 197, ובאמצעות העברת זכויות והנחות באגרות.'],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-bold" style={{ color: 'var(--navy)' }}>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Link href="/tour" className="block rounded-2xl p-6 sm:p-8 text-white transition-transform hover:scale-[1.01]"
        style={{ background: 'linear-gradient(120deg, var(--navy) 0%, var(--ocean-dark) 100%)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--amber-light)' }}>מצגת אינטראקטיבית</p>
        <p className="text-2xl sm:text-3xl font-serif font-bold mt-1">סיור מודרך בין {buildings.length} אתרי השימור</p>
        <p className="text-sm opacity-85 mt-2 max-w-xl">המפה טסה מאתר לאתר, עם תמונה וסיפור לכל נקודה. מתאים להצגה על מסך גדול — מקש F למסך מלא.</p>
        <span className="inline-block mt-4 px-6 py-3 rounded-lg font-semibold" style={{ backgroundColor: 'var(--amber)', color: 'var(--navy)' }}>התחלת הסיור</span>
      </Link>

      {/* מסלולים אחרונים */}
      <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, var(--ocean-pale) 0%, var(--parchment) 100%)', border: '1px solid var(--ocean-pale)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold" style={{ color: 'var(--navy)' }}>מסלולי סיור</h2>
          <Link href="/routes" className="text-sm font-medium transition-colors" style={{ color: 'var(--ocean)' }}>
            לכל המסלולים
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {routes.slice(0, 3).map(route => (
            <Link key={route.id} href={`/routes/${route.id}`}
              className="bg-white rounded-lg overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ border: '1px solid var(--ocean-pale)' }}>
              <div className="flex h-20">
                {(route.sites ?? []).slice(0, 3).map(s => {
                  const b = buildings.find(x => x.id === s.building_id);
                  return b ? <SiteImage key={s.id} site={b} size="card" className="!h-20 !rounded-none flex-1 min-w-0" /> : null;
                })}
              </div>
              <div className="p-4">
              <h3 className="font-serif font-bold text-sm mb-1" style={{ color: 'var(--navy)' }}>{route.title}</h3>
              <p className="text-xs mb-2" style={{ color: 'var(--navy-soft)' }}>
                {route.description?.slice(0, 80)}…
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--ocean-pale)', color: 'var(--ocean-dark)' }}>
                {route.sites?.length ?? 0} אתרים
              </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card p-6" style={{  }}>
        <h2 className="text-lg font-serif font-bold mb-5" style={{ color: 'var(--navy)' }}>עדיפות טיפול ורמת שימור</h2>
        <div className="space-y-4">
          {[
            { label: 'עדיפות גבוהה', group: byPriority['גבוהה'], color: 'var(--rust)' },
            { label: 'עדיפות בינונית', group: byPriority['בינונית'], color: 'var(--amber)' },
            { label: 'עדיפות נמוכה', group: byPriority['נמוכה'] ?? [], color: 'var(--stone-dark)' },
          ].map(({ label, group, color }) => {
            const isActive = selected?.label === label;
            return (
              <div key={label}>
                <div className="flex items-center gap-4">
                  <button onClick={() => select(label, group)}
                    className="text-sm shrink-0 hover:underline w-36 text-right" style={{ color: 'var(--navy-soft)' }}>
                    {label} ({group.length})
                  </button>
                  <div className="flex-1 h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--parchment-deep)' }}>
                    <button onClick={() => select(label, group)}
                      className="h-full rounded-full flex items-center pr-3 transition-all duration-500 hover:opacity-90"
                      style={{ width: `${(group.length / maxPriority) * 100}%`, backgroundColor: color, outline: isActive ? `2px solid ${color}` : 'none' }}>
                      <span className="text-white text-xs font-bold">{group.length}</span>
                    </button>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {['א', 'ב', 'ג'].map(level => {
                      const cnt = group.filter(b => b.protection_level === level).length;
                      return cnt > 0 ? (
                        <button key={level} onClick={() => select(`${label} — רמה ${level}`, group.filter(b => b.protection_level === level))}
                          className="text-xs px-1.5 py-0.5 rounded font-bold hover:opacity-80"
                          style={{ backgroundColor: 'var(--parchment)', color: 'var(--rust)', border: '1px solid var(--parchment-deep)' }}>
                          {level}:{cnt}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6" style={{  }}>
          <h2 className="text-lg font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>סוגי אתרים</h2>
          <div className="space-y-2">
            {Object.entries(typeGroups).sort((a, b) => b[1].length - a[1].length).map(([type, sites]) => {
              const isActive = selected?.label === type;
              return (
                <button key={type} onClick={() => select(type, sites)}
                  className="flex justify-between items-center py-1.5 w-full last:border-0 hover:bg-parchment px-2 rounded transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--parchment-deep)' : undefined, borderBottom: '1px solid var(--stone-light)' }}>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--stone-dark)' }}>{sites.length}</span>
                  <span className="text-sm" style={{ color: 'var(--navy)' }}>{type}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-6" style={{  }}>
          <h2 className="text-lg font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>סיבות שימור</h2>
          <div className="space-y-2">
            {Object.entries(reasons).sort((a, b) => b[1].length - a[1].length).map(([reason, sites]) => {
              const isActive = selected?.label === `סיבה: ${reason}`;
              return (
                <button key={reason} onClick={() => select(`סיבה: ${reason}`, sites)}
                  className="flex justify-between items-center py-1.5 w-full last:border-0 hover:bg-parchment px-2 rounded transition-colors"
                  style={{ backgroundColor: isActive ? 'var(--parchment-deep)' : undefined, borderBottom: '1px solid var(--stone-light)' }}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(sites.length * 8, 120)}px`, backgroundColor: 'var(--sage)', opacity: 0.7 }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--sage)' }}>{sites.length}</span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--navy)' }}>{reason}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass-card p-6" style={{  }}>
        <h2 id="clusters" className="text-lg font-serif font-bold mb-1 scroll-mt-24" style={{ color: 'var(--navy)' }}>מקבצים עירוניים</h2>
        <p className="text-xs mb-4" style={{ color: 'var(--navy-soft)' }}>הרשימה בנויה ממקבצים ולא מאתרים בודדים: כל מקבץ הוא סביבה שלמה — רחובות, נוף ומבנים — שמספרת פרק בתולדות העיר. לחיצה מציגה את האתרים במקבץ.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clusters.map(c => {
            const sites = buildings.filter(b => b.neighborhood === c.name);
            const isActive = selected?.label === c.name;
            const body = (
              <>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold" style={{ color: 'var(--navy)' }}>{c.name}</span>
                  <span className="text-xs font-bold shrink-0" style={{ color: 'var(--stone-dark)' }}>
                    {c.textual ? 'מרקם עירוני כולל' : sites.length === 1 ? 'אתר אחד' : `${sites.length} אתרים`}
                  </span>
                </span>
                {c.description && <span className="block text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--navy-soft)' }}>{c.description}</span>}
              </>
            );
            const style = { backgroundColor: isActive ? 'var(--parchment-deep)' : 'var(--parchment)', border: isActive ? '2px solid var(--stone)' : '1px solid var(--stone-light)' };
            return sites.length ? (
              <button key={c.name} onClick={() => select(c.name, sites)} className="rounded-lg p-4 text-right transition-all hover:shadow-sm" style={style}>{body}</button>
            ) : (
              <div key={c.name} className="rounded-lg p-4" style={style}>{body}</div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 justify-center flex-wrap pb-6">
        {[
          { href: '/map', label: 'צפה במפה', bg: 'var(--stone-dark)', color: 'white' },
          { href: '/routes', label: 'מסלולי סיור', bg: 'var(--ocean)', color: 'white' },
          { href: '/timeline', label: 'ציר זמן', bg: 'var(--sage)', color: 'white' },
          { href: '/buildings/detail', label: 'פירוט אתרים', bg: 'white', border: 'var(--stone)', color: 'var(--stone-dark)' },
        ].map(({ href, label, bg, border, color }) => (
          <Link key={href} href={href}
            className="px-8 py-3 font-medium rounded-lg text-sm transition-colors"
            style={{ backgroundColor: bg, color, border: border ? `1px solid ${border}` : 'none' }}>
            {label}
          </Link>
        ))}
      </div>
    </div>
    </div>
    {selected && <SelectedPanel />}
    </>
  );
}

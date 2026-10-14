'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { useSites, useGallery, useRoutes } from '@/components/providers/SiteData';
import { useEditor } from '@/components/providers/Editor';
import { SiteImage } from '@/components/sites/SiteImage';
import { SiteImageUpload, MakePrimaryButton, RemoveImageButton } from '@/components/sites/SiteImageUpload';
import { CommitteeDetails, ListStatusBadge, VerifyTag } from '@/components/sites/ListInfo';
import { CATEGORY_COLORS, categoryOf } from '@/lib/sites';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * דף אתר בשפת המצגת: תמונה מלאה עם שם גדול, סיפור אחד במרכז, ומעבר בין אתרים.
 * מתחת לסיפור — הנתונים המקצועיים, בשקט, למי שצריך אותם.
 */
export default function BuildingDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const sites = useSites();
  const routes = useRoutes();
  const gallery = useGallery(id);
  const { isEditor, state, signIn } = useEditor();
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<'professional' | 'public'>('professional');

  const ordered = useMemo(() => [...sites].sort((a, b) => Number(a.id) - Number(b.id)), [sites]);
  const index = ordered.findIndex(b => b.id === id);
  const building = ordered[index];
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  // הסיפור של האתר מתוך המסלולים (הטקסט שמוצג גם במצגת)
  const stops = useMemo(() => routes.flatMap(r => (r.sites ?? [])
    .filter(s => s.building_id === id)
    .map(s => ({ route: r, narrative: s.narrative_text }))), [routes, id]);
  const narrative = stops.find(s => s.narrative)?.narrative ?? null;

  // חצים במקלדת: מעבר לאתר הקודם / הבא. Esc סוגר תמונה מוגדלת.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape') setLightbox(null);
      if (lightbox) return;
      // RTL: חץ שמאלה = הבא
      if (e.key === 'ArrowLeft' && next) router.push(`/buildings/${next.id}`);
      if (e.key === 'ArrowRight' && prev) router.push(`/buildings/${prev.id}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, router, lightbox]);

  if (!building) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>אתר לא נמצא</h1>
        <Link href="/buildings/detail" className="text-sm underline" style={{ color: 'var(--ocean)' }}>חזרה לפירוט האתרים</Link>
      </div>
    );
  }

  const category = categoryOf(building);
  const pro = viewMode === 'professional';
  const facts: [string, string][] = [
    ['מס׳ רישום בעיר', building.city_registry_id],
    ['מקבץ', building.neighborhood ?? ''],
    ['שנת בנייה', building.year_built ? String(building.year_built) : ''],
    ['תקופות', (building.historical_periods ?? []).join(' · ')],
    ['אדריכל', building.architect ?? ''],
    ['סוג', [building.building_type, building.is_complex ? 'מתחם' : ''].filter(Boolean).join(' · ')],
    ['סוג בנייה', building.construction_type ?? ''],
    ['קומות', building.floors ? String(building.floors) : ''],
    ['שטח בנוי', building.total_built_area ? `${building.total_built_area.toLocaleString()} מ"ר` : ''],
    ['שימוש קיים', building.current_use ?? ''],
    ['טעמי שימור', (building.preservation_reasons ?? []).join(' · ')],
  ].filter((f): f is [string, string] => !!f[1]);

  return (
    <div className="space-y-8">
      {/* פס ניווט דביק: חזרה, מיקום ברשימה, קודם/הבא */}
      <nav aria-label="ניווט בין אתרים" className="no-print sticky top-16 z-30 -mx-4 sm:mx-0 px-4 sm:px-3 py-2 flex items-center gap-1.5 sm:gap-2 sm:rounded-[10px]"
        style={{ backgroundColor: 'rgba(247,240,227,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--hairline)' }}>
        <Link href="/buildings/detail" className="text-sm whitespace-nowrap px-2 py-2 hover:underline" style={{ color: 'var(--navy)' }}><span className="sm:hidden">לרשימה</span><span className="hidden sm:inline">חזרה לפירוט האתרים</span></Link>
        <span className="hidden sm:inline text-xs font-mono ms-1" style={{ color: 'var(--navy-soft)' }}>אתר {index + 1} מתוך {ordered.length}</span>
        <span className="flex-1" />
        <div className="flex shrink-0 rounded-lg overflow-hidden" style={{ border: '1px solid var(--stone)' }} role="group" aria-label="סוג תצוגה">
          {(['professional', 'public'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)} aria-pressed={viewMode === m}
              className="px-3 py-1.5 text-xs whitespace-nowrap"
              style={{ backgroundColor: viewMode === m ? 'var(--navy)' : 'transparent', color: viewMode === m ? 'white' : 'var(--navy)' }}>
              {m === 'professional' ? 'מקצועי' : 'ציבורי'}
            </button>
          ))}
        </div>
        {prev && <Link href={`/buildings/${prev.id}`} className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }} title={prev.name}>הקודם</Link>}
        {next && <Link href={`/buildings/${next.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap" style={{ backgroundColor: 'var(--navy)' }} title={next.name}>הבא</Link>}
      </nav>

      {/* פתיחה קולנועית: התמונה במלוא הרוחב, השם עליה */}
      <header className="relative overflow-hidden rounded-[10px] -mt-4" style={{ boxShadow: 'var(--shadow-lift)' }}>
        {building.image_url ? (
          <>
            <SiteImage site={building} size="hero" priority className="!h-[56vh] !min-h-[320px] !max-h-[560px] !rounded-none" />
            <div className="no-print absolute top-3 end-3 z-10">
              <RemoveImageButton siteId={building.id} url={building.image_url} label="הסרת התמונה הראשית" tone="dark" />
            </div>
          </>
        ) : (
          <div className="panel-ink h-[44vh] min-h-[300px] max-h-[440px] !rounded-none" style={{ backgroundColor: 'var(--navy)' }} aria-hidden="true">
            <div className="absolute inset-0" style={{ backgroundColor: CATEGORY_COLORS[category], opacity: 0.35, mixBlendMode: 'multiply' }} />
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(27,42,74,0) 30%, rgba(27,42,74,0.55) 62%, rgba(27,42,74,0.9) 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 text-white tour-fade">
          <p className="text-xs sm:text-sm mb-2" style={{ color: 'var(--amber-light)' }}>
            {category}{building.neighborhood ? ` · ${building.neighborhood}` : ''}{building.committee_no ? ` · מס׳ ${building.committee_no} ברשימת הוועדה` : ''}
          </p>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold leading-tight max-w-3xl">{building.name}</h1>
          <p className="text-sm sm:text-base mt-2 opacity-90">
            {building.address}
            {building.coords_approx && ' · מיקום משוער'}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {building.protection_level && <span className="px-2.5 py-1 rounded-full text-xs whitespace-nowrap" style={{ backgroundColor: 'rgba(247,240,227,0.92)', color: 'var(--rust)' }}>הצעת דרגת שימור {building.protection_level}׳</span>}
            <ListStatusBadge status={building.list_status} />
            <VerifyTag site={building} />
          </div>
        </div>
      </header>

      {/* מקום להעלאת תמונות: לעורכת — אזור גרירה; לאורח — הזמנה להיכנס */}
      {isEditor ? (
        <SiteImageUpload siteId={building.id} siteName={building.name} hasImage={!!building.image_url} />
      ) : pro && state === 'guest' && !building.image_url ? (
        <p className="no-print text-sm flex flex-wrap items-center gap-3" style={{ color: 'var(--navy-soft)' }}>
          לאתר הזה עדיין אין תמונה.
          <button onClick={signIn} className="underline font-semibold" style={{ color: 'var(--navy)' }}>כניסה לעריכה כדי להוסיף תמונה</button>
        </p>
      ) : null}

      {/* הסיפור: טקסט אחד גדול וקריא, כמו שקף במצגת */}
      <section aria-label="על האתר" className="grid lg:grid-cols-[1fr_280px] gap-8 items-start tour-slide">
        <div className="space-y-5 max-w-3xl">
          {narrative && (
            <p className="text-lg sm:text-xl font-medium leading-relaxed ps-4" style={{ color: 'var(--ocean-dark)', borderInlineStart: '3px solid var(--ocean)' }}>{narrative}</p>
          )}
          {building.full_description && (
            <p className="text-base sm:text-[17px] leading-[1.85]" style={{ color: 'var(--ink-soft)' }}>{building.full_description}</p>
          )}
          {building.additional_info && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--navy-soft)' }}>{building.additional_info}</p>
          )}
          {!narrative && !building.full_description && (
            <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>עדיין אין תיאור לאתר הזה.</p>
          )}
        </div>

        <aside className="space-y-4 text-sm">
          {stops.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--navy-soft)' }}>במסלולים</p>
              <ul className="space-y-1.5">
                {stops.map(s => (
                  <li key={s.route.id}>
                    <Link href={`/routes/${s.route.id}`} className="hover:underline" style={{ color: 'var(--navy)' }}>{s.route.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-col gap-2 no-print">
            <Link href={`/tour?site=${building.id}`} className="px-5 py-3 rounded-lg text-center font-semibold text-white" style={{ backgroundColor: 'var(--navy)' }}>הצגה במצגת</Link>
            <Link href={`/map?site=${building.id}`} className="px-5 py-3 rounded-lg text-center" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>במפה</Link>
          </div>
        </aside>
      </section>

      {gallery.length > 0 && (
        <section aria-label="תמונות נוספות" className="space-y-2">
          <h2 className="text-xs font-semibold" style={{ color: 'var(--navy-soft)' }}>תמונות נוספות · {gallery.length}</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {gallery.map(g => (
              <div key={g.url} className="shrink-0 w-40">
                <button onClick={() => setLightbox(g)} className="group relative block rounded-[10px] overflow-hidden" style={{ boxShadow: 'var(--shadow-soft)' }} aria-label={`הגדלה: ${g.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={g.title} loading="lazy" className="h-28 w-40 object-cover photo-mono transition-transform group-hover:scale-105" />
                </button>
                <MakePrimaryButton siteId={building.id} url={g.url} />
                <div className="mt-1"><RemoveImageButton siteId={building.id} url={g.url} label="הסרה" /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,20,16,0.9)' }} onClick={() => setLightbox(null)}>
          <figure role="dialog" aria-label={lightbox.title} className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} aria-label="סגירה" className="absolute -top-11 end-0 w-10 h-10 rounded-lg text-2xl leading-none text-white" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.title} className="w-full max-h-[80vh] object-contain rounded-lg photo-mono" />
            <figcaption className="flex justify-between items-center mt-3 text-white text-sm">
              <span>{lightbox.title}</span>
              <button onClick={() => setLightbox(null)} className="px-5 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>חזרה לדף האתר</button>
            </figcaption>
          </figure>
        </div>
      )}

      {pro && (
        <>
          {/* מצב התיק: שורה אחת, עם הצעד הבא */}
          <section aria-label="מצב תיק התיעוד" className="flex flex-wrap items-center gap-3 py-4" style={{ borderTop: '1px solid var(--hairline)', borderBottom: '1px solid var(--hairline)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--navy-soft)' }}>תיק תיעוד</span>
            <StatusBadge status={building.status} />
            {building.priority_level && <span className="text-sm whitespace-nowrap" style={{ color: 'var(--navy-soft)' }}>עדיפות {building.priority_level}</span>}
            <span className="flex-1" />
            <div className="flex flex-wrap gap-2 no-print">
              <Link href={`/buildings/${building.id}/file`} className="px-6 py-3 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: 'var(--amber-dark)' }}>פתיחת תיק התיעוד</Link>
              <Link href={`/field/${building.id}`} className="px-6 py-3 rounded-lg text-sm" style={{ border: '1px solid var(--sage)', color: 'var(--sage)' }}>תיעוד בשטח</Link>
              <Link href={`/buildings/${building.id}/card`} className="px-6 py-3 rounded-lg text-sm" style={{ border: '1px solid var(--stone)', color: 'var(--navy)' }}>כרטסת תיק</Link>
            </div>
          </section>

          {facts.length > 0 && (
            <section aria-labelledby="facts" className="space-y-3">
              <h2 id="facts" className="font-serif font-bold text-lg" style={{ color: 'var(--navy)' }}>נתוני האתר</h2>
              <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                {facts.map(([k, v]) => (
                  <div key={k} className="py-3" style={{ borderTop: '1px solid var(--hairline)' }}>
                    <dt className="text-xs" style={{ color: 'var(--navy-soft)' }}>{k}</dt>
                    <dd className="text-sm mt-0.5" style={{ color: 'var(--navy)' }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <CommitteeDetails site={building} />

          {(building.iaa_reference || (building.gov_sources ?? []).length > 0) && (
            <p className="text-xs flex flex-wrap gap-3" style={{ color: 'var(--stone-dark)' }}>
              {building.iaa_reference && <span className="font-mono">IAA: {building.iaa_reference}</span>}
              {building.gov_sources?.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--sage)' }}>מקור {i + 1}</a>
              ))}
            </p>
          )}
        </>
      )}

      {/* מעבר לאתר הבא, כמו שקף הבא במצגת */}
      <nav aria-label="האתר הבא והקודם" className="no-print grid sm:grid-cols-2 gap-3 pt-2">
        {prev ? (
          <Link href={`/buildings/${prev.id}`} className="group flex items-center gap-3 p-3 rounded-[10px]" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--hairline)' }}>
            <SiteImage site={prev} size="thumb" />
            <span className="min-w-0"><span className="block text-xs" style={{ color: 'var(--navy-soft)' }}>האתר הקודם</span><span className="block font-semibold truncate group-hover:underline" style={{ color: 'var(--navy)' }}>{prev.name}</span></span>
          </Link>
        ) : <span />}
        {next && (
          <Link href={`/buildings/${next.id}`} className="group flex items-center gap-3 p-3 rounded-[10px] sm:flex-row-reverse sm:text-left" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--hairline)' }}>
            <SiteImage site={next} size="thumb" />
            <span className="min-w-0"><span className="block text-xs" style={{ color: 'var(--navy-soft)' }}>האתר הבא</span><span className="block font-semibold truncate group-hover:underline" style={{ color: 'var(--navy)' }}>{next.name}</span></span>
          </Link>
        )}
      </nav>
    </div>
  );
}

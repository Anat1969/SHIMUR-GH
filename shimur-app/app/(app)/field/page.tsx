'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSites } from '@/components/providers/SiteData';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { SiteImage } from '@/components/sites/SiteImage';
import { ListViews } from '@/components/buildings/ListViews';
import { CLUSTERS } from '@/lib/clusters';
import type { Building } from '@/lib/types';

// מרחק בקילומטרים בין שתי נקודות (נוסחת הוורסינוס)
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const fmtDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} מ׳` : `${km.toFixed(1)} ק״מ`);

type Locate = { state: 'idle' } | { state: 'loading' } | { state: 'error'; message: string } | { state: 'ok'; lat: number; lng: number };

export default function FieldListPage() {
  const sites = useSites();
  const [loc, setLoc] = useState<Locate>({ state: 'idle' });

  const locate = () => {
    if (!('geolocation' in navigator)) { setLoc({ state: 'error', message: 'הדפדפן לא תומך באיתור מיקום. אפשר לבחור אתר מהרשימה לפי מקבץ.' }); return; }
    setLoc({ state: 'loading' });
    navigator.geolocation.getCurrentPosition(
      p => setLoc({ state: 'ok', lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setLoc({ state: 'error', message: 'לא התקבלה הרשאה למיקום. אפשרי גישה למיקום בהגדרות הדפדפן ונסי שוב, או בחרי אתר לפי מקבץ.' }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const byDistance = useMemo(() => {
    if (loc.state !== 'ok') return null;
    return sites
      .filter((b): b is Building & { lat: number; lng: number } => b.lat != null && b.lng != null)
      .map(b => ({ b, km: distanceKm(loc, b) }))
      .sort((x, y) => x.km - y.km);
  }, [sites, loc]);

  const groups = useMemo(() => {
    const names = [...new Set([...CLUSTERS.map(c => c.name), ...sites.map(b => b.neighborhood ?? 'ללא מקבץ')])];
    return names.map(name => ({ name, list: sites.filter(b => (b.neighborhood ?? 'ללא מקבץ') === name) })).filter(g => g.list.length);
  }, [sites]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <ListViews current="field" />

      <div>
        <p className="text-sm mb-1" style={{ color: 'var(--sage)' }}>לעבודה מהנייד</p>
        <h1 className="text-3xl font-serif font-bold mb-2" style={{ color: 'var(--navy)' }}>תיעוד בשטח</h1>
        <p style={{ color: 'var(--navy-soft)' }}>מוצאים את האתר הקרוב, מנווטים אליו, ומתעדים ממצאים עם תמונה ישירות לתיק.</p>
      </div>

      <div className="panel-ink p-4 flex flex-wrap items-center gap-3" style={{ backgroundColor: 'var(--sage)', color: 'white' }}>
        <button onClick={locate} disabled={loc.state === 'loading'}
          className="flex-1 min-w-[200px] px-6 py-4 rounded-xl text-base font-bold disabled:opacity-70"
          style={{ backgroundColor: 'white', color: 'var(--sage)' }}>
          {loc.state === 'loading' ? 'מאתר מיקום…' : loc.state === 'ok' ? 'רענון המיקום שלי' : 'האתרים הקרובים אליי'}
        </button>
        {loc.state === 'ok' && (
          <button onClick={() => setLoc({ state: 'idle' })} className="px-5 py-4 rounded-xl text-sm font-semibold" style={{ border: '1px solid rgba(255,255,255,0.7)' }}>
            חזרה לרשימה לפי מקבץ
          </button>
        )}
        {loc.state === 'error' && <p role="alert" className="w-full text-sm">{loc.message}</p>}
      </div>

      {byDistance ? (
        <ul className="space-y-3" aria-label="אתרים לפי מרחק">
          {byDistance.map(({ b, km }) => <FieldCard key={b.id} b={b} distance={fmtDistance(km)} />)}
        </ul>
      ) : (
        groups.map(g => (
          <section key={g.name} aria-labelledby={`cl-${g.name}`} className="space-y-3">
            <h2 id={`cl-${g.name}`} className="sticky top-16 z-20 py-2 font-serif font-bold text-lg"
              style={{ color: 'var(--navy)', backgroundColor: 'rgba(247,240,227,0.95)' }}>
              {g.name} <span className="text-sm font-normal" style={{ color: 'var(--navy-soft)' }}>· {g.list.length}</span>
            </h2>
            <ul className="space-y-3">
              {g.list.map(b => <FieldCard key={b.id} b={b} />)}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function FieldCard({ b, distance }: { b: Building; distance?: string }) {
  const nav = b.lat != null && b.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}` : null;
  return (
    <li className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--surface-solid)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-soft)' }}>
      <div className="flex items-start gap-3">
        <SiteImage site={b} size="thumb" className="!w-16 !h-16" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg leading-snug" style={{ color: 'var(--navy)' }}>{b.name}</p>
          <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>
            {b.address}
            {b.coords_approx && <span style={{ color: 'var(--rust)' }}> · מיקום משוער</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <StatusBadge status={b.status} />
            {distance && <span className="text-sm font-bold whitespace-nowrap" style={{ color: 'var(--sage)' }}>{distance}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link href={`/field/${b.id}`} className="flex-1 text-center px-6 py-3.5 rounded-xl text-base font-bold text-white" style={{ backgroundColor: 'var(--sage)' }}>
          תיעוד בשטח
        </Link>
        {nav && (
          <a href={nav} target="_blank" rel="noopener noreferrer" className="px-6 py-3.5 rounded-xl text-base font-semibold whitespace-nowrap" style={{ border: '1px solid var(--sage)', color: 'var(--sage)' }}>
            ניווט
          </a>
        )}
      </div>
    </li>
  );
}

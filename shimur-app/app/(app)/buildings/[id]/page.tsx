'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/buildings/StatusBadge';
import { SiteCard } from '@/components/buildings/SiteCard';
import { useSites, useGallery } from '@/components/providers/SiteData';
import { SiteImage } from '@/components/sites/SiteImage';
import { CommitteeDetails } from '@/components/sites/ListInfo';

interface Props {
  params: Promise<{ id: string }>;
}

export default function BuildingDetailPage({ params }: Props) {
  const { id } = use(params);
  const building = useSites().find(b => b.id === id);
  const gallery = useGallery(id);
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<'professional' | 'public'>('professional');

  if (!building) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-serif font-bold mb-4" style={{ color: 'var(--navy)' }}>
          אתר לא נמצא
        </h1>
        <Link href="/buildings" className="text-sm" style={{ color: 'var(--ocean)' }}>
          חזרה לרשימה
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/buildings" className="text-sm transition-colors" style={{ color: 'var(--stone-dark)' }}>
          חזרה לרשימה
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('professional')}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'professional' ? 'var(--amber)' : 'var(--parchment-deep)',
              color: viewMode === 'professional' ? 'white' : 'var(--ink-soft)',
            }}
          >
            מקצועי
          </button>
          <button
            onClick={() => setViewMode('public')}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: viewMode === 'public' ? 'var(--ocean)' : 'var(--ocean-pale)',
              color: viewMode === 'public' ? 'white' : 'var(--ocean-dark)',
            }}
          >
            תצוגת תייר
          </button>
        </div>
      </div>

      <SiteImage site={building} size="hero" priority className="shadow-md" />

      {gallery.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1" aria-label="תמונות נוספות">
          {gallery.map(g => (
            <button key={g.url} onClick={() => setLightbox(g)} className="shrink-0 group relative rounded-xl overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.title} loading="lazy" className="h-28 w-40 object-cover photo-mono transition-transform group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 px-2 py-1 text-[11px] text-white text-right" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6), transparent)' }}>{g.title}</span>
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26,20,16,0.9)' }} onClick={() => setLightbox(null)} role="dialog" aria-label={lightbox.title}>
          <figure className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.title} className="w-full max-h-[80vh] object-contain rounded-lg photo-mono" />
            <figcaption className="flex justify-between items-center mt-3 text-white text-sm">
              <span>{lightbox.title}</span>
              <button onClick={() => setLightbox(null)} className="px-5 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>סגירה</button>
            </figcaption>
          </figure>
        </div>
      )}

      <SiteCard building={building} variant={viewMode} showImage={false} />

      <CommitteeDetails site={building} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4" style={{ borderColor: 'var(--stone-light)' }}>
          <div>
            <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>מס׳ רישום בעיר</label>
            <p className="text-lg font-mono" style={{ color: 'var(--navy)' }}>{building.city_registry_id}</p>
          </div>
          {building.neighborhood && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>שכונה</label>
              <p style={{ color: 'var(--navy)' }}>{building.neighborhood}</p>
            </div>
          )}
          {building.year_built && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>שנת בנייה</label>
              <p style={{ color: 'var(--navy)' }}>{building.year_built}</p>
            </div>
          )}
          {building.floors && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>קומות</label>
              <p style={{ color: 'var(--navy)' }}>{building.floors}</p>
            </div>
          )}
          {building.total_built_area && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>שטח בנוי</label>
              <p style={{ color: 'var(--navy)' }}>{building.total_built_area.toLocaleString()} מ"ר</p>
            </div>
          )}
        </div>

        <div className="glass-card p-6 space-y-4" style={{ borderColor: 'var(--stone-light)' }}>
          {building.architect && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>אדריכל</label>
              <p style={{ color: 'var(--navy)' }}>{building.architect}</p>
            </div>
          )}
          {building.protection_level && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>רמת שימור</label>
              <p className="text-lg font-semibold" style={{ color: 'var(--amber-dark)' }}>{building.protection_level}</p>
            </div>
          )}
          {building.construction_type && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>סוג בנייה</label>
              <p style={{ color: 'var(--navy)' }}>{building.construction_type}</p>
            </div>
          )}
          {building.is_complex && (
            <div>
              <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--navy-soft)' }}>סוג</label>
              <p style={{ color: 'var(--navy)' }}>מתחם</p>
            </div>
          )}
        </div>
      </div>

      {building.current_use && (
        <div className="glass-card p-6" style={{ borderColor: 'var(--stone-light)' }}>
          <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--navy-soft)' }}>שימוש קיים</label>
          <p style={{ color: 'var(--navy)' }}>{building.current_use}</p>
        </div>
      )}

      {building.full_description && (
        <div className="glass-card p-6" style={{ borderColor: 'var(--stone-light)' }}>
          <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--navy-soft)' }}>תיאור</label>
          <p className="leading-relaxed" style={{ color: 'var(--navy)' }}>{building.full_description}</p>
        </div>
      )}

      {building.additional_info && (
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--parchment-deep)', border: '1px solid var(--stone)' }}>
          <label className="block text-xs font-semibold uppercase mb-2" style={{ color: 'var(--stone-dark)' }}>מידע נוסף</label>
          <p className="leading-relaxed text-sm" style={{ color: 'var(--navy-soft)' }}>{building.additional_info}</p>
          {building.iaa_reference && (
            <p className="text-xs mt-2 font-mono" style={{ color: 'var(--stone-dark)' }}>IAA: {building.iaa_reference}</p>
          )}
          {(building.gov_sources ?? []).length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {building.gov_sources!.map(url => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-xs underline" style={{ color: 'var(--sage)' }}>
                  מקור
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link href={`/buildings/${building.id}/file`}
          className="px-6 py-3 text-white font-medium rounded-lg transition-colors text-sm"
          style={{ backgroundColor: 'var(--amber)' }}>
          פתח תיק תיעוד
        </Link>
        <Link href={`/field/${building.id}`}
          className="px-6 py-3 font-medium rounded-lg transition-colors text-sm"
          style={{ backgroundColor: 'white', color: 'var(--sage)', border: '1px solid var(--sage)' }}>
          מצב שטח
        </Link>
        <Link href={`/tour?site=${building.id}`}
          className="px-6 py-3 font-medium rounded-lg transition-colors text-sm text-white"
          style={{ backgroundColor: 'var(--navy)' }}>
          הצגה במצגת
        </Link>
        <Link href={`/buildings/${building.id}/card`}
          className="px-6 py-3 font-medium rounded-lg transition-colors text-sm"
          style={{ backgroundColor: 'white', color: 'var(--ocean)', border: '1px solid var(--ocean)' }}>
          כרטסת תיק
        </Link>
      </div>
    </div>
  );
}

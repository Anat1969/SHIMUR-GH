import type { Building } from '@/lib/types';
import { CATEGORY_COLORS, categoryOf } from '@/lib/sites';

type Size = 'thumb' | 'card' | 'hero';

const SIZE_CLASS: Record<Size, string> = {
  thumb: 'w-12 h-12 rounded-lg',
  card: 'w-full h-40 rounded-t-xl',
  hero: 'w-full h-56 sm:h-80 rounded-2xl',
};

/**
 * תמונת אתר אחידה לכל האפליקציה.
 * אין תמונה → משטח בצבע הקטגוריה עם שם האתר (בלי אייקון), כך שהעמוד נשאר שלם.
 */
export function SiteImage({ site, size = 'card', className = '', priority = false }: {
  site: Pick<Building, 'name' | 'image_url' | 'building_type' | 'style'>;
  size?: Size;
  className?: string;
  priority?: boolean;
}) {
  const cls = `${SIZE_CLASS[size]} ${className} shrink-0 overflow-hidden`;
  if (site.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={site.image_url}
        alt={site.name}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${cls} object-cover photo-mono`}
        style={{ backgroundColor: 'var(--parchment-deep)' }}
      />
    );
  }
  const color = CATEGORY_COLORS[categoryOf(site as Building)];
  const initials = site.name.replace(/[״"׳'()]/g, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('');
  return (
    <div
      role="img"
      aria-label={`${site.name} — אין עדיין תמונה`}
      className={`${cls} flex items-end`}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}CC 45%, var(--navy) 140%)`,
        boxShadow: 'inset 0 -40px 60px -30px rgba(0,0,0,0.35)',
      }}
    >
      {size === 'thumb' ? (
        <span className="w-full text-center pb-3 text-white font-serif font-bold text-base">{initials}</span>
      ) : (
        <span className="p-4 text-white/90 font-serif font-bold leading-tight text-lg sm:text-2xl">{site.name}</span>
      )}
    </div>
  );
}

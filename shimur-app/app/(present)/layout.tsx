import { getSites, getRoutes, getGallery } from '@/lib/data';
import { SiteDataProvider } from '@/components/providers/SiteData';

export const dynamic = 'force-dynamic';

// מסגרת למצב מצגת: נתונים מלאים, ללא תפריט וכותרת תחתונה
export default async function PresentLayout({ children }: { children: React.ReactNode }) {
  const [{ sites, source }, routes, gallery] = await Promise.all([getSites(), getRoutes(), getGallery()]);
  return <SiteDataProvider value={{ sites, routes, source, gallery }}>{children}</SiteDataProvider>;
}

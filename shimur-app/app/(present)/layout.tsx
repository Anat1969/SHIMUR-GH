import { getSites, getRoutes } from '@/lib/data';
import { SiteDataProvider } from '@/components/providers/SiteData';

export const dynamic = 'force-dynamic';

// מסגרת למצב מצגת: נתונים מלאים, ללא תפריט וכותרת תחתונה
export default async function PresentLayout({ children }: { children: React.ReactNode }) {
  const [{ sites, source }, routes] = await Promise.all([getSites(), getRoutes()]);
  return <SiteDataProvider value={{ sites, routes, source }}>{children}</SiteDataProvider>;
}

import { getSites, getRoutes, getGallery } from '@/lib/data';
import { SiteDataProvider } from '@/components/providers/SiteData';
import { AppShell } from '@/components/layout/AppShell';

// נתונים חיים מהמאגר בכל טעינה
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ sites, source }, routes, gallery] = await Promise.all([getSites(), getRoutes(), getGallery()]);

  return (
    <SiteDataProvider value={{ sites, routes, source, gallery }}>
      <AppShell source={source}>{children}</AppShell>
    </SiteDataProvider>
  );
}

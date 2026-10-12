import { getSites, getRoutes } from '@/lib/data';
import { SiteDataProvider } from '@/components/providers/SiteData';
import { AppShell } from '@/components/layout/AppShell';

// נתונים חיים מהמאגר בכל טעינה
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ sites, source }, routes] = await Promise.all([getSites(), getRoutes()]);

  return (
    <SiteDataProvider value={{ sites, routes, source }}>
      <AppShell source={source}>{children}</AppShell>
    </SiteDataProvider>
  );
}

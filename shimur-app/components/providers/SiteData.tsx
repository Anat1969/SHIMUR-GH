'use client';

import { createContext, useContext } from 'react';
import type { Building, Route, DataSource } from '@/lib/types';

export interface GalleryImage { url: string; title: string }

interface SiteDataValue {
  sites: Building[];
  routes: Route[];
  source: DataSource;
  /** תמונות נוספות לפי מספר אתר */
  gallery: Record<string, GalleryImage[]>;
}

const SiteDataContext = createContext<SiteDataValue | null>(null);

export function SiteDataProvider({ value, children }: { value: SiteDataValue; children: React.ReactNode }) {
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

function useSiteData(): SiteDataValue {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('SiteDataProvider חסר בעץ הרכיבים');
  return ctx;
}

export const useSites = () => useSiteData().sites;
export const useRoutes = () => useSiteData().routes;
export const useDataSource = () => useSiteData().source;
export const useGallery = (siteId: string): GalleryImage[] => useSiteData().gallery[siteId] ?? [];

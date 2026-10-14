import { cache } from 'react';
import { getPublicClient } from '@/lib/supabase/public';
import { T } from '@/lib/supabase/config';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { DEMO_ROUTES } from '@/lib/demo/routes';
import type {
  Building, Route, RouteSite, HistoricalMap, SiteDocument, DataSource, BuildingStatus, ProtectionLevel, ListStatus,
} from '@/lib/types';

// שכבת נתונים אחת לכל האפליקציה: קוראת מ-ASHDODMAP,
// ואם המאגר לא זמין — נופלת לנתוני הגיבוי שבקוד, כדי שהמצגת לעולם לא תישבר.

interface BuildingRow {
  id: string;
  site_no: number;
  city_registry_id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  parcel: string | null;
  is_complex: boolean;
  lat: number | null;
  lng: number | null;
  year_built: number | null;
  year_built_verified: boolean;
  architect: string | null;
  architect_verified: boolean;
  style: string | null;
  historical_periods: string[];
  protection_level: ProtectionLevel | null;
  floors: number | null;
  total_built_area: number | null;
  construction_type: string | null;
  documentation_reason: string | null;
  owner: string | null;
  current_use: string | null;
  original_use: string | null;
  building_type: string | null;
  preservation_reasons: string[];
  priority_level: string | null;
  full_description: string | null;
  additional_info: string | null;
  iaa_reference: string | null;
  gov_sources: string[];
  image_url: string | null;
  // שדות רשימת הוועדה — חסרים אם migration 003 לא הורץ
  committee_no?: string | null;
  list_status?: ListStatus | null;
  statutory_ref?: string | null;
  coords_approx?: boolean | null;
  data_conflict?: string | null;
  components?: string[] | null;
  risk_note?: string | null;
  grade_note?: string | null;
  status: BuildingStatus;
  created_at: string;
  updated_at: string;
}

const u = <V,>(v: V | null | undefined): V | undefined => (v === null ? undefined : v);

function mapBuilding(r: BuildingRow): Building {
  return {
    id: String(r.site_no),
    db_id: r.id,
    city_registry_id: r.city_registry_id,
    name: r.name,
    address: r.address,
    neighborhood: u(r.neighborhood),
    parcel: u(r.parcel),
    is_complex: r.is_complex,
    lat: u(r.lat),
    lng: u(r.lng),
    year_built: u(r.year_built),
    year_built_verified: r.year_built_verified,
    architect: u(r.architect),
    architect_verified: r.architect_verified,
    style: u(r.style),
    historical_periods: r.historical_periods,
    protection_level: u(r.protection_level),
    floors: u(r.floors),
    total_built_area: r.total_built_area === null ? undefined : Number(r.total_built_area),
    construction_type: u(r.construction_type),
    documentation_reason: u(r.documentation_reason),
    owner: u(r.owner),
    current_use: u(r.current_use),
    original_use: u(r.original_use),
    building_type: u(r.building_type),
    preservation_reasons: r.preservation_reasons,
    priority_level: u(r.priority_level),
    full_description: u(r.full_description),
    additional_info: u(r.additional_info),
    iaa_reference: u(r.iaa_reference),
    gov_sources: r.gov_sources,
    image_url: u(r.image_url),
    committee_no: u(r.committee_no),
    list_status: u(r.list_status),
    statutory_ref: u(r.statutory_ref),
    coords_approx: r.coords_approx ?? false,
    data_conflict: u(r.data_conflict),
    components: r.components ?? [],
    risk_note: u(r.risk_note),
    grade_note: u(r.grade_note),
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

const DEMO_IMAGES: Record<string, string> = {
  '1': '/sites/s01-old.jpg', '2': '/sites/s02-old.jpg', '3': '/sites/s03-old.jpg',
  '4': '/sites/s04-old.jpg', '5': '/sites/s05-old.jpg', '7': '/sites/s07-c.jpg', '14': '/sites/s14-old.jpg',
};

const demoSites = (): Building[] =>
  DEMO_BUILDINGS.map(b => ({ ...b, image_url: b.image_url ?? DEMO_IMAGES[b.id] }));

export interface SitesResult { sites: Building[]; source: DataSource }

export const getSites = cache(async (): Promise<SitesResult> => {
  try {
    const { data, error } = await getPublicClient()
      .from(T.buildings)
      .select('*')
      .order('site_no');
    if (error) throw error;
    if (!data || data.length === 0) return { sites: demoSites(), source: 'demo' };
    return { sites: (data as BuildingRow[]).map(mapBuilding), source: 'db' };
  } catch (err) {
    console.error('[data] getSites fallback to demo:', err);
    return { sites: demoSites(), source: 'demo' };
  }
});

export async function getSite(id: string): Promise<Building | undefined> {
  const { sites } = await getSites();
  return sites.find(s => s.id === id);
}

interface RouteRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  theme: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  shimur_route_sites: { id: string; position: number; narrative_text: string | null; shimur_buildings: { site_no: number } | null }[];
}

export const getRoutes = cache(async (): Promise<Route[]> => {
  try {
    const { data, error } = await getPublicClient()
      .from(T.routes)
      .select('*, shimur_route_sites(id, position, narrative_text, shimur_buildings(site_no))')
      .order('created_at');
    if (error) throw error;
    if (!data || data.length === 0) return DEMO_ROUTES;
    return (data as unknown as RouteRow[]).map(r => ({
      id: r.slug,
      title: r.title,
      description: r.description,
      theme: r.theme,
      cover_image_url: null,
      created_by: 'system',
      is_public: r.is_public,
      created_at: r.created_at,
      updated_at: r.updated_at,
      sites: r.shimur_route_sites
        .filter(s => s.shimur_buildings)
        .sort((a, b) => a.position - b.position)
        .map<RouteSite>(s => ({
          id: s.id,
          route_id: r.slug,
          building_id: String(s.shimur_buildings!.site_no),
          position: s.position,
          narrative_text: s.narrative_text,
        })),
    }));
  } catch (err) {
    console.error('[data] getRoutes fallback to demo:', err);
    return DEMO_ROUTES;
  }
});

export const getHistoricalMaps = cache(async (): Promise<HistoricalMap[]> => {
  try {
    const { data, error } = await getPublicClient()
      .from(T.historicalMaps)
      .select('id, title, url, year, description, bounds')
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as HistoricalMap[];
  } catch (err) {
    console.error('[data] getHistoricalMaps:', err);
    return [];
  }
});

interface DocumentRow {
  id: string;
  kind: SiteDocument['kind'];
  title: string;
  url: string | null;
  note: string | null;
  created_at: string;
  shimur_buildings: { site_no: number } | null;
}

export const getDocuments = cache(async (): Promise<SiteDocument[]> => {
  try {
    const { data, error } = await getPublicClient()
      .from(T.documents)
      .select('id, kind, title, url, note, created_at, shimur_buildings(site_no)')
      .is('removed_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as unknown as DocumentRow[]).map(d => ({
      id: d.id,
      kind: d.kind,
      title: d.title,
      url: d.url,
      note: d.note,
      created_at: d.created_at,
      building_id: d.shimur_buildings ? String(d.shimur_buildings.site_no) : null,
    }));
  } catch (err) {
    console.error('[data] getDocuments:', err);
    return [];
  }
});

/** תמונות גלריה לפי אתר (מתוך shimur_documents מסוג image) */
export async function getGallery(): Promise<Record<string, { url: string; title: string }[]>> {
  const docs = await getDocuments();
  const out: Record<string, { url: string; title: string }[]> = {};
  docs.filter(d => d.kind === 'image' && d.url && d.building_id).reverse().forEach(d => {
    (out[d.building_id!] ??= []).push({ url: d.url!, title: d.title });
  });
  return out;
}

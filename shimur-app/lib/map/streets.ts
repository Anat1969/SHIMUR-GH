// Ashdod streets layer (2026-11-03, from Anat: rehevot.shp of the municipality, Israel TM Grid). The original files are
// kept in data/gis/rehovot/ at the repo root; public/gis/ashdod-streets.geojson is the same layer in WGS84, made by
// scripts/streets-to-geojson.py. It is fetched only when needed: the map's "רחובות העיר" layer, or a field finding.

export interface StreetProps { name: string; quarter: string; tier: number; code: number; year?: number }
interface Feature { properties: StreetProps; geometry: { type: 'LineString' | 'MultiLineString'; coordinates: number[][] | number[][][] } }
export interface StreetsGeo { type: 'FeatureCollection'; features: Feature[] }

let cache: Promise<StreetsGeo> | null = null;
export function loadStreets(): Promise<StreetsGeo> {
  cache ??= fetch('/gis/ashdod-streets.geojson').then(r => {
    if (!r.ok) throw new Error('שכבת הרחובות לא נטענה');
    return r.json() as Promise<StreetsGeo>;
  }).catch(e => { cache = null; throw e; });
  return cache;
}

/** The street a point stands on: the nearest segment within maxM metres, or null. */
export async function nearestStreet(lat: number, lng: number, maxM = 60): Promise<(StreetProps & { metres: number }) | null> {
  const geo = await loadStreets();
  const kx = 111320 * Math.cos((lat * Math.PI) / 180); // metres per degree of longitude here
  const ky = 110540;
  const px = lng * kx, py = lat * ky;
  let best: { p: StreetProps; d: number } | null = null;
  for (const f of geo.features) {
    const lines = (f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates) as number[][][];
    for (const line of lines) {
      for (let i = 1; i < line.length; i++) {
        const ax = line[i - 1][0] * kx, ay = line[i - 1][1] * ky, bx = line[i][0] * kx, by = line[i][1] * ky;
        const dx = bx - ax, dy = by - ay;
        const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
        const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        if (!best || d < best.d) best = { p: f.properties, d };
      }
    }
  }
  return best && best.d <= maxM && best.p.name ? { ...best.p, metres: Math.round(best.d) } : null;
}

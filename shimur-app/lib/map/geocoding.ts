'use server';

import { z } from 'zod';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'shimur-ashdod/2.0';
const RATE_LIMIT_MS = 1100;

let lastRequestTime = 0;

const NominatimResultSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    type: z.string().optional(),
    importance: z.number().optional(),
  })
);

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function geocodeAddress(
  address: string,
  city = 'אשדוד'
): Promise<GeocodingResult | null> {
  await enforceRateLimit();

  const query = `${address}, ${city}, ישראל`;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'il',
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`שגיאת גיאוקודינג: ${response.status} ${response.statusText}`);
  }

  const data = NominatimResultSchema.parse(await response.json());

  if (data.length === 0) {
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

export async function geocodeBatch(
  addresses: Array<{ id: string; address: string; city?: string }>
): Promise<Array<{ id: string; result: GeocodingResult | null; error?: string }>> {
  const results: Array<{ id: string; result: GeocodingResult | null; error?: string }> = [];

  for (const item of addresses) {
    try {
      const result = await geocodeAddress(item.address, item.city);
      results.push({ id: item.id, result });
    } catch (error) {
      results.push({
        id: item.id,
        result: null,
        error: error instanceof Error ? error.message : 'שגיאה לא ידועה',
      });
    }
  }

  return results;
}

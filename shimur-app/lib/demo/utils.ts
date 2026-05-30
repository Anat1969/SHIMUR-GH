import { cookies } from 'next/headers';
import { DEMO_BUILDINGS } from './buildings';

export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('demo_mode')?.value === 'true';
}

export function getDemoBuildings() {
  return DEMO_BUILDINGS;
}

export function getDemoBuildingById(id: string) {
  return DEMO_BUILDINGS.find(b => b.id === id);
}

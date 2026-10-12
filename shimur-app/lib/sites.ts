import type { Building } from '@/lib/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/types';

export type Category = 'ארכאולוגי' | 'היסטורי' | 'תרבותי' | 'טבע ונוף';

const CATEGORY_TYPES: Record<Category, string[]> = {
  'ארכאולוגי': ['תל ארכאולוגי', 'מצודה ארכאולוגית', 'אתר ארכאולוגי', 'מוזיאון'],
  'היסטורי': ['גשר היסטורי', 'בנק / מסחר', 'מרכז קליטה', 'משרד ציבורי', 'בית מלון', 'גן ילדים', 'מגדל ניווט', 'אנדרטה', 'פארק ואנדרטה', 'דיור', 'מוסד ציבורי', 'מתחם תעסוקה היסטורי', 'בית עלמין', 'מתחם ציבורי'],
  'תרבותי': ['בית כנסת', 'מרכז מסחרי', 'שוק'],
  'טבע ונוף': ['פארק', 'גנון / שדרה', 'עץ לשימור', 'מרינה ופארק'],
};

export const CATEGORY_COLORS: Record<Category, string> = {
  'ארכאולוגי': '#8B3A1E',
  'היסטורי': '#1B6B7D',
  'תרבותי': '#D4922A',
  'טבע ונוף': '#4A5C45',
};

export const CATEGORIES = Object.keys(CATEGORY_TYPES) as Category[];

export function categoryOf(b: Building): Category {
  const t = b.building_type ?? b.style ?? '';
  for (const c of CATEGORIES) {
    if (CATEGORY_TYPES[c].includes(t)) return c;
  }
  return 'היסטורי';
}

export const PROTECTION_COLORS: Record<string, string> = {
  'א': '#8B3A1E',
  'ב': '#D4922A',
  'ג': '#7A9174',
  'מונומנט': '#1B2A4A',
};

export type ColorBy = 'category' | 'protection' | 'status';

export const COLOR_BY_LABELS: Record<ColorBy, string> = {
  category: 'קטגוריה',
  protection: 'רמת שימור',
  status: 'סטטוס תיעוד',
};

export function markerColor(b: Building, by: ColorBy): string {
  if (by === 'category') return CATEGORY_COLORS[categoryOf(b)];
  if (by === 'protection') return PROTECTION_COLORS[b.protection_level ?? ''] ?? '#8B7355';
  return STATUS_COLORS[b.status];
}

export function legendFor(by: ColorBy): { label: string; color: string }[] {
  if (by === 'category') return CATEGORIES.map(c => ({ label: c, color: CATEGORY_COLORS[c] }));
  if (by === 'protection') return ['א', 'ב', 'ג'].map(l => ({ label: `שימור ${l}׳`, color: PROTECTION_COLORS[l] }));
  return (Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map(s => ({ label: STATUS_LABELS[s], color: STATUS_COLORS[s] }));
}

/** חיפוש חופשי בעברית: שם, כתובת, שכונה, סוג, תיאור */
export function matchesQuery(b: Building, q: string): boolean {
  const needle = q.trim();
  if (!needle) return true;
  return [b.name, b.address, b.neighborhood, b.building_type, b.full_description, b.city_registry_id]
    .some(v => v?.includes(needle));
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

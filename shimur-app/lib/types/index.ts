export type UserRole = 'architect' | 'reviewer' | 'manager';

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  license_number?: string;
  license_expiry?: string;
  id_number?: string;
  created_at: string;
}

export type BuildingStatus = 'לא_התחיל' | 'בתהליך' | 'הוגש' | 'אושר' | 'הוחזר';
export type ProtectionLevel = 'א' | 'ב' | 'ג' | 'מונומנט';
export type FileType = 'מבנה' | 'מתחם';

export interface Building {
  id: string;
  city_registry_id: string;
  registry_card_number?: string;
  name: string;
  address: string;
  neighborhood?: string;
  taba?: string;
  parcel?: string;
  is_complex: boolean;
  lat?: number;
  lng?: number;
  elevation?: number;
  geocoded_at?: string;
  year_built?: number;
  year_built_source?: string;
  year_built_verified: boolean;
  architect?: string;
  architect_source?: string;
  architect_verified: boolean;
  style?: string;
  historical_periods?: string[];
  protection_level?: ProtectionLevel;
  protection_source?: string;
  floors?: number;
  total_built_area?: number;
  lot_area?: number;
  construction_type?: string;
  documentation_reason?: string;
  initiator?: string;
  owner?: string;
  current_use?: string;
  original_use?: string;
  surveyor?: string;
  surveyor_license?: string;
  surveyor_date?: string;
  statutory_plans?: any[];
  historical_maps?: any[];
  // שדות נוספים לאתרי שימור אשדוד
  building_type?: string;
  preservation_reasons?: string[];
  priority_level?: string;
  full_description?: string;
  status: BuildingStatus;
  assigned_architect?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentationFile {
  id: string;
  building_id: string;
  file_type: FileType;
  version: number;
  phase: 'ארכיון' | 'סיור' | 'מדידות' | 'חומרים' | 'כתיבה' | 'הגשה';
  completion_pct: number;
  submitted_at?: string;
  approved_at?: string;
  approved_by?: string;
  reviewer_notes?: string;
  return_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const STATUS_COLORS: Record<BuildingStatus, string> = {
  'לא_התחיל': '#8B7355',
  'בתהליך': '#C4582A',
  'הוגש': '#4A5C45',
  'אושר': '#1A1410',
  'הוחזר': '#8B3A1E',
};

export const STATUS_LABELS: Record<BuildingStatus, string> = {
  'לא_התחיל': 'לא התחיל',
  'בתהליך': 'בתהליך',
  'הוגש': 'הוגש לאישור',
  'אושר': 'אושר',
  'הוחזר': 'הוחזר לעדכון',
};

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
/** committee_2016: ברשימת הוועדה · texture: מרקם או סביבה · archaeology: אתר עתיק (לפני 1700) · added_by_plan: נוסף מתכנית מאושרת */
export type ListStatus = 'committee_2016' | 'texture' | 'archaeology' | 'added_by_plan';

export const LIST_STATUS_LABELS: Record<ListStatus, string> = {
  committee_2016: 'ברשימת הוועדה',
  texture: 'מרקם או סביבה',
  archaeology: 'אתר ארכאולוגי',
  added_by_plan: 'נוסף מתכנית מאושרת',
};

export const LIST_STATUS_NOTES: Record<ListStatus, string> = {
  committee_2016: 'אתר ממוספר ברשימה שאישרה הוועדה לשימור אתרים בישיבה 201601 (17.8.2016).',
  texture: 'מרקם עירוני, נוף או סביבה שהוועדה כללה בשימור, בלי מספר ברשימה.',
  archaeology: 'אתר עתיק מלפני 1700, באחריות רשות העתיקות. אינו "אתר לשימור" לפי התוספת הרביעית לחוק.',
  added_by_plan: 'אתר שנוסף לשימור בתכנית מאושרת אחרי החלטת הוועדה.',
};

export interface Building {
  /** מספר אתר (site_no) — משמש בכתובות /buildings/[id] */
  id: string;
  db_id?: string;
  image_url?: string;
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
  // שדות נוספים לאתרי שימור אשדוד
  building_type?: string;
  preservation_reasons?: string[];
  priority_level?: string;
  full_description?: string;
  iaa_reference?: string;
  gov_sources?: string[];
  additional_info?: string;
  // שדות רשימת הוועדה (2016) — כולם אופציונליים
  /** המספר ברשימת הוועדה ("1" עד "21"), ריק לאתר שאינו ממוספר */
  committee_no?: string;
  list_status?: ListStatus;
  /** תב"ע או תמ"ל שמגנים על האתר */
  statutory_ref?: string;
  /** המיקום משוער (מרכז אזור), לא נקודה מדויקת */
  coords_approx?: boolean;
  /** הערה כשהמקורות סותרים — מוצגת כתגית "לאימות" */
  data_conflict?: string;
  /** רכיבים בתוך אתר מורכב */
  components?: string[];
  risk_note?: string;
  /** הערה על מקור הדרגה והעדיפות */
  grade_note?: string;
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

export interface Route {
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  cover_image_url: string | null;
  created_by: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  sites?: RouteSite[];
}

export interface RouteSite {
  id: string;
  route_id: string;
  building_id: string;
  position: number;
  narrative_text: string | null;
  building?: Building;
}

export const STATUS_LABELS: Record<BuildingStatus, string> = {
  'לא_התחיל': 'לא התחיל',
  'בתהליך': 'בתהליך',
  'הוגש': 'הוגש לאישור',
  'אושר': 'אושר',
  'הוחזר': 'הוחזר לעדכון',
};

export interface HistoricalMap {
  id: string;
  title: string;
  url: string;
  year: string | null;
  description: string | null;
  /** [[south, west], [north, east]] */
  bounds: [[number, number], [number, number]];
}

export type DocumentKind = 'link' | 'note' | 'image';

export interface SiteDocument {
  id: string;
  kind: DocumentKind;
  title: string;
  url: string | null;
  note: string | null;
  /** מספר האתר (Building.id) או null למסמך כללי */
  building_id: string | null;
  created_at: string;
}

export type DataSource = 'db' | 'demo';

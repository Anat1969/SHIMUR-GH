// מייצר SQL למאגר מתוך lib/demo/buildings.ts — מקור אחד לנתוני הגיבוי ולמאגר.
// הרצה: node --experimental-strip-types scripts/gen-sites-sql.mts [מספר-אתר-ראשון | רשימת-מספרים]
// בלי ארגומנט: כל האתרים. מספר אחד: אתרים ממספר זה והלאה. רשימה מופרדת בפסיקים (14,17): רק האתרים האלה.
import { DEMO_BUILDINGS } from '../lib/demo/buildings.ts';

const arg = process.argv[2] ?? '0';
const only = arg.includes(',') ? new Set(arg.split(',').map(Number)) : null;
const minId = only ? 0 : Number(arg);
const cols = ['site_no', 'city_registry_id', 'name', 'address', 'neighborhood', 'parcel', 'is_complex', 'lat', 'lng', 'year_built', 'year_built_verified', 'architect', 'architect_verified', 'style', 'historical_periods', 'protection_level', 'documentation_reason', 'owner', 'current_use', 'building_type', 'preservation_reasons', 'priority_level', 'full_description', 'additional_info', 'iaa_reference', 'gov_sources', 'committee_no', 'list_status', 'statutory_ref', 'coords_approx', 'data_conflict', 'components', 'risk_note', 'grade_note'];
const arrCols = new Set(['historical_periods', 'preservation_reasons', 'gov_sources', 'components']);
const boolCols = new Set(['is_complex', 'year_built_verified', 'architect_verified', 'coords_approx']);

const q = (v: unknown): string => {
  if (v === undefined || v === null) return 'NULL';
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.length ? `ARRAY[${v.map(q).join(',')}]::text[]` : `'{}'::text[]`;
  const s = String(v);
  // כלי ה-SQL של Supabase נתקע על נקודה-פסיק בתוך מחרוזת
  if (s.includes(';')) throw new Error(`נקודה-פסיק בטקסט: ${s}`);
  return `'${s.replace(/'/g, "''")}'`;
};

const rows = DEMO_BUILDINGS.filter(b => (only ? only.has(Number(b.id)) : Number(b.id) >= minId)).map(b => {
  const r = b as unknown as Record<string, unknown>;
  return '(' + cols.map(c => {
    const v = c === 'site_no' ? Number(b.id) : r[c];
    if (v === undefined && arrCols.has(c)) return `'{}'::text[]`;
    if (v === undefined && boolCols.has(c)) return 'false';
    return q(v);
  }).join(', ') + ')';
});

const upd = cols.filter(c => c !== 'site_no').map(c => `${c} = EXCLUDED.${c}`).join(', ');
console.log(`INSERT INTO shimur_buildings (${cols.join(', ')}) VALUES
${rows.join(',\n')}
ON CONFLICT (site_no) DO UPDATE SET ${upd}, updated_at = now();`);

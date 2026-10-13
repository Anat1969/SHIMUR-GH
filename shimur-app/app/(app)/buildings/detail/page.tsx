import { DetailTable } from '@/components/buildings/DetailTable';
import { getSites } from '@/lib/data';
import type { Building } from '@/lib/types';
import { LIST_STATUS_LABELS } from '@/lib/types';
import { PrintButton } from '@/components/PrintButton';
import { ListViews } from '@/components/buildings/ListViews';
import { SOURCE_CREDIT } from '@/lib/clusters';

export default async function DetailPage() {
  const { sites } = await getSites();
  return (
    <div className="space-y-6">
      <ListViews current="register" />
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="max-w-3xl">
          <p className="text-sm mb-1" style={{ color: 'var(--navy-soft)' }}>לוועדה ולמסמכים</p>
          <h1 className="text-3xl font-serif font-bold text-ink mb-2">פירוט אתרים — המרשם</h1>
          <p className="text-ink-soft">
            רשימת השימור של אשדוד כפי שהיא מופיעה בטבלאות הוועדה: {sites.length} אתרים, מקובצים לפי מקבץ עירוני,
            עם כתובת, גוש/חלקה, בעלים וטעמי שימור. אפשר להרחיב לכל 14 העמודות, לייצא לגיליון ולהדפיס.
          </p>
          <p className="text-xs mt-2 text-ink-soft print-only">{SOURCE_CREDIT}</p>
        </div>
        <div className="flex gap-2 items-center no-print">
          <PrintButton label="הדפסה" />
          <a
            href={`data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(buildCsv(sites))}`}
            download="אתרי_שימור_אשדוד.csv"
            className="px-5 py-2.5 border rounded-lg text-sm font-medium"
            style={{ borderColor: '#C8B89A', color: '#8B7355', backgroundColor: 'white' }}
          >
            ייצוא לגיליון (CSV)
          </a>
        </div>
      </div>

      <DetailTable buildings={sites} />
    </div>
  );
}

function buildCsv(sites: Building[]): string {
  const headers = ['מס׳','מס׳ בוועדה','מעמד ברשימה','שם','כתובת','שכונה','סוג','תקופה','בעלות','סיבות שימור','סטטוס קיים','עדיפות','רמת שימור','חלקה','תיאור','לאימות'];
  const rows = sites.map(b => [
    b.city_registry_id,
    b.committee_no ?? '',
    b.list_status ? LIST_STATUS_LABELS[b.list_status] : '',
    b.name,
    b.address,
    b.neighborhood ?? '',
    b.building_type ?? b.style ?? '',
    (b.historical_periods ?? []).join('; '),
    b.owner ?? '',
    (b.preservation_reasons ?? []).join('; '),
    b.current_use ?? '',
    b.priority_level ?? '',
    b.protection_level ?? '',
    b.parcel ?? '',
    (b.full_description ?? b.documentation_reason ?? '').replace(/,/g, '؛'),
    b.data_conflict ? `לאימות: ${b.data_conflict}` : '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

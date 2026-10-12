import { DetailTable } from '@/components/buildings/DetailTable';
import { getSites } from '@/lib/data';
import type { Building } from '@/lib/types';
import { PrintButton } from '@/components/PrintButton';

export default async function DetailPage() {
  const { sites } = await getSites();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">פירוט מבנים — אתרי שימור אשדוד</h1>
          <p className="text-ink-soft">{sites.length} אתרים | ועדת השימור העירונית</p>
        </div>
        <div className="flex gap-3 items-center no-print">
          <PrintButton label="הדפסה" />
          <a
            href={`data:text/csv;charset=utf-8,%EF%BB%BF${encodeURIComponent(buildCsv(sites))}`}
            download="אתרי_שימור_אשדוד.csv"
            className="px-5 py-2 border rounded-md text-sm font-medium"
            style={{ borderColor: '#C8B89A', color: '#8B7355' }}
          >
            ייצוא CSV
          </a>
        </div>
      </div>

      <DetailTable buildings={sites} />
    </div>
  );
}

function buildCsv(sites: Building[]): string {
  const headers = ['מס׳','שם','כתובת','שכונה','סוג','תקופה','בעלות','סיבות שימור','סטטוס קיים','עדיפות','רמת שימור','חלקה','תיאור'];
  const rows = sites.map(b => [
    b.city_registry_id,
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
  ].map(v => `"${v}"`).join(','));
  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

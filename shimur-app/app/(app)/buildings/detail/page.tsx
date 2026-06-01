import { DetailTable } from '@/components/buildings/DetailTable';
import { DEMO_BUILDINGS } from '@/lib/demo/buildings';
import { PrintButton } from '@/components/PrintButton';

export default function DetailPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">פירוט מבנים — אתרי שימור אשדוד</h1>
          <p className="text-ink-soft">{DEMO_BUILDINGS.length} אתרים | ועדת השימור העירונית 2016</p>
        </div>
        <div className="flex gap-3 items-center no-print">
          <PrintButton label="הדפסה" />
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(buildCsv())}`}
            download="אתרי_שימור_אשדוד.csv"
            className="px-5 py-2 border rounded-md text-sm font-medium"
            style={{ borderColor: '#C8B89A', color: '#8B7355' }}
          >
            ייצוא CSV
          </a>
        </div>
      </div>

      <DetailTable buildings={DEMO_BUILDINGS} />
    </div>
  );
}

function buildCsv(): string {
  const headers = ['מס׳','שם','כתובת','שכונה','סוג','תקופה','בעלות','סיבות שימור','סטטוס קיים','עדיפות','רמת שימור','חלקה','תיאור'];
  const rows = DEMO_BUILDINGS.map(b => [
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

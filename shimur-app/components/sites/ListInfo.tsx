import type { Building, ListStatus } from '@/lib/types';
import { LIST_STATUS_LABELS, LIST_STATUS_NOTES } from '@/lib/types';

export const LIST_STATUS_COLORS: Record<ListStatus, string> = {
  committee_2016: '#1B2A4A',
  texture: '#4A5C45',
  archaeology: '#8B3A1E',
  added_by_plan: '#D4922A',
};

/** צורת רבים לטקסט דינמי ("2 אתרים ארכאולוגיים") */
export const LIST_STATUS_NOTES_SHORT: Record<ListStatus, string> = {
  committee_2016: 'אתרים ברשימת הוועדה',
  texture: 'מרקמים עירוניים וסביבות',
  archaeology: 'אתרים ארכאולוגיים',
  added_by_plan: 'אתרים שנוספו מתכניות מאושרות',
};

const UNVERIFIED = 'לאימות';

/** רשומה שיש בה סתירה בין מקורות, ערך "לאימות" או מיקום משוער */
export function needsVerification(b: Building): boolean {
  if (b.data_conflict) return true;
  return [b.owner, b.documentation_reason, b.address, b.parcel].some(v => v?.includes(UNVERIFIED) || v?.includes('?'));
}

export function VerifyTag({ site, className = '' }: { site: Building; className?: string }) {
  if (!needsVerification(site)) return null;
  return (
    <span
      title={site.data_conflict ?? 'יש בשדה אחד לפחות ערך שטרם אומת מול מקור'}
      className={`inline-block align-middle whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-bold ${className}`}
      style={{ backgroundColor: '#FBEFD9', color: '#8B3A1E', border: '1px solid #E8C48A' }}
    >
      לאימות
    </span>
  );
}

export function ListStatusBadge({ status }: { status?: ListStatus }) {
  if (!status) return null;
  return (
    <span className="inline-block whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-semibold text-white" style={{ backgroundColor: LIST_STATUS_COLORS[status] }}>
      {LIST_STATUS_LABELS[status]}
    </span>
  );
}

/** מקרא ל-list_status — מה כל סוג אומר */
export function ListStatusLegend({ counts }: { counts?: Partial<Record<ListStatus, number>> }) {
  return (
    <dl className="grid sm:grid-cols-2 gap-3">
      {(Object.keys(LIST_STATUS_LABELS) as ListStatus[]).map(s => (
        <div key={s} className="flex gap-3 items-start">
          <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: LIST_STATUS_COLORS[s] }} aria-hidden="true" />
          <div>
            <dt className="text-sm font-bold" style={{ color: 'var(--navy)' }}>
              {LIST_STATUS_LABELS[s]}{counts ? ` (${counts[s] ?? 0})` : ''}
            </dt>
            <dd className="text-xs leading-relaxed" style={{ color: 'var(--navy-soft)' }}>{LIST_STATUS_NOTES[s]}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/** פרטי רשימת הוועדה בדף האתר. לא מוצג כלום אם אין נתונים. */
export function CommitteeDetails({ site }: { site: Building }) {
  const rows: [string, string][] = [];
  if (site.committee_no) rows.push(['מספר ברשימת הוועדה', site.committee_no]);
  if (site.list_status) rows.push(['מעמד ברשימה', `${LIST_STATUS_LABELS[site.list_status]} — ${LIST_STATUS_NOTES[site.list_status]}`]);
  if (site.parcel) rows.push(['גוש/חלקה', site.parcel]);
  if (site.owner) rows.push(['בעלים', site.owner]);
  if (site.statutory_ref) rows.push(['הגנה סטטוטורית', site.statutory_ref]);
  if (site.components?.length) rows.push(['רכיבי האתר', site.components.join(' · ')]);
  if (site.grade_note) rows.push(['דרגה ועדיפות', site.grade_note]);
  if (site.coords_approx) rows.push(['מיקום במפה', 'משוער — מרכז האזור, לא נקודה מדויקת'] );
  if (!rows.length && !site.data_conflict && !site.risk_note) return null;

  return (
    <section className="glass-card p-6 space-y-4" aria-labelledby="committee-details">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="committee-details" className="text-lg font-serif font-bold" style={{ color: 'var(--navy)' }}>ברשימת השימור</h2>
        <ListStatusBadge status={site.list_status} />
        <VerifyTag site={site} />
      </div>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-semibold" style={{ color: 'var(--navy-soft)' }}>{k}</dt>
            <dd className="text-sm" style={{ color: 'var(--navy)' }}>{v}</dd>
          </div>
        ))}
      </dl>
      {site.data_conflict && (
        <p className="text-sm rounded-lg p-3" style={{ backgroundColor: '#FBEFD9', color: 'var(--ink-soft)', border: '1px solid #E8C48A' }}>
          <strong>לאימות — המקורות סותרים: </strong>{site.data_conflict}
        </p>
      )}
      {site.risk_note && (
        <p className="text-sm rounded-lg p-3" style={{ backgroundColor: 'var(--parchment-deep)', color: 'var(--ink-soft)', border: '1px solid var(--stone)' }}>
          <strong>סיכון ידוע: </strong>{site.risk_note}
        </p>
      )}
    </section>
  );
}

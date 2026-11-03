// Field finding extras (2026-11-03, Claude-GH docs/tools-bank.md, the field tour first built in SignAshdod-GH):
// urgency in one tap and the phone's location, added as lines at the end of the finding's notes, so nothing in the
// schema changes ("בלי להרוס, רק להוסיף") and the text stays readable as is.

export const URGENCY = [
  { key: 'record', label: 'לתיעוד בלבד', hint: 'מצב תקין, לתיק', color: 'var(--sage)' },
  { key: 'watch', label: 'מעקב', hint: 'לחזור ולבדוק', color: 'var(--stone-dark)' },
  { key: 'repair', label: 'נדרש תיקון', hint: 'פגיעה שמתקדמת', color: 'var(--rust-light)' },
  { key: 'danger', label: 'סכנה מיידית', hint: 'קריסה, נפילה, סכנה לציבור', color: 'var(--rust)' },
] as const;

export interface Loc { lat: number; lng: number; acc: number }

/** Where the phone is, with its own accuracy. Null when refused or unavailable, never throws. */
export function locate(timeout = 10000): Promise<Loc | null> {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 30000 },
    );
  });
}

export const mapUrl = (l: Pick<Loc, 'lat' | 'lng'>) => `https://www.google.com/maps?q=${l.lat},${l.lng}`;

export function withExtras(notes: string, urgency: string, loc: Loc | null, street = ''): string {
  return [
    notes.trim(),
    urgency ? `דחיפות: ${urgency}` : '',
    street ? `רחוב: ${street}` : '',
    loc ? `מיקום: ${loc.lat.toFixed(5)},${loc.lng.toFixed(5)} (דיוק ${loc.acc} מ')` : '',
  ].filter(Boolean).join('\n');
}

export function readExtras(notes = '') {
  const lines = notes.split(/\r?\n/); // a form post turns line breaks into CRLF
  const get = (p: string) => lines.find(l => l.startsWith(p))?.slice(p.length).trim() ?? '';
  const m = get('מיקום:').match(/^(-?\d+\.\d+),(-?\d+\.\d+) \(דיוק (\d+)/);
  return {
    text: lines.filter(l => !l.startsWith('דחיפות:') && !l.startsWith('מיקום:') && !l.startsWith('רחוב:')).join('\n').trim(),
    street: get('רחוב:'),
    urgency: URGENCY.find(u => u.label === get('דחיפות:')),
    loc: m ? { lat: +m[1], lng: +m[2], acc: +m[3] } : null,
  };
}

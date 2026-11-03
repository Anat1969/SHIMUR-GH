'use client';

import { useEffect, useState } from 'react';
import qrcode from 'qrcode-generator';

/** From the computer to the phone: the same page as a QR code. Shown on wide screens only; on a phone it has no use. */
export default function PhoneQR({ what }: { what: string }) {
  const [svg, setSvg] = useState('');
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = location.href.split('#')[0];
    const q = qrcode(0, 'M');
    q.addData(u);
    q.make();
    setUrl(u);
    setSvg(q.createSvgTag({ cellSize: 4, margin: 1, scalable: true }));
  }, []);
  if (!svg) return null;
  return (
    <aside className="phone-qr hidden lg:grid grid-cols-[96px_1fr] gap-4 items-center p-4 rounded-[10px]"
      style={{ backgroundColor: 'var(--surface-solid)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-soft)' }}>
      <div className="phone-qr-code bg-white p-1" aria-label={`קוד QR ל${what} בטלפון`} dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="space-y-1">
        <p className="text-sm" style={{ color: 'var(--sage)' }}>בטלפון, באתר עצמו</p>
        <p className="font-serif font-bold" style={{ color: 'var(--navy)' }}>סורקים את הקוד ומתעדים מהשטח.</p>
        <p className="text-sm" style={{ color: 'var(--navy-soft)' }}>התמונה מוקטנת בטלפון, והמיקום נקלט עם הצילום.</p>
        <p className="text-xs break-all" dir="ltr" style={{ color: 'var(--navy-soft)' }}>{url}</p>
      </div>
    </aside>
  );
}

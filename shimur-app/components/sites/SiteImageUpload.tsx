'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/supabase/browser';
import { useEditor } from '@/components/providers/Editor';

const MAX_EDGE = 1600;

/** הקטנה בדפדפן לפני העלאה: הצלע הארוכה עד 1600px, JPEG באיכות 0.86 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise(resolve => canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.86));
}

type Status = { kind: 'idle' } | { kind: 'busy'; text: string } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

/**
 * העלאת תמונות לאתר: גרירה, הדבקה (Ctrl+V בכל מקום בדף) או בחירת קובץ.
 * נשמר מיד במאגר הציבורי, והתמונה מופיעה בכל מקום שהאתר מוצג.
 */
export function SiteImageUpload({ siteId, siteName, hasImage }: { siteId: string; siteName: string; hasImage: boolean }) {
  const { isEditor } = useEditor();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [primary, setPrimary] = useState(!hasImage);
  const [over, setOver] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => { setPrimary(!hasImage); }, [hasImage]);

  const upload = useCallback(async (files: File[]) => {
    const images = files.filter(f => f.type.startsWith('image/'));
    if (!images.length) { setStatus({ kind: 'error', text: 'לא נמצאה תמונה. גררי, הדביקי או בחרי קובץ JPG או PNG.' }); return; }
    let placedPrimary = false;
    for (const [i, f] of images.entries()) {
      setStatus({ kind: 'busy', text: images.length > 1 ? `מעלה תמונה ${i + 1} מתוך ${images.length}…` : 'מעלה ושומרת…' });
      const body = new FormData();
      body.set('site', siteId);
      body.set('title', siteName);
      // רק התמונה הראשונה בקבוצה יכולה להפוך לראשית
      body.set('primary', primary && i === 0 ? '1' : '0');
      try {
        body.set('file', new File([await shrink(f)], 'photo.jpg', { type: 'image/jpeg' }));
      } catch {
        setStatus({ kind: 'error', text: `לא ניתן לקרוא את הקובץ "${f.name}". נסי לשמור אותו כ-JPG ולהעלות שוב.` });
        return;
      }
      const res = await apiFetch('/api/site-images', { method: 'POST', body }).catch(() => null);
      const json = res ? await res.json().catch(() => ({})) : {};
      if (!res?.ok) { setStatus({ kind: 'error', text: json.error ?? 'אין חיבור לשרת. בדקי את הרשת ונסי שוב.' }); return; }
      if (json.placed === 'primary') placedPrimary = true;
    }
    setStatus({ kind: 'ok', text: placedPrimary ? 'נשמר. התמונה הראשית מוצגת עכשיו בכל האפליקציה.' : 'נשמר בגלריה של האתר.' });
    setPrimary(false);
    router.refresh();
  }, [siteId, siteName, primary, router]);

  // הדבקה מכל מקום בדף, כל עוד לא מקלידים בשדה טקסט
  useEffect(() => {
    if (!isEditor) return;
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (!files.length) return;
      e.preventDefault();
      upload(files);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [isEditor, upload]);

  if (!isEditor) return null;
  const busy = status.kind === 'busy';

  return (
    <section aria-label="העלאת תמונות לאתר" className="no-print rounded-[10px] p-4 sm:p-5 transition-colors"
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); upload(Array.from(e.dataTransfer.files)); }}
      style={{
        border: `1.5px dashed ${over ? 'var(--navy)' : 'var(--stone)'}`,
        backgroundColor: over ? 'rgba(255,255,255,0.85)' : 'var(--surface)',
      }}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <p className="font-semibold" style={{ color: 'var(--navy)' }}>
            {over ? 'שחררי כאן להעלאה' : 'הוספת תמונה: גררי לכאן, הדביקי (Ctrl+V) או בחרי קובץ'}
          </p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--navy-soft)' }}>
            מומלץ: צילום לרוחב ביחס 3:2, לפחות 1600 על 1067 פיקסלים, JPG. הנושא במרכז, כי בתמונות הקטנות היא נחתכת לריבוע. התמונה מוקטנת אוטומטית ונשמרת מיד במאגר הציבורי.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap" style={{ color: 'var(--navy)' }}>
          <input type="checkbox" checked={primary} onChange={e => setPrimary(e.target.checked)} className="w-4 h-4" />
          קביעה כתמונה ראשית
        </label>
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="px-6 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--navy)' }}>
          {busy ? 'מעלה…' : 'בחירת קובץ'}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
          onChange={e => { upload(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </div>
      {status.kind !== 'idle' && (
        <p role={status.kind === 'error' ? 'alert' : 'status'} className="text-sm mt-3"
          style={{ color: status.kind === 'error' ? 'var(--rust)' : status.kind === 'ok' ? 'var(--sage)' : 'var(--navy-soft)' }}>
          {status.text}
        </p>
      )}
    </section>
  );
}

/** כפתור "קביעה כראשית" על תמונה בגלריה, לעורכת בלבד */
export function MakePrimaryButton({ siteId, url }: { siteId: string; url: string }) {
  const { isEditor } = useEditor();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isEditor) return null;
  return (
    <>
      <button type="button" disabled={busy}
        onClick={async () => {
          setBusy(true); setError(null);
          const res = await apiFetch('/api/site-images', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: siteId, url }) }).catch(() => null);
          const json = res ? await res.json().catch(() => ({})) : {};
          setBusy(false);
          if (!res?.ok) { setError(json.error ?? 'אין חיבור לשרת. נסי שוב.'); return; }
          router.refresh();
        }}
        className="mt-1 w-full px-2 py-1.5 rounded-md text-xs font-semibold disabled:opacity-60"
        style={{ border: '1px solid var(--stone)', color: 'var(--navy)', backgroundColor: 'var(--surface-solid)' }}>
        {busy ? 'מעדכנת…' : 'קביעה כראשית'}
      </button>
      {error && <span role="alert" className="block text-[11px] mt-1" style={{ color: 'var(--rust)' }}>{error}</span>}
    </>
  );
}

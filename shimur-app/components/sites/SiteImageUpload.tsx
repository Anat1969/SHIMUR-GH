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

  // גרירה לכל מקום בדף: שכבה עדינה מופיעה רק בזמן הגרירה
  useEffect(() => {
    if (!isEditor) return;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const onOver = (e: DragEvent) => { if (hasFiles(e)) { e.preventDefault(); setOver(true); } };
    const onLeave = (e: DragEvent) => { if (!e.relatedTarget) setOver(false); };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault(); setOver(false);
      upload(Array.from(e.dataTransfer?.files ?? []));
    };
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);
    return () => { window.removeEventListener('dragover', onOver); window.removeEventListener('dragleave', onLeave); window.removeEventListener('drop', onDrop); };
  }, [isEditor, upload]);

  if (!isEditor) return null;
  const busy = status.kind === 'busy';
  const muted = { color: 'var(--navy-soft)' };

  // כלי עבודה, לא תוכן: שורה אחת קטנה ושקטה מתחת לתמונה
  return (
    <div aria-label="הוספת תמונות לאתר" className="no-print flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={muted}>
      <button type="button" onClick={() => input.current?.click()} disabled={busy}
        className="underline underline-offset-2 hover:no-underline disabled:opacity-60" style={{ color: 'var(--navy)' }}>
        {busy ? 'מעלה…' : 'הוספת תמונה'}
      </button>
      <span>או גרירה / הדבקה (Ctrl+V) לדף</span>
      <label className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <input type="checkbox" checked={primary} onChange={e => setPrimary(e.target.checked)} className="w-3.5 h-3.5" />
        כתמונה ראשית
      </label>
      <details className="relative">
        <summary className="cursor-pointer select-none hover:underline">מפרט</summary>
        <p className="absolute z-20 mt-1 w-64 p-3 rounded-[10px] leading-relaxed" style={{ backgroundColor: 'var(--surface-solid)', border: '1px solid var(--hairline)', boxShadow: 'var(--shadow-soft)', color: 'var(--ink-soft)' }}>
          צילום לרוחב, יחס 3:2, לפחות 1600 על 1067 פיקסלים, JPG.
          <br />הנושא במרכז, כי בתמונות הקטנות היא נחתכת לריבוע.
          <br />מוקטנת אוטומטית ונשמרת מיד.
        </p>
      </details>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
        onChange={e => { upload(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      {status.kind !== 'idle' && (
        <span role={status.kind === 'error' ? 'alert' : 'status'} className="w-full sm:w-auto"
          style={{ color: status.kind === 'error' ? 'var(--rust)' : status.kind === 'ok' ? 'var(--sage)' : 'var(--navy-soft)' }}>
          {status.text}
        </span>
      )}
      {over && (
        <div className="fixed inset-3 z-[1400] pointer-events-none rounded-[10px] flex items-center justify-center"
          style={{ border: '1.5px dashed var(--navy)', backgroundColor: 'rgba(247,240,227,0.75)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>שחררי כאן כדי להוסיף את התמונה לאתר</span>
        </div>
      )}
    </div>
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
        className="text-[11px] underline underline-offset-2 hover:no-underline disabled:opacity-60"
        style={{ color: 'var(--navy-soft)' }}>
        {busy ? 'מעדכנת…' : 'כראשית'}
      </button>
      {error && <span role="alert" className="block text-[11px] mt-1" style={{ color: 'var(--rust)' }}>{error}</span>}
    </>
  );
}

/**
 * הסרת תמונה לא רצויה, לעורכת בלבד, עם אישור בלחיצה שנייה.
 * התמונה לא נמחקת מהמאגר: היא מוסתרת ואפשר לשחזר אותה.
 */
export function RemoveImageButton({ siteId, url, label = 'הסרה', tone = 'light' }: {
  siteId: string; url: string; label?: string; tone?: 'light' | 'dark';
}) {
  const { isEditor } = useEditor();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!isEditor) return null;

  const remove = async () => {
    setBusy(true); setError(null);
    const res = await apiFetch('/api/site-images', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: siteId, url }) }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) { setError(json.error ?? 'אין חיבור לשרת. נסי שוב.'); return; }
    setConfirming(false);
    router.refresh();
  };

  const dark = tone === 'dark';
  // שקט עד שנוגעים: טקסט קטן, בלי מסגרת. רק שלב האישור מודגש.
  const base = 'text-[11px] whitespace-nowrap disabled:opacity-60';
  const quiet = dark
    ? { color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(27,42,74,0.45)', padding: '2px 8px', borderRadius: 6 }
    : { color: 'var(--navy-soft)', textDecoration: 'underline', textUnderlineOffset: 2 };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className={base} style={quiet}>{label}</button>
      ) : (
        <>
          <button type="button" onClick={remove} disabled={busy} className={base} style={{ backgroundColor: 'var(--rust)', color: 'white', padding: '2px 8px', borderRadius: 6 }}>
            {busy ? 'מסירה…' : 'כן, להסיר'}
          </button>
          <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={base} style={quiet}>ביטול</button>
        </>
      )}
      {error && <span role="alert" className="block w-full text-[11px]" style={{ color: dark ? 'white' : 'var(--rust)' }}>{error}</span>}
    </span>
  );
}

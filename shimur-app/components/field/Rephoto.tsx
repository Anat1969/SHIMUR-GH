'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Rephotography (2026-11-03, Claude-GH docs/tools-bank.md, tool "רפוטוגרפיה"): the earlier photo lies half-transparent
 * over the live camera, so the new one is taken from the same point and angle, and the change between the two is real.
 * The method is the one used in landscape and heritage monitoring. Closes with X, Esc or "חזרה לתיעוד".
 */
export default function Rephoto({ ghost, date, onShot, onClose }: { ghost: string; date: string; onShot: (f: File) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(50);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let live = true;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 } }, audio: false });
        if (!live) return stream.getTracks().forEach(t => t.stop());
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
          setReady(true);
        }
      } catch {
        setError('המצלמה לא נפתחה. צריך לאשר גישה למצלמה בדפדפן, או לצלם רגיל ב"צלם או בחר תמונה".');
      }
    })();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', key);
    return () => { live = false; removeEventListener('keydown', key); stream?.getTracks().forEach(t => t.stop()); };
  }, [onClose]);

  const shoot = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const k = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight)); // same 1600px as every upload in this app
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * k);
    c.height = Math.round(v.videoHeight * k);
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(b => b && onShot(new File([b], `rephoto-${Date.now()}.jpg`, { type: 'image/jpeg' })), 'image/jpeg', 0.86);
  };

  return (
    <div className="rephoto fixed inset-0 z-[3000] flex flex-col" style={{ backgroundColor: '#1A1410' }} role="dialog" aria-modal aria-label="צילום חוזר מאותה נקודה">
      <div className="flex items-center justify-between p-3 text-white">
        <div>
          <p className="text-sm font-semibold">צילום חוזר מאותה נקודה</p>
          <p className="text-xs opacity-80">מיישרים את המצלמה עם התמונה מ-{date}, ומצלמים.</p>
        </div>
        <button onClick={onClose} aria-label="סגירה" className="px-3 py-2 text-lg leading-none rounded-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>X</button>
      </div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <video ref={video} playsInline muted className="absolute inset-0 w-full h-full object-contain" />
        {/* the earlier photo, over the camera */}
        <img src={ghost} alt="" className="rephoto-ghost absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ opacity: opacity / 100 }} />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
            <p role="alert" className="max-w-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 text-white" style={{ backgroundColor: 'rgba(26,20,16,0.9)' }}>
        <label className="flex items-center gap-3 text-sm">
          <span className="whitespace-nowrap">התמונה הקודמת</span>
          <input type="range" min={0} max={100} value={opacity} onChange={e => setOpacity(+e.target.value)} className="flex-1" aria-label="שקיפות התמונה הקודמת" />
          <span className="w-10 text-start tabular-nums">{opacity}%</span>
        </label>
        <div className="flex gap-2">
          <button onClick={shoot} disabled={!ready} className="rephoto-shoot flex-1 py-4 rounded-[10px] text-base font-bold disabled:opacity-50" style={{ backgroundColor: 'white', color: 'var(--sage)' }}>
            צילום
          </button>
          <button onClick={onClose} className="px-5 py-4 rounded-[10px] text-sm" style={{ border: '1px solid rgba(255,255,255,0.5)' }}>
            חזרה לתיעוד
          </button>
        </div>
      </div>
    </div>
  );
}

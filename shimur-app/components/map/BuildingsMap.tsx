'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Building, HistoricalMap } from '@/lib/types';
import { ColorBy, markerColor, escapeHtml } from '@/lib/sites';

export type Basemap = 'streets' | 'satellite';

export interface OverlayLayer {
  map: HistoricalMap;
  opacity: number;
}

interface BuildingsMapProps {
  buildings: Building[];
  colorBy?: ColorBy;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  overlays?: OverlayLayer[];
  basemap?: Basemap;
  /** זום בעת מעבר לאתר נבחר */
  focusZoom?: number;
  className?: string;
  /** מאפשר קריאה לגבולות התצוגה (לשמירת מפה היסטורית) */
  onViewChange?: (bounds: [[number, number], [number, number]]) => void;
  showLabels?: boolean;
  /** הצגת חלונית קופצת בלחיצה על סמן */
  popups?: boolean;
  /** הזזת נקודת המיקוד בפיקסלים [x, y] — כדי שהאתר לא יוסתר מאחורי כרטיס */
  focusOffset?: [number, number];
}

const ASHDOD_CENTER: L.LatLngTuple = [31.8, 34.65];

const TILES: Record<Basemap, { url: string; attribution: string; maxZoom: number }> = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
};

function popupHtml(b: Building): string {
  const img = b.image_url
    ? `<img src="${escapeHtml(b.image_url)}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:8px" />`
    : '';
  return `<div class="site-popup" dir="rtl">
    ${img}
    <p style="margin:0;font-weight:700;font-size:14px;color:#1B2A4A">${escapeHtml(b.name)}</p>
    <p style="margin:2px 0 8px;font-size:12px;color:#4A5A7A">${escapeHtml(b.address)}${b.coords_approx ? ' · <span style="color:#8B3A1E">מיקום משוער</span>' : ''}</p>
    <a href="/buildings/${encodeURIComponent(b.id)}" style="font-size:12px;color:#1B6B7D;font-weight:600">לדף האתר</a>
  </div>`;
}

export function BuildingsMap({
  buildings, colorBy = 'category', selectedId, onSelect, overlays = [], basemap = 'streets',
  focusZoom = 16, className, onViewChange, showLabels = false, popups = true, focusOffset,
}: BuildingsMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const markers = useRef<Map<string, L.CircleMarker>>(new Map());
  const overlayLayers = useRef<Map<string, L.ImageOverlay>>(new Map());
  const onSelectRef = useRef(onSelect);
  const onViewRef = useRef(onViewChange);
  onSelectRef.current = onSelect;
  onViewRef.current = onViewChange;

  // אתחול פעם אחת
  useEffect(() => {
    if (!container.current || map.current) return;
    const m = L.map(container.current, { center: ASHDOD_CENTER, zoom: 13, zoomControl: false, attributionControl: true });
    L.control.zoom({ position: 'topleft' }).addTo(m);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(m);
    const report = () => {
      const b = m.getBounds();
      onViewRef.current?.([[b.getSouth(), b.getWest()], [b.getNorth(), b.getEast()]]);
    };
    m.on('moveend', report);
    map.current = m;
    report();
    return () => { m.remove(); map.current = null; markers.current.clear(); overlayLayers.current.clear(); tiles.current = null; };
  }, []);

  // שכבת בסיס
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    const t = TILES[basemap];
    tiles.current = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: t.maxZoom }).addTo(m);
    tiles.current.bringToBack();
  }, [basemap]);

  // סמנים
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach(mk => mk.remove());
    markers.current.clear();

    const withCoords = buildings.filter(b => b.lat != null && b.lng != null);
    withCoords.forEach(b => {
      const mk = L.circleMarker([b.lat!, b.lng!], {
        radius: 9, fillColor: markerColor(b, colorBy), color: '#fff', weight: 2.5, fillOpacity: 0.92,
        // מיקום משוער: מסגרת מקווקוות
        dashArray: b.coords_approx ? '3 3' : undefined,
      });
      if (popups) mk.bindPopup(popupHtml(b), { maxWidth: 240, minWidth: 200 });
      // ריחוף: תצוגה מקדימה עם תמונה. תוויות קבועות: שם בלבד
      const hoverHtml = !showLabels && b.image_url
        ? `<div class="site-hover"><img src="${escapeHtml(b.image_url)}" alt="" /><span>${escapeHtml(b.name)}</span></div>`
        : escapeHtml(b.name);
      mk.bindTooltip(hoverHtml, {
        direction: 'top', offset: [0, -8], className: showLabels || !b.image_url ? 'site-tooltip' : 'site-tooltip site-tooltip-img', permanent: showLabels,
      });
      mk.on('click', () => onSelectRef.current?.(b.id));
      mk.addTo(m);
      markers.current.set(b.id, mk);
    });

    if (withCoords.length > 0 && !selectedId) {
      m.fitBounds(L.latLngBounds(withCoords.map(b => [b.lat!, b.lng!] as L.LatLngTuple)), { padding: [40, 40], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings, colorBy, showLabels, popups]);

  // בחירה: מעוף לאתר והדגשה
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk, id) => {
      const sel = id === selectedId;
      mk.setStyle({ radius: sel ? 14 : 9, weight: sel ? 4 : 2.5, color: sel ? '#1B2A4A' : '#fff' });
      if (sel) mk.bringToFront();
    });
    if (!selectedId) {
      // חזרה לתצוגת כל האתרים
      m.closePopup();
      const all = [...markers.current.values()].map(mk => mk.getLatLng());
      if (all.length > 0) m.flyToBounds(L.latLngBounds(all), { padding: [40, 40], maxZoom: 15, duration: 1 });
      return;
    }
    const mk = markers.current.get(selectedId);
    if (!mk) return;
    const zoom = Math.max(m.getZoom(), focusZoom);
    let target = mk.getLatLng();
    if (focusOffset) {
      const p = m.project(target, zoom).add(L.point(focusOffset[0], focusOffset[1]));
      target = m.unproject(p, zoom);
    }
    m.flyTo(target, zoom, { duration: 1.4 });
    if (popups) m.once('moveend', () => mk.openPopup());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, focusZoom]);

  // מפות היסטוריות כשכבות
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const wanted = new Set(overlays.map(o => o.map.id));
    overlayLayers.current.forEach((layer, id) => {
      if (!wanted.has(id)) { layer.remove(); overlayLayers.current.delete(id); }
    });
    overlays.forEach(({ map: hm, opacity }) => {
      const existing = overlayLayers.current.get(hm.id);
      if (existing) { existing.setOpacity(opacity); return; }
      const layer = L.imageOverlay(hm.url, hm.bounds, { opacity, interactive: false }).addTo(m);
      overlayLayers.current.set(hm.id, layer);
    });
    markers.current.forEach(mk => mk.bringToFront());
  }, [overlays]);

  return (
    <div
      ref={container}
      role="application"
      aria-label="מפת אתרי השימור באשדוד"
      className={className ?? 'w-full h-[500px] rounded-xl overflow-hidden shadow-md'}
      style={{ border: '1px solid var(--stone-light)' }}
    />
  );
}

'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Route, Building } from '@/lib/types';

interface RoutesMapProps {
  routes: Route[];
  buildings: Building[];
  themeColors: Record<string, string>;
  onRouteClick?: (routeId: string) => void;
}

const THEME_HEX: Record<string, string> = {
  'תקופה': '#D4922A',
  'ארכאולוגיה': '#8B3A1E',
  'שכונה': '#4A5C45',
  'טבע': '#7A9174',
};

const DEFAULT_COLOR = '#1B6B7D';

function getRouteColor(theme: string | null): string {
  if (!theme) return DEFAULT_COLOR;
  return THEME_HEX[theme] ?? DEFAULT_COLOR;
}

export function RoutesMap({ routes, buildings, themeColors, onRouteClick }: RoutesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  const buildingMap = useRef<Map<string, Building>>(new Map());

  useEffect(() => {
    buildingMap.current = new Map(buildings.map((b) => [b.id, b]));
  }, [buildings]);

  const buildRoutePopup = useCallback((route: Route): string => {
    const sites = (route.sites ?? [])
      .sort((a, b) => a.position - b.position)
      .map((s) => {
        const b = buildingMap.current.get(s.building_id);
        return b ? `<li style="margin-bottom:4px"><strong>${b.name}</strong></li>` : '';
      })
      .join('');

    return `
      <div dir="rtl" style="min-width:200px;max-width:280px;font-family:Heebo,sans-serif;">
        <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1B2A4A;">${route.title}</h3>
        ${route.theme ? `<span style="display:inline-block;font-size:11px;padding:2px 8px;border-radius:12px;color:#fff;background:${getRouteColor(route.theme)};margin-bottom:6px;">${route.theme}</span>` : ''}
        ${route.description ? `<p style="font-size:12px;color:#4A5A7A;margin:4px 0 8px;line-height:1.5;">${route.description}</p>` : ''}
        <ol style="margin:0;padding:0 16px 0 0;font-size:12px;color:#1A1410;">${sites}</ol>
        <a href="/routes/${route.id}" style="display:inline-block;margin-top:8px;font-size:12px;color:#1B6B7D;text-decoration:underline;">פתח מסלול &larr;</a>
      </div>
    `;
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current, {
        center: [31.8050, 34.6460],
        zoom: 12,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }),
        ],
      });
    }

    if (layersRef.current) {
      layersRef.current.clearLayers();
    } else {
      layersRef.current = L.layerGroup().addTo(mapRef.current);
    }

    const allCoords: L.LatLngExpression[] = [];

    routes.forEach((route) => {
      const sites = (route.sites ?? []).sort((a, b) => a.position - b.position);
      const coords: L.LatLngTuple[] = [];

      sites.forEach((site) => {
        const b = buildingMap.current.get(site.building_id);
        if (b?.lat && b?.lng) {
          coords.push([b.lat, b.lng]);
        }
      });

      if (coords.length < 2) return;

      allCoords.push(...coords);
      const color = getRouteColor(route.theme);

      const bgLine = L.polyline(coords, {
        color: 'transparent',
        weight: 20,
        opacity: 0,
        interactive: true,
      });

      const polyline = L.polyline(coords, {
        color,
        weight: 4,
        opacity: 0.8,
        dashArray: undefined,
        lineCap: 'round',
        lineJoin: 'round',
      });

      const popup = L.popup({ className: 'route-popup' }).setContent(buildRoutePopup(route));

      const highlight = () => {
        polyline.setStyle({ weight: 7, opacity: 1 });
        polyline.bringToFront();
      };
      const unhighlight = () => {
        polyline.setStyle({ weight: 4, opacity: 0.8 });
      };

      bgLine.on('mouseover', highlight);
      bgLine.on('mouseout', unhighlight);
      bgLine.on('click', () => {
        polyline.bindPopup(popup).openPopup();
        if (onRouteClick) onRouteClick(route.id);
      });

      polyline.on('mouseover', highlight);
      polyline.on('mouseout', unhighlight);
      polyline.on('click', () => {
        polyline.bindPopup(popup).openPopup();
        if (onRouteClick) onRouteClick(route.id);
      });

      layersRef.current!.addLayer(bgLine);
      layersRef.current!.addLayer(polyline);

      sites.forEach((site, idx) => {
        const b = buildingMap.current.get(site.building_id);
        if (!b?.lat || !b?.lng) return;

        const isFirst = idx === 0;
        const isLast = idx === sites.length - 1;
        const radius = isFirst || isLast ? 8 : 6;

        const marker = L.circleMarker([b.lat, b.lng], {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        });

        const label = `
          <div dir="rtl" style="font-family:Heebo,sans-serif;">
            <p style="margin:0;font-weight:700;font-size:13px;color:#1B2A4A;">${idx + 1}. ${b.name}</p>
            <p style="margin:2px 0 0;font-size:11px;color:#4A5A7A;">${b.address}</p>
            ${site.narrative_text ? `<p style="margin:4px 0 0;font-size:11px;color:#0E4A58;font-style:italic;line-height:1.4;">${site.narrative_text}</p>` : ''}
          </div>
        `;

        marker.bindTooltip(label, { direction: 'top', offset: [0, -8] });

        marker.on('mouseover', highlight);
        marker.on('mouseout', unhighlight);

        layersRef.current!.addLayer(marker);
      });
    });

    if (allCoords.length > 0) {
      mapRef.current.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
    }
  }, [routes, buildings, buildRoutePopup, onRouteClick]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-xl overflow-hidden shadow-md"
      style={{ border: '1px solid var(--stone-light)' }}
    />
  );
}

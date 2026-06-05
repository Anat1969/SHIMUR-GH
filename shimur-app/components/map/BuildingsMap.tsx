'use client';

import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building, STATUS_COLORS } from '@/lib/types';

interface BuildingsMapProps {
  buildings: Building[];
  pinModeTarget?: Building | null;
  onPinDrop?: (buildingId: string, lat: number, lng: number) => void;
}

export function BuildingsMap({ buildings, pinModeTarget, onPinDrop }: BuildingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const pinPreviewRef = useRef<L.Marker | null>(null);
  const clickHandlerRef = useRef<((e: L.LeafletMouseEvent) => void) | null>(null);

  const cleanupPinMode = useCallback(() => {
    if (pinPreviewRef.current && map.current) {
      pinPreviewRef.current.removeFrom(map.current);
      pinPreviewRef.current = null;
    }
    if (clickHandlerRef.current && map.current) {
      map.current.off('click', clickHandlerRef.current);
      clickHandlerRef.current = null;
    }
    if (map.current) {
      map.current.getContainer().style.cursor = '';
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      map.current = L.map(mapContainer.current, {
        center: [31.8050, 34.6460],
        zoom: 12,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }),
        ],
      });
    }

    markersRef.current.forEach(marker => marker.removeFrom(map.current!));
    markersRef.current = [];

    buildings.forEach((building) => {
      if (building.lat && building.lng) {
        const isPinTarget = pinModeTarget?.id === building.id;
        const color = STATUS_COLORS[building.status];
        const marker = L.circleMarker([building.lat, building.lng], {
          radius: isPinTarget ? 12 : 8,
          fillColor: isPinTarget ? '#C4582A' : color,
          color: isPinTarget ? '#C4582A' : '#fff',
          weight: isPinTarget ? 3 : 2,
          opacity: 1,
          fillOpacity: isPinTarget ? 0.3 : 0.8,
          className: isPinTarget ? 'pin-target-pulse' : '',
        });

        marker.bindPopup(
          `<div class="text-sm" dir="rtl">
            <p class="font-bold">${building.name}</p>
            <p class="text-xs text-gray-600">${building.address}</p>
            ${isPinTarget
              ? '<p class="text-xs mt-1" style="color:#C4582A">📍 לחץ על המפה למיקום חדש</p>'
              : `<a href="/buildings/${building.id}" class="text-blue-500 text-xs mt-2 inline-block">פתח →</a>`
            }
          </div>`
        );

        marker.addTo(map.current!);
        markersRef.current.push(marker);
      }
    });

    const buildingsWithCoords = buildings.filter((b) => b.lat && b.lng);
    if (buildingsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        buildingsWithCoords.map((b) => [b.lat!, b.lng!])
      );
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [buildings, pinModeTarget]);

  useEffect(() => {
    if (!map.current) return;

    cleanupPinMode();

    if (pinModeTarget && onPinDrop) {
      map.current.getContainer().style.cursor = 'crosshair';

      const pinIcon = L.divIcon({
        html: `<div style="
          width: 24px; height: 24px;
          background: #C4582A; border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        className: 'pin-drop-icon',
      });

      const handler = (e: L.LeafletMouseEvent) => {
        if (pinPreviewRef.current) {
          pinPreviewRef.current.removeFrom(map.current!);
        }
        pinPreviewRef.current = L.marker(e.latlng, { icon: pinIcon }).addTo(map.current!);
        pinPreviewRef.current.bindPopup(
          `<div class="text-sm" dir="rtl">
            <p class="font-bold">${pinModeTarget.name}</p>
            <p class="text-xs text-gray-500 mb-2">${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}</p>
            <button onclick="window.__confirmPinDrop()"
              style="background:#4A5C45;color:white;padding:4px 12px;border-radius:4px;border:none;cursor:pointer;font-size:12px;width:100%">
              ✓ שמור מיקום
            </button>
          </div>`,
          { closeOnClick: false }
        ).openPopup();

        (window as Record<string, unknown>).__confirmPinDrop = () => {
          onPinDrop(pinModeTarget.id, e.latlng.lat, e.latlng.lng);
        };
      };

      clickHandlerRef.current = handler;
      map.current.on('click', handler);
    }

    return () => {
      cleanupPinMode();
      delete (window as Record<string, unknown>).__confirmPinDrop;
    };
  }, [pinModeTarget, onPinDrop, cleanupPinMode]);

  return (
    <div className="relative">
      {pinModeTarget && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur
          border-2 border-rust-light rounded-lg px-4 py-2 shadow-lg text-center">
          <p className="text-sm font-bold text-rust" dir="rtl">
            מצב דקירה — {pinModeTarget.name}
          </p>
          <p className="text-xs text-ink-soft" dir="rtl">
            לחץ על המפה לבחירת מיקום מדויק
          </p>
        </div>
      )}
      <div
        ref={mapContainer}
        className="w-full h-[500px] rounded-lg border overflow-hidden shadow-md"
        style={{ borderColor: pinModeTarget ? '#C4582A' : 'var(--stone-light)' }}
      />
    </div>
  );
}

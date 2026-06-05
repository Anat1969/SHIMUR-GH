'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building, STATUS_COLORS } from '@/lib/types';

interface BuildingsMapProps {
  buildings: Building[];
}

export function BuildingsMap({ buildings }: BuildingsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!map.current) {
      // Initialize map only once
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

    // Remove old markers
    markersRef.current.forEach(marker => marker.removeFrom(map.current!));
    markersRef.current = [];

    // Add markers for filtered buildings
    buildings.forEach((building) => {
      if (building.lat && building.lng) {
        const color = STATUS_COLORS[building.status];
        const marker = L.circleMarker([building.lat, building.lng], {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        });

        marker.bindPopup(
          `<div class="text-sm" dir="rtl">
            <p class="font-bold">${building.name}</p>
            <p class="text-xs text-gray-600">${building.address}</p>
            <a href="/buildings/${building.id}" class="text-blue-500 text-xs mt-2 inline-block">פתח →</a>
          </div>`
        );

        marker.addTo(map.current!);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to filtered buildings
    const buildingsWithCoords = buildings.filter((b) => b.lat && b.lng);
    if (buildingsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        buildingsWithCoords.map((b) => [b.lat!, b.lng!])
      );
      map.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [buildings]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-lg border border-stone-light overflow-hidden shadow-md"
    />
  );
}

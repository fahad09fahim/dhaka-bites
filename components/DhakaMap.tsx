'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface Restaurant {
  id: string;
  name: string;
  area: string;
  cuisine: string;
  address: string;
  latitude: number;
  longitude: number;
  avg_rating: number;
  avg_food_quality: number;
  review_count: number;
}

interface Props {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (restaurant: Restaurant) => void;
}

export default function DhakaMap({ restaurants, selectedId, onSelect }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([23.765, 90.402], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersRef.current || !mapRef.current) return;
    markersRef.current.clearLayers();

    restaurants.forEach((r) => {
      const isSelected = r.id === selectedId;
      const icon = L.divIcon({
        className: 'custom-dhaka-pin',
        html: `<div style="
          background:${isSelected ? '#dc2626' : '#ea580c'};
          color:#fff;padding:4px 8px;border-radius:9999px;font-weight:700;
          font-size:12px;white-space:nowrap;border:2px solid #fff;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        ">★ ${r.avg_rating > 0 ? r.avg_rating : 'New'} · ${r.name}</div>`,
        iconSize: [140, 28],
        iconAnchor: [70, 14],
      });

      const marker = L.marker([r.latitude, r.longitude], { icon }).on('click', () => onSelect(r));
      marker.addTo(markersRef.current!);
    });
  }, [restaurants, selectedId, onSelect]);

  return <div ref={containerRef} className="w-full h-[460px] rounded-xl border border-gray-200 z-0" />;
}

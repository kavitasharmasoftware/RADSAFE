
import React, { useEffect, useRef } from 'react';
import { DISTRICTS } from '../constants';

interface MapProps {
  onSelect: (id: string) => void;
  selectedId: string | null;
}

const BiharMap: React.FC<MapProps> = ({ onSelect, selectedId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<any>(null);
  const markers = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    // Check if the script is loaded and the container exists
    if (!mapRef.current || !(window as any).google) return;

    const google = (window as any).google;

    // Initialize a standard Google Map
    // Removing mapId to prevent ApiTargetBlockedMapError on keys without configured Map IDs
    googleMap.current = new google.maps.Map(mapRef.current, {
      center: { lat: 25.6, lng: 85.8 },
      zoom: 7,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          "featureType": "all",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#7c93a3"}]
        },
        {
          "featureType": "administrative.province",
          "elementType": "geometry.stroke",
          "stylers": [{"visibility": "on"}, {"color": "#cbd5e1"}, {"weight": 2}]
        },
        {
          "featureType": "water",
          "elementType": "geometry.fill",
          "stylers": [{"color": "#e2e8f0"}]
        }
      ]
    });

    // Add legacy Markers (compatible with all Maps JS API keys)
    DISTRICTS.forEach((d) => {
      const marker = new google.maps.Marker({
        position: { lat: d.lat, lng: d.lng },
        map: googleMap.current,
        title: d.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: d.color,
          fillOpacity: 0.9,
          scale: selectedId === d.id ? 10 : 7,
          strokeColor: 'white',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        onSelect(d.id);
      });

      markers.current[d.id] = marker;
    });

    return () => {
      Object.values(markers.current).forEach((m: any) => {
        if (m && m.setMap) {
          m.setMap(null);
        }
      });
    };
  }, []);

  // Update marker focus and visuals when a district is selected
  useEffect(() => {
    if (!googleMap.current || !(window as any).google) return;
    const google = (window as any).google;

    // Fix: Explicitly cast marker to any to avoid 'unknown' type error on setIcon call
    Object.entries(markers.current).forEach(([id, marker]) => {
      const d = DISTRICTS.find(item => item.id === id);
      if (!d) return;

      (marker as any).setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: d.color,
        fillOpacity: 0.9,
        scale: selectedId === id ? 12 : 7,
        strokeColor: 'white',
        strokeWeight: selectedId === id ? 3 : 2,
      });

      if (selectedId === id) {
        googleMap.current?.panTo({ lat: d.lat, lng: d.lng });
        googleMap.current?.setZoom(9);
      }
    });
  }, [selectedId]);

  return (
    <div className="relative w-full aspect-[16/10] bg-white rounded-3xl border border-slate-200 overflow-hidden pro-shadow">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Informative Legend */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 p-3 bg-white/95 backdrop-blur rounded-2xl border border-slate-100 text-[10px] font-extrabold text-slate-500 shadow-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" /> 
          CRITICAL RADIANCE
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 
          ELEVATED EXPOSURE
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 
          ACTIVE SURVEILLANCE
        </div>
      </div>
      
      {/* Help Tip */}
      <div className="absolute bottom-4 left-4 p-2 bg-white/90 backdrop-blur rounded-xl border border-slate-100 text-[8px] font-bold text-slate-400 pointer-events-none">
        TAP MARKERS FOR DATA
      </div>
    </div>
  );
};

export default BiharMap;

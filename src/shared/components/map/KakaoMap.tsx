"use client";

import { Map, MapMarker } from "react-kakao-maps-sdk";

export interface MapMarkerInfo {
  lat: number;
  lng: number;
  locationName: string;
}

interface KakaoMapProps {
  center?: { lat: number, lng: number };
  level?: number;
  markers?: MapMarkerInfo[];
  lat?: number;
  lng?: number;
  locationName?: string;
}

export default function KakaoMap({ center, level = 3, markers, lat, lng, locationName }: KakaoMapProps) {

  const displayMarkers = markers || (lat && lng && locationName ? [{ lat, lng, locationName }] : []);
  const mapCenter = center || (displayMarkers.length > 0 ? { lat: displayMarkers[0].lat, lng: displayMarkers[0].lng } : { lat: 37.5665, lng: 126.9780 });

  return (
    <div className="w-full h-80 bg-gray-100 rounded-3xl overflow-hidden mt-4 shadow-inner border border-gray-100 relative">
      <Map
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={level}
      >
        {displayMarkers.map((marker, index) => (
          <MapMarker
            key={`${marker.lat}-${marker.lng}-${index}`}
            position={{ lat: marker.lat, lng: marker.lng }}
          >
            <div className="p-2 min-w-[120px] text-center">
              <p className="text-blue-600 font-bold text-xs">{marker.locationName}</p>
              <p className="text-[10px] text-gray-400">스터디 장소</p>
            </div>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}

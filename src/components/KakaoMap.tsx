"use client";

import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

export interface MapMarkerInfo {
  lat: number;
  lng: number;
  locationName: string;
}

interface KakaoMapProps {
  apiKey: string;
  center?: { lat: number, lng: number };
  level?: number;
  markers?: MapMarkerInfo[];
  lat?: number;
  lng?: number;
  locationName?: string;
}

export default function KakaoMap({ apiKey, center, level = 3, markers, lat, lng, locationName }: KakaoMapProps) {
  // useKakaoLoader가 지도를 불러옵니다.
  const [loading, error] = useKakaoLoader({
    appkey: apiKey,
    libraries: ["services", "clusterer"],
  });

  // 1. API 키가 아예 없는 경우
  if (!apiKey) {
    return (
      <div className="w-full h-80 bg-orange-50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-orange-200 text-orange-400 p-8 text-center mt-4">
        <span className="text-4xl mb-4">📍</span>
        <p className="font-bold text-lg mb-1 italic">API 키가 비어있어요!</p>
        <p className="text-sm opacity-80 leading-relaxed">
          <code className="bg-orange-100 px-1 rounded">.env.local</code> 파일의 <br />
          <span className="font-mono font-bold">NEXT_PUBLIC_KAKAO_MAP_KEY</span>를 확인해 주세요.
        </p>
      </div>
    );
  }

  // 2. 불러오기 실패 시 (대부분 키가 틀렸거나 도메인 등록을 안 했을 때)
  if (error) {
    return (
      <div className="w-full h-80 bg-red-50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-red-200 text-red-400 p-8 text-center mt-4">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="font-bold text-lg mb-1">지도를 불러올 수 없습니다.</p>
        <p className="text-xs opacity-70">
          1. 'JavaScript 키'가 맞는지 확인해 보세요.<br />
          2. 카카오 설정에 'http://localhost:3000'을 등록했는지 확인해 보세요.
        </p>
      </div>
    );
  }

  const displayMarkers = markers || (lat && lng && locationName ? [{ lat, lng, locationName }] : []);
  const mapCenter = center || (displayMarkers.length > 0 ? { lat: displayMarkers[0].lat, lng: displayMarkers[0].lng } : { lat: 37.5665, lng: 126.9780 });

  return (
    <div className="w-full h-80 bg-gray-100 rounded-3xl overflow-hidden mt-4 shadow-inner border border-gray-100 relative">
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-white">
          <span className="text-2xl mb-2 animate-bounce">🗺️</span>
          <p className="font-medium animate-pulse">지도를 불러오는 중입니다...</p>
        </div>
      ) : (
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
                <p className="text-orange-600 font-bold text-xs">{marker.locationName}</p>
                <p className="text-[10px] text-gray-400">스터디 장소</p>
              </div>
            </MapMarker>
          ))}
        </Map>
      )}
    </div>
  );
}

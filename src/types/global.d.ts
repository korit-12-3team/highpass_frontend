export {};

declare global {
  interface Window {
    kakao: unknown;
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        onclose?: (state: string) => void;
        width?: number | string;
        height?: number | string;
      }) => { open: () => void };
    };
  }

  interface DaumPostcodeData {
    sido: string;       // 시/도 (예: 서울, 경기, 부산)
    sigungu: string;    // 시/군/구 (예: 강남구, 수원시)
    roadAddress: string;
    jibunAddress: string;
    bname: string;
    buildingName: string;
    apartment: string;
  }
}

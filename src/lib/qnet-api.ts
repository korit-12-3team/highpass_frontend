import { parseStringPromise } from 'xml2js';

/**
 * 큐넷(Q-Net) 국가기술자격 종목별 시험정보를 가져와서 JSON으로 바꿉니다.
 * @param jmCd - 종목코드 (예: 정보처리기사는 '1320')
 */
export async function getQnetExamInfo(jmCd: string) {
  // 1. .env.local에 저장한 소중한 API 키를 가져옵니다.
  const apiKey = process.env.PUBLIC_DATA_API_KEY;

  if (!apiKey) {
    console.error("앗! .env.local 파일에 'PUBLIC_DATA_API_KEY'가 없어요. 확인해 주세요!");
    return null;
  }

  // 2. 한국산업인력공단의 공식 API 주소입니다.
  // 서비스명: getJmfRqScdlList (국가기술자격 종목별 시험일정)
  const url = `http://apis.data.go.kr/B552730/jmfRqScdl/getJmfRqScdlList?serviceKey=${apiKey}&format=xml&jmCd=${jmCd}`;

  try {
    // 3. API 서버에서 데이터를 XML 형식으로 받아옵니다.
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`API 요청이 실패했어요. (상태 코드: ${response.status})`);
    }
    const xmlText = await response.text();

    // 4. 복잡한 XML을 다루기 쉬운 JSON으로 번역합니다.
    const result = await parseStringPromise(xmlText, { 
      explicitArray: false, // 데이터를 배열([]) 대신 깔끔한 객체({})로 받아요.
      trim: true            // 불필요한 빈칸을 없애줘요.
    });

    // 5. 번역된 데이터 중 핵심 정보(item)만 쏙 뽑아서 돌려줍니다.
    // 보통 response -> body -> items -> item 순서로 들어있습니다.
    const items = result?.response?.body?.items?.item;

    if (!items) {
      console.warn("해당 종목코드에 대한 시험 정보가 없거나, 아직 일정이 나오지 않았어요.");
      return null;
    }

    // 최종적으로 깔끔한 JSON 데이터가 반환됩니다!
    return items;

  } catch (error) {
    console.error("데이터를 가져오는 중에 에러가 났어요:", error);
    return null;
  }
}

import type { BoardPost } from "@/entities/common/types";

const SI_DO_ALIASES: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

function normalizeSiDo(value: string) {
  return SI_DO_ALIASES[value] ?? value;
}

export function getStudyRegionBadge(post: BoardPost) {
  if (post.location === "online") return "";

  const source = (post.address || "").replace(/\s+/g, " ").trim();
  if (!source) return "";

  const parts = source.split(" ").filter(Boolean);
  if (parts.length < 2) return "";

  const siDo = normalizeSiDo(parts[0]);
  const primaryRegion = parts[1];
  const secondaryRegion = parts[2];

  if (primaryRegion?.endsWith("시") && secondaryRegion && /[구군]$/.test(secondaryRegion)) {
    return `${siDo} ${primaryRegion} ${secondaryRegion}`;
  }

  return primaryRegion ? `${siDo} ${primaryRegion}` : siDo;
}

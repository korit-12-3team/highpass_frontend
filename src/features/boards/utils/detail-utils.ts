const KST_TIME_ZONE = "Asia/Seoul";
const TIME_ZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type DateParts = {
  year: string;
  month: string;
  day: string;
};

function normalizeDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (TIME_ZONE_PATTERN.test(trimmed)) return trimmed;
  if (DATE_ONLY_PATTERN.test(trimmed)) return `${trimmed}T00:00:00+09:00`;
  return `${trimmed.replace(" ", "T")}+09:00`;
}

function getKstDateParts(date: Date): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: parts.find((part) => part.type === "year")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
  };
}

function getKstDateKey(date: Date) {
  const { year, month, day } = getKstDateParts(date);
  return `${year}-${month}-${day}`;
}

export function parseKstDate(value?: string) {
  if (!value) return null;

  const date = new Date(normalizeDateTime(value));
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function getBoardCreatedAtTime(value?: string) {
  return parseKstDate(value)?.getTime() ?? 0;
}

export function formatBoardCreatedAt(value?: string) {
  if (!value) return "오늘";

  const date = parseKstDate(value);
  if (!date) return value;

  const now = new Date();
  const dateParts = getKstDateParts(date);
  const nowParts = getKstDateParts(now);

  if (getKstDateKey(date) === getKstDateKey(now)) {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: KST_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  if (dateParts.year === nowParts.year) {
    return `${dateParts.month}.${dateParts.day}`;
  }

  return `${dateParts.year}.${dateParts.month}.${dateParts.day}`;
}

export function formatBoardDate(value?: string) {
  const date = parseKstDate(value);
  if (!date) return value || "날짜 정보 없음";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getInitial(name: string) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

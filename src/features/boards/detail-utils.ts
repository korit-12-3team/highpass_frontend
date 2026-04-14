import { format, isSameDay, isSameYear } from "date-fns";

export function formatBoardCreatedAt(value?: string) {
  if (!value) return "오늘";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  if (isSameDay(date, now)) return format(date, "HH:mm");
  if (isSameYear(date, now)) return format(date, "MM.dd");
  return format(date, "yyyy.MM.dd");
}

export function getInitial(name: string) {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

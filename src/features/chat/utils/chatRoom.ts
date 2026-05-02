export function getRoomDisplayName(room: {
  type?: string;
  displayName?: string;
  roomNickname?: string;
  name?: string;
  partnerNickname?: string;
}) {
  if (room.type === "GROUP") return `${room.name ?? "채팅방"}`;
  if (room.type === "PERSONAL") return `${room.roomNickname || room.partnerNickname || "대화상대없음"}`;
  return room.name ?? "Unknown";
}

export function minuteKey(val?: string): string {
  if (!val) return "";
  const n = val.includes("T") ? val : val.replace(" ", "T");
  return n.slice(0, 16);
}

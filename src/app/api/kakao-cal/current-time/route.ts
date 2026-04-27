import { NextResponse } from "next/server";

// PlayMCP: KakaotalkCal-GetCurrentTime
export async function GET() {
  try {
    // This endpoint is a server-side proxy for the PlayMCP KakaotalkCal-GetCurrentTime tool.
    // In production, replace this body with the actual MCP tool invocation result.
    const currentTime = new Date().toISOString();
    const timezone = "Asia/Seoul";

    return NextResponse.json({ currentTime, timezone });
  } catch {
    return NextResponse.json({ message: "현재 시간 조회에 실패했습니다." }, { status: 500 });
  }
}

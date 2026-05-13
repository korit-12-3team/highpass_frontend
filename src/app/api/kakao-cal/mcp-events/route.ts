import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoApiErrorResponse,
  buildKakaoTokenErrorResponse,
  getKakaoAccessToken,
  isKakaoTokenError,
} from "@/features/calendar/api/kakao-mcp-client";
import {
  connectKakaoCalMcp,
  isKakaoUpstreamError,
} from "@/features/calendar/mcp/kakao-cal-mcp-server";

type TextContentBlock = { type: string; text?: string };

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = await getKakaoAccessToken(cookieHeader);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") ?? "";
    const to   = searchParams.get("to")   ?? "";

    const { client, close } = await connectKakaoCalMcp(token);

    try {
      // MCP 클라이언트로 도구 호출 — 메시지는 JSON-RPC로 직렬화되어 서버로 감
      const result = await client.callTool({
        name: "kakaocal_get_events",
        arguments: { from, to },
      });

      if (result.isError) {
        const textBlock = (result.content as TextContentBlock[] | undefined)?.find(
          (b) => b.type === "text",
        );
        const raw = textBlock?.text ?? "";
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (isKakaoUpstreamError(parsed)) {
            return buildKakaoApiErrorResponse(
              parsed.__kakaoStatus,
              parsed.data,
              "카카오 일정을 불러오지 못했습니다.",
            );
          }
        } catch {
          // raw가 JSON이 아닐 수 있음 — generic 처리로 폴백
        }
        return NextResponse.json({ message: raw || "MCP tool call failed" }, { status: 500 });
      }

      const structured = result.structuredContent as { events?: unknown[] } | undefined;
      if (structured?.events) {
        return NextResponse.json({ events: structured.events });
      }

      const textBlock = (result.content as TextContentBlock[] | undefined)?.find(
        (b) => b.type === "text",
      );
      if (textBlock?.text) {
        const data = JSON.parse(textBlock.text) as { events?: unknown[] };
        return NextResponse.json({ events: data.events ?? [] });
      }

      return NextResponse.json({ events: [] });
    } finally {
      await close();
    }
  } catch (error) {
    if (isKakaoTokenError(error)) {
      return buildKakaoTokenErrorResponse(error);
    }
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}

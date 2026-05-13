import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { kakaoCalGet } from "@/features/calendar/api/kakao-mcp-client";

const KAKAO_API = "https://kapi.kakao.com/v2/api/calendar";

export type KakaoUpstreamError = { __kakaoStatus: number; data: unknown };

export function isKakaoUpstreamError(value: unknown): value is KakaoUpstreamError {
  return typeof value === "object" && value !== null && "__kakaoStatus" in value;
}

/**
 * 카카오 톡캘린더 Open API를 MCP 도구로 노출하는 서버.
 * - 호출 시점의 access token을 클로저로 캡쳐 → 도구 호출 인자에 토큰을 노출하지 않음.
 * - 외부에서 재사용 가능: stdio/HTTP transport로 띄우면 다른 MCP 클라이언트도 같은 도구를 호출 가능.
 */
export function createKakaoCalMcpServer(accessToken: string): McpServer {
  const server = new McpServer(
    { name: "highpass-kakao-cal-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "kakaocal_get_events",
    {
      description: "카카오 톡캘린더에서 from~to 기간(ISO 8601)의 일정을 조회합니다.",
      inputSchema: {
        from: z.string().describe("시작 일시 (ISO 8601)"),
        to:   z.string().describe("종료 일시 (ISO 8601)"),
      },
    },
    async ({ from, to }) => {
      const params = new URLSearchParams();
      params.set("from", from.includes("T") ? from : from + "T00:00:00+09:00");
      params.set("to",   to.includes("T")   ? to   : to   + "T23:59:59+09:00");

      const res  = await kakaoCalGet(`/events?${params}`, accessToken);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err: KakaoUpstreamError = { __kakaoStatus: res.status, data };
        throw new Error(JSON.stringify(err));
      }

      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    "kakaocal_get_event_detail",
    {
      description: "카카오 톡캘린더 특정 일정의 상세 정보를 조회합니다.",
      inputSchema: {
        eventId: z.string().describe("일정 id"),
      },
    },
    async ({ eventId }) => {
      const res  = await kakaoCalGet(`/event?event_id=${encodeURIComponent(eventId)}`, accessToken);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err: KakaoUpstreamError = { __kakaoStatus: res.status, data };
        throw new Error(JSON.stringify(err));
      }

      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data as Record<string, unknown>,
      };
    },
  );

  server.registerTool(
    "kakaocal_get_calendars",
    {
      description: "사용자의 카카오 톡캘린더 목록을 조회합니다.",
      inputSchema: {},
    },
    async () => {
      const res  = await fetch(`${KAKAO_API}/calendars`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err: KakaoUpstreamError = { __kakaoStatus: res.status, data };
        throw new Error(JSON.stringify(err));
      }

      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
        structuredContent: data as Record<string, unknown>,
      };
    },
  );

  return server;
}

/**
 * 같은 프로세스 안에서 MCP server와 client를 InMemoryTransport로 연결.
 * 반환된 client로 callTool 가능. close()는 호출자가 책임.
 */
export async function connectKakaoCalMcp(accessToken: string): Promise<{
  client: Client;
  server: McpServer;
  close: () => Promise<void>;
}> {
  const server = createKakaoCalMcpServer(accessToken);
  const client = new Client(
    { name: "highpass-kakao-cal-client", version: "0.1.0" },
    { capabilities: {} },
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);

  return {
    client,
    server,
    close: async () => {
      await Promise.allSettled([client.close(), server.close()]);
    },
  };
}

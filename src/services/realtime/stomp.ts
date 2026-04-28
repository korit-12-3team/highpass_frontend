import SockJS from "sockjs-client";
import { Client, IMessage } from "@stomp/stompjs";
import { CHAT_API_BASE_URL, STOMP_ENDPOINT_URL } from "@/services/config/config";
import { fetchWithAuth } from "@/services/auth/auth";

export const createChatClient = (
  userId: string | number,
  roomIds: number[],
  onMessageReceived: (message: any) => void,
  onNotificationReceived?: (notification: any) => void,
) => {
  const client = new Client({
    webSocketFactory: () => new SockJS(STOMP_ENDPOINT_URL),
    connectHeaders: {
      userId: String(userId),
    },
    reconnectDelay: 5000,
    debug: (str) => console.log(str),
  });

  client.onConnect = () => {
    roomIds.forEach((roomId) => {
      client.subscribe(`/sub/chat/room/${roomId}`, (message: IMessage) => {
        onMessageReceived(JSON.parse(message.body));
      });
    });

    if (userId) {
      client.subscribe(`/sub/notifications/${userId}`, (message: IMessage) => {
        onNotificationReceived?.(JSON.parse(message.body));
      });
    }
  };

  return client;
};

export const sendMessage = (client: Client | null, messageData: any) => {
  if (!client?.connected) return;

  client.publish({
    destination: "/pub/chat/message",
    body: JSON.stringify(messageData),
  });
};

export const getMyChatRooms = async () => {
  const response = await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/rooms`);
  if (!response.ok) throw new Error("채팅방 목록을 불러오지 못했습니다.");
  return response.json();
};

export const getChatRoom = async (roomId: number) => {
  const response = await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/room/${roomId}`);
  if (!response.ok) throw new Error("채팅방 정보를 불러오지 못했습니다.");
  return response.json();
};

export const enterChatRoom = async (partnerId: number) => {
  const response = await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/room?partnerId=${partnerId}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("채팅방을 생성하지 못했습니다.");
  return response.json();
};

export const leaveRoom = async (roomId: number) => {
  const response = await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/rooms/${roomId}/leave`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("채팅방 나가기에 실패했습니다.");
};

export const kickParticipant = async (roomId: number, targetUserId: number) => {
  const response = await fetchWithAuth(`${CHAT_API_BASE_URL}/chat/rooms/${roomId}/kick/${targetUserId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("참여자 강퇴에 실패했습니다.");
};

import { getChatRooms } from "@/lib/chat";
import ChatClient from "./ChatClient";

export function generateStaticParams() {
  const rooms = getChatRooms();
  return rooms.map((room) => ({
    roomId: String(room.id),
  }));
}

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  return <ChatClient roomId={Number(roomId)} />;
}

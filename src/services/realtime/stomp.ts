import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import axios from 'axios';
import { CHAT_API_BASE_URL, STOMP_ENDPOINT_URL } from '@/services/config/config';

export const createChatClient = (
    userId: string | number,
    roomIds: number[],
    onMessageReceived: (message : any) => void 
    ) => {
        const client = new Client({
            webSocketFactory : () => new SockJS(STOMP_ENDPOINT_URL),
            connectHeaders: {
                userId: String(userId),
            },
            reconnectDelay: 5000,
            debug : (str) => console.log(str), 
        }); 

        client.onConnect = () => {
            roomIds.forEach((roomId) => {
                client.subscribe(`/sub/chat/room/${roomId}`, (message: IMessage) => {
                    onMessageReceived(JSON.parse(message.body)); 
                });
            });
        };

        return client; 
    };


export const sendMessage = (client : Client | null, messageData: any) => {
    if (client && client.connected) {
        client.publish({
            destination : '/pub/chat/message',
            body: JSON.stringify(messageData), 
        });
    };
};

export const getMyChatRooms = async (userId: number) => {
    const response = await axios.get(`${CHAT_API_BASE_URL}/chat/rooms?userId=${userId}`);
    return response.data; 
}

export const enterChatRoom = async (userId : number, partnerId: number) => {
    const response = await axios.post(`${CHAT_API_BASE_URL}/chat/room`, null, {
        params: { userId, partnerId }
    });
    return response.data; 
}

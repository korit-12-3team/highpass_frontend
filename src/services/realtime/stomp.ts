import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import axios from 'axios';

export const createChatClient = (
    roomIds: number[],
    onMessageReceived: (message : any) => void 
    ) => {
        const client = new Client({
            webSocketFactory : () => new SockJS('http://localhost:8080/ws-stomp'),
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


export const sendMessage = (client : Client, messageData: any) => {
    if (client && client.connected) {
        client.publish({
            destination : '/pub/chat/message',
            body: JSON.stringify(messageData), 
        });
    };
};

export const getMyChatRooms = async (userId: number) => {
    const response = await axios.get(`/api/chat/rooms?userId=${userId}`);
    return response.data; 
}

export const enterChatRoom = async (userId : number, partnerId: number) => {
    const response = await axios.post(`api/chat/room`, {
        userId, partnerId
    });
    return response.data; 
}

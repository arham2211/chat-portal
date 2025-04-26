import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  // file_info?: FileInfo; // Add this line
}
const chatService = {
  async getMessages(userId: number) {
    if (!userId) {
      throw new Error('User ID is required to fetch messages');
    }
    const response = await axios.get(`${API_URL}/chat/messages/${userId}`);
    return response.data;
  },

  async sendMessage(content: string, receiverId: number, groupId?: number) {
    const response = await axios.post(`${API_URL}/chat/messages`, {
      content,
      receiver_id: receiverId,
      group_id: groupId
    });
    return response.data;
  },

  setupWebSocket(userId: number, onMessage: (message: Message) => void) {
    const ws = new WebSocket(`ws://localhost:8000/api/chat/ws/${userId}`);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      onMessage(message);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return {
      sendMessage: (content: string, receiverId: number, groupId?: number) => {
        ws.send(JSON.stringify({
          content,
          receiver_id: receiverId,
          group_id: groupId
        }));
      },
      close: () => ws.close()
    };
  }
};

export default chatService;
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface FileInfo {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
}

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  file_info?: FileInfo;
}

const chatService = {
  async getMessages(userId: number): Promise<Message[]> {
    if (!userId) {
      throw new Error('User ID is required to fetch messages');
    }
    const response = await axios.get(`${API_URL}/chat/messages/${userId}`);
    console.log("Response Data: ",response.data);
    if (response.data.length === 0) {
      console.warn('No messages found for this user');
      return []; // Return an empty array instead of throwing an error
    }

    return response.data.map((message: Omit<Message, 'file_info'> & { file_info?: Partial<FileInfo> }) => ({
      ...message,
      // Ensure file_info is properly structured if present
      file_info: message.file_info ? {
        id: message.file_info.id,
        filename: message.file_info.filename,
        size: message.file_info.size,
        uploaded_at: message.file_info.uploaded_at
      } : undefined
    }));
  },

  async sendMessage(content: string, receiverId: number, file_info?: FileInfo, groupId?: number) {
    const response = await axios.post(`${API_URL}/chat/messages`, {
      content,
      receiver_id: receiverId,
      file_info, // Include file_info in the request
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
      try {
        const message = JSON.parse(event.data);
        // Ensure consistent message format
        onMessage({
          ...message,
          file_info: message.file_info ? {
            id: message.file_info.id,
            filename: message.file_info.filename,
            size: message.file_info.size,
            uploaded_at: message.file_info.uploaded_at
          } : undefined
        });
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return {
      sendMessage: (content: string, receiverId: number, file_info?: FileInfo, groupId?: number) => {
        // Send both content and file_info in a standardized format
        ws.send(JSON.stringify({
          content,
          receiver_id: receiverId,
          file_info,
          group_id: groupId
        }));
      },
      close: () => ws.close()
    };
  }
};

export default chatService;
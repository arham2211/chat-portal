import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface FileInfo {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
}
let currentSelectedUserId: number | null = null;
const fileService = {

  setSelectedUserId(userId: number): void {
    currentSelectedUserId = userId;
  },
  async uploadFile(file: File, recipientId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    if (recipientId) {
      formData.append("recipient_id", recipientId.toString());
    }
    const response = await axios.post(`${API_URL}/ftp/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },
  async getUserFiles(): Promise<FileInfo[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ftp/files/${currentSelectedUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.map((file: { id: number; filename: string; size: number; uploaded_at: string; sender_id: number; receiver_id: number }) => ({
        id: file.id,
        filename: file.filename,
        size: file.size,
        uploaded_at: file.uploaded_at,
        sender_id: file.sender_id,
        receiver_id: file.receiver_id
      }));
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw error;
    }
  },
  async deleteFile(fileId: number): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/ftp/delete/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
    

      async downloadFile(fileId: number, filename: string): Promise<void> {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${API_URL}/ftp/download/${fileId}`, {
            responseType: "blob", // Important for file downloads
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
    
          // Create a download link
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        } catch (error) {
          console.error("Download failed:", error);
          throw error;
        }
      }
    
};

export default fileService;
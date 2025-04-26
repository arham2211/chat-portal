import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface FileInfo {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
}

const fileService = {
  async uploadFile(file: File, recipientId?: number) {
    const formData = new FormData();
    formData.append('file', file);
    console.log('File to upload:', file);
    console.log('Recipient ID:', recipientId);
    if (recipientId) {
      formData.append("recipient_id", recipientId.toString());
    }
    const response = await axios.post(`${API_URL}/ftp/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },

  async getUserFiles() {
    const response = await axios.get(`${API_URL}/ftp/files`);
    return response.data;
  },

  // In fileService.ts
downloadFile(fileId: number, filename?: string) {
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = `${API_URL}/ftp/download/${fileId}`;
  
  // If filename is provided, set it as the download attribute
  if (filename) {
  link.download = filename;
  }
  
  // Append to body, click and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Also open in new tab as fallback
  window.open(`${API_URL}/ftp/download/${fileId}`, '_blank');
  }
  };


export default fileService;
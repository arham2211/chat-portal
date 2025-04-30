import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface FileInfo {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
}

// const fileService = {
//   async uploadFile(file: File, recipientId?: number) {
//     const formData = new FormData();
//     formData.append('file', file);
//     console.log('File to upload:', file);
//     console.log('Recipient ID:', recipientId);
//     if (recipientId) {
//       formData.append("recipient_id", recipientId.toString());
//     }
//     const response = await axios.post(`${API_URL}/ftp/upload`, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data'
//       }
//     });
    
//     return response.data;
//   },

//   async getUserFiles() {
//     const response = await axios.get(`${API_URL}/ftp/files`);
//     return response.data;
//   },


// // In fileService.ts
// downloadFile: async (fileId: number, filename?: string) => {
//   try {
//     // First get the file info to ensure it exists and get the proper filename
//     const fileInfoResponse = await axios.get(`${API_URL}/ftp/files/${fileId}`);
//     const fileInfo = fileInfoResponse.data;
    
//     // Create a temporary anchor element
//     const link = document.createElement('a');
//     link.href = `${API_URL}/ftp/download/${fileId}`;
//     link.download = filename || fileInfo.filename; // Use provided filename or the one from server
//     link.target = '_blank'; // Open in new tab as fallback
    
//     // Append to body, click and remove
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     // For mobile devices, also open in new tab
//     setTimeout(() => {
//       window.open(`${API_URL}/ftp/download/${fileId}`, '_blank');
//     }, 100);
//   } catch (error) {
//     console.error('Error downloading file:', error);
//     throw error;
//   }
// }
//   };
// fileService.ts
const fileService = {
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
     async getUserFiles() {
        const response = await axios.get(`${API_URL}/ftp/files`);
        return response.data;
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
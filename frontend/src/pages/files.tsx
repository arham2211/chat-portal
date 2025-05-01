import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import authService from "../services/auth";
import fileService, { FileInfo } from "../services/file";
import axios from "axios";
import "../app/globals.css";
interface User {
  id: string;
  username: string;
  email: string;
}

export default function Files() {
  const router = useRouter();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit] = useState(100 * 1024 * 1024); // 100MB default

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      loadFiles();
    };

    checkAuth();
  }, [router]);

  const loadFiles = async () => {
    try {
      const userFiles = await fileService.getUserFiles();
      setFiles(userFiles);
      // Calculate storage used (sum of all file sizes)
      const used = userFiles.reduce((sum: number, file: FileInfo) => sum + file.size, 0);
      setStorageUsed(used);
    } catch (err) {
      console.error("Error loading files:", err);
      setError("Failed to load files");
    }
  };

  // Format file size in human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Determine file type based on extension
  const getFileType = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(extension)) return 'presentation';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) return 'video';
    if (['zip', 'rar', '7z', 'tar'].includes(extension)) return 'archive';
    return 'other';
  };

  // Handle file selection (both drag-drop and input)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let selectedFiles: FileList | null = null;
    
    if ('dataTransfer' in event) {
      // Drag and drop event
      event.preventDefault();
      selectedFiles = event.dataTransfer.files;
    } else {
      // File input event
      selectedFiles = event.target.files;
    }

    if (selectedFiles && selectedFiles.length > 0) {
      const file = selectedFiles[0];
      
      // Check file size (e.g., 50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size exceeds 50MB limit');
        return;
      }
      
      // Check storage limit
      if (file.size + storageUsed > storageLimit) {
        setError('Not enough storage space');
        return;
      }
      
      setFileToUpload(file);
      setError("");
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!fileToUpload) return;
    
    setIsUploading(true);
    setError("");
    
    try {
      await fileService.uploadFile(fileToUpload);
      setFileToUpload(null);
      await loadFiles(); // Refresh the files list
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Error uploading file");
      } else {
        setError("Unexpected error occurred during file upload");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file download
  const handleDownload = async (fileId: number, filename: string) => {
    try {
      await fileService.downloadFile(fileId, filename);
    } catch (error) {
      console.error("Download failed:", error);
      setError("Failed to download file. Please try again later.");
    }
  };

  // Handle file deletion
  const handleDelete = async (fileId: number) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await fileService.deleteFile(fileId);
      await loadFiles(); // Refresh the files list
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete file");
    }
  };

  // Handle file sharing
  const handleShare = async (fileId: number) => {
    try {
      // In a real app, this would open a share dialog or generate a shareable link
      const shareUrl = `${window.location.origin}/share/${fileId}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this file',
          url: shareUrl
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      // User canceled the share or clipboard write failed
      console.error('Sharing failed:', err);
    }
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-md flex flex-col">
        {/* Current user profile */}
        <div className="p-4 bg-gradient-to-r from-teal-400 to-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-white text-teal-500 flex items-center justify-center font-bold text-xl">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h2 className="text-white font-medium">{currentUser.username}</h2>
                <p className="text-teal-100 text-xs">Storage: {formatFileSize(storageUsed)} / {formatFileSize(storageLimit)}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-teal-600 text-white transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-3 border-b">
          <div className="flex space-x-2">
            <button 
              onClick={() => router.push("/chat")}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Chat
            </button>
            <button 
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-teal-100 text-teal-700"
            >
              Files
            </button>
          </div>
        </div>

        {/* Storage progress */}
        <div className="px-4 py-3 border-b">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Storage used</span>
            <span>{Math.round((storageUsed / storageLimit) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-teal-400 to-blue-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, (storageUsed / storageLimit) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-4 py-3 border-b">
          <button 
            onClick={() => document.getElementById('file-upload')?.click()}
            className="w-full py-2 px-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg flex items-center justify-center space-x-2 hover:from-teal-500 hover:to-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload File</span>
          </button>
          <input 
            id="file-upload" 
            type="file" 
            onChange={handleFileSelect} 
            className="hidden" 
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">My Files</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              className="py-2 pl-10 pr-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div className="p-6 border-b">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            isDragging ? 'border-teal-400 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { 
            e.preventDefault(); 
            setIsDragging(false);
            if (e.dataTransfer.files.length > 0) {
              handleFileSelect(e);
            }
          }}
          >
            <div className="mx-auto w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center text-teal-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">Drag and drop files here</h3>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="px-4 py-2 bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-lg text-sm font-medium hover:from-teal-500 hover:to-blue-600 transition-colors"
            >
              Browse Files
            </button>
          </div>

          {fileToUpload && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{fileToUpload.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(fileToUpload.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setFileToUpload(null)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={isUploading}
                  className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center ${
                    isUploading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-teal-500 text-white hover:bg-teal-600'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : 'Upload'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Files list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Recent Files</h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-teal-500 hover:bg-gray-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-teal-500 hover:bg-gray-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <p className="text-lg mb-1">No files yet</p>
              <p className="text-sm">Upload your first file to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        getFileType(file.filename) === 'pdf' ? 'bg-red-100 text-red-500' :
                        getFileType(file.filename) === 'image' ? 'bg-blue-100 text-blue-500' :
                        getFileType(file.filename) === 'document' ? 'bg-indigo-100 text-indigo-500' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {getFileType(file.filename) === 'pdf' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : getFileType(file.filename) === 'image' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : getFileType(file.filename) === 'document' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 truncate">{file.filename}</h3>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleDownload(file.id, file.filename)}
                        className="p-1.5 text-gray-500 hover:text-teal-500 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleShare(file.id)}
                        className="p-1.5 text-gray-500 hover:text-teal-500 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Share"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
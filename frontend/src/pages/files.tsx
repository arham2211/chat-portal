import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import authService from "../services/auth";
import fileService, { FileInfo } from "../services/file";
import axios from "axios";

export default function Files() {
  const router = useRouter();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Load files
      loadFiles();
    };

    checkAuth();
  }, [router]);

  const loadFiles = async () => {
    try {
      const userFiles = await fileService.getUserFiles();
      setFiles(userFiles);
    } catch (err) {
      console.error("Error loading files:", err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!fileToUpload) return;

    setIsUploading(true);
    setError("");

    try {
      await fileService.uploadFile(fileToUpload);
      setFileToUpload(null);
      loadFiles();
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

  const handleDownload = async (fileId: number, filename: string) => {
    try {
      await fileService.downloadFile(fileId, filename);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download file. Please try again later.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Files</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-indigo-500 text-white rounded"
          >
            Go to Chat
          </button>
          <button
            onClick={() => {
              authService.logout();
              router.push("/login");
            }}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Upload section */}
      <div className="mb-8 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Upload New File</h2>
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <div className="flex items-center">
          <input type="file" onChange={handleFileSelect} className="flex-1" />
          <button
            onClick={handleFileUpload}
            disabled={!fileToUpload || isUploading}
            className={`ml-4 px-4 py-2 rounded ${
              !fileToUpload || isUploading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {fileToUpload && (
          <div className="mt-2 text-sm text-gray-600">
            Selected: {fileToUpload.name} (
            {Math.round(fileToUpload.size / 1024)} KB)
          </div>
        )}
      </div>

      {/* Files list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Files</h2>
        {files.length === 0 ? (
          <p className="text-gray-500">No files uploaded yet.</p>
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {file.filename}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(file.uploaded_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownload(file.id,file.filename)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

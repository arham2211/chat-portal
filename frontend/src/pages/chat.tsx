import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import authService, { User } from "../services/auth";
import chatService, { Message } from "../services/chat";
import fileService from "../services/file";
import axios from "axios";
import { IoSend, IoLogOut, IoCloudUpload } from "react-icons/io5";
import { BsChatLeftText } from "react-icons/bs";
import "../app/globals.css"; // Ensure you have Tailwind CSS set up
// import Image from "next/image";

const API_URL = "http://localhost:8000/api/auth";

export default function Chat() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  interface CustomWebSocket {
    sendMessage: (message: string, recipientId: number) => void;
    close: () => void;
  }

  const wsRef = useRef<CustomWebSocket | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      console.log("User:", user);

      // Fetch users (this would be from your actual API)
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem("token");
          console.log("Token:", token);
          const response = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Filter out the current user from the list
          const filteredUsers = response.data.filter(
            (u: User) => u.id !== user.id
          );
          setUsers(filteredUsers);
        } catch (e) {
          console.error("Error fetching users:", e);
        }
      };
      fetchUsers();
    };

    checkAuth();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [router]);

  useEffect(() => {
    if (currentUser && selectedUser) {
      // Load chat history
      const loadMessages = async () => {
        const fetchedMessages = await chatService.getMessages(selectedUser.id);

        // Process all messages to ensure consistent format
        const processedMessages = fetchedMessages.map((message: Message) => {
          // Try to parse content as JSON (for WebSocket messages)
          let content = message.content;
          let file_info = message.file_info;

          try {
            const parsed = JSON.parse(message.content);
            if (typeof parsed === "object") {
              content = parsed.content || message.content;
              file_info = parsed.file_info || message.file_info;
            }
          } catch (e) {
            // Not JSON, use as-is
          }

          return {
            ...message,
            content,
            file_info: file_info
              ? {
                  id: file_info.id,
                  filename: file_info.filename,
                  size: file_info.size,
                  uploaded_at: file_info.uploaded_at,
                }
              : undefined,
          };
        });

        setMessages(processedMessages);
      };

      loadMessages();

      // Set up WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }
      wsRef.current = chatService.setupWebSocket(currentUser.id, (message) => {
        if (
          (message.sender_id === selectedUser.id &&
            message.receiver_id === currentUser.id) ||
          (message.sender_id === currentUser.id &&
            message.receiver_id === selectedUser.id)
        ) {
          // Parse the message content
          let content = message.content;
          let file_info = message.file_info;

          try {
            const parsed = JSON.parse(message.content);
            if (typeof parsed === "object") {
              content = parsed.content || message.content;
              file_info = parsed.file_info || message.file_info;
            }
          } catch (e) {
            // Not JSON, use as-is
          }

          const processedMessage = {
            ...message,
            content,
            file_info: file_info
              ? {
                  id: file_info.id,
                  filename: file_info.filename,
                  size: file_info.size,
                  uploaded_at: file_info.uploaded_at,
                }
              : undefined,
          };

          setMessages((prev) => [...prev, processedMessage]);
        }
      });
    }
  }, [currentUser, selectedUser]);

  const handleSelectUser = (user: User) => {
    // Only reset if selecting a different user
    if (selectedUser?.id !== user.id) {
      console.log("Selected user:", user);
      setSelectedFile(null);
      setNewMessage("");
      setMessages([]);
      setSelectedUser(user);
    }
  };
  // Add this useEffect to handle auto-scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Update the handleSendMessage function to handle files
  const handleSendMessage = () => {
    if ((!newMessage.trim() && !selectedFile) || !currentUser || !selectedUser)
      return;

    if (wsRef.current) {
      // If there's a message, send it
      if (newMessage.trim()) {
        wsRef.current.sendMessage(newMessage, selectedUser.id);

        const tempMessage: Message = {
          id: Date.now(),
          content: newMessage,
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, tempMessage]);
        setNewMessage("");
      }

      // If there's a file, upload it
      if (selectedFile) {
        handleFileUpload();
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !currentUser || !selectedUser) return;

    try {
      const uploadedFile = await fileService.uploadFile(
        selectedFile,
        selectedUser.id
      );

      // Create a consistent message structure
      const fileMessage = {
        content: `File: ${selectedFile.name}`,
        file_info: {
          id: uploadedFile.id,
          filename: selectedFile.name,
          size: selectedFile.size,
          uploaded_at: new Date().toISOString(),
        },
      };

      // Message for sender
      const senderMessage: Message = {
        id: Date.now(),
        content: `You sent a file: ${selectedFile.name}`,
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        created_at: new Date().toISOString(),
        file_info: fileMessage.file_info,
      };

      // Message for receiver (sent via WebSocket)
      const receiverMessage = {
        ...senderMessage,
        content: `Received a file: ${selectedFile.name}`,
        // Send as stringified JSON to ensure consistent parsing
        ws_message: JSON.stringify({
          content: `Received a file: ${selectedFile.name}`,
          file_info: fileMessage.file_info,
        }),
      };

      // Add sender's message to local state
      setMessages((prev) => [...prev, senderMessage]);

      // Send receiver's message via WebSocket
      if (wsRef.current) {
        wsRef.current.sendMessage(receiverMessage.ws_message, selectedUser.id);
      }

      // Clear file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-md flex flex-col z-10">
        {/* Current user profile */}
        <div className="p-4 bg-gradient-to-r from-teal-400 to-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-white text-teal-500 flex items-center justify-center font-bold text-xl">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h2 className="text-white font-medium">
                  {currentUser.username}
                </h2>
                <p className="text-teal-100 text-xs">Online</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-teal-600 text-white transition-colors"
              title="Logout"
            >
              <IoLogOut size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full py-2 pl-8 pr-4 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BsChatLeftText size={40} className="mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedUser?.id === user.id ? "bg-gray-100" : ""
                }`}
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-800">
                        {user.username}
                      </h3>
                      <span className="text-xs text-gray-400">12:34 PM</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {/* Placeholder for last message */}
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="p-4 bg-white shadow-sm flex items-center z-10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <h2 className="font-medium text-gray-800">
                  {selectedUser.username}
                </h2>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 p-4 overflow-y-auto bg-[url('/chat-background.png')] bg-opacity-5"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div style={{ flex: 1, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                      <BsChatLeftText size={24} />
                    </div>
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">
                      Start the conversation with {selectedUser.username}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.sender_id === currentUser.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.sender_id !== currentUser.id && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2 self-end">
                          {selectedUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="max-w-[70%]">
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm ${
                            message.sender_id === currentUser.id
                              ? "bg-gradient-to-r from-teal-400 to-blue-500 text-white rounded-tr-none"
                              : "bg-white text-gray-800 rounded-tl-none"
                          }`}
                        >
                          {message.file_info ? (
                            <div className="file-attachment">
                              <div className="flex items-center p-2 rounded-md bg-opacity-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 mr-2"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate font-medium">
                                    {message.file_info.filename}
                                  </div>
                                  <div className="text-xs opacity-80">
                                    {formatFileSize(message.file_info.size)}
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    fileService.downloadFile(
                                      message.file_info!.id,
                                      message.file_info!.filename
                                    );
                                  }}
                                  className="ml-2 p-1.5 bg-opacity-30 bg-gray-200 hover:bg-opacity-50 rounded-full transition-all"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                </button>
                              </div>
                              <p className="mt-2 text-sm">
                                {message.content.includes("file")
                                  ? ""
                                  : message.content}
                              </p>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 ml-2">
                          {new Date(message.created_at).toLocaleString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                      {message.sender_id === currentUser.id && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold ml-2 self-end">
                          {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* File upload UI */}
            {selectedFile && (
              <div className="px-4 py-2 bg-white border-t border-gray-200">
                <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(selectedFile.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleFileUpload}
                      className="ml-2 bg-teal-500 text-white p-1.5 rounded-full hover:bg-teal-600 transition-colors"
                    >
                      <IoCloudUpload size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Message input */}
            <div className="p-4 bg-white shadow-inner">
              <div className="flex items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-teal-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 ml-2 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !selectedFile}
                  className={`ml-2 p-3 rounded-full ${
                    newMessage.trim() || selectedFile
                      ? "bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600"
                      : "bg-gray-200"
                  } text-white transition-colors`}
                >
                  <IoSend size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-32 h-32 rounded-full bg-gray-200 mb-6 flex items-center justify-center">
              <BsChatLeftText size={60} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Welcome to ChatApp
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              Select a conversation from the sidebar to start chatting or search
              for users to connect with.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

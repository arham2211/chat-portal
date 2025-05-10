# Chat Portal with FTP Enabled

A real-time chat application with integrated file transfer capabilities, built with Next.js (frontend) and FastAPI (backend) using WebSockets for real-time communication.

![Chat Portal Demo](screenshots/demo.gif) *Add your demo GIF/screenshots here*

## 🌟 Features

- **Real-time Messaging**
  - Instant message delivery using WebSockets
  - Online/Offline status indicators
  - Message timestamps with local time formatting
  - Chat history persistence

- **File Transfer**
  - Secure file upload/download functionality
  - File previews with size indicators
  - Progress indicators for file transfers
  - File type recognition and appropriate icons

- **User Management**
  - JWT-based authentication
  - User presence tracking
  - Searchable user list
  - Profile avatars with initials

- **Additional Features**
  - Responsive UI with Tailwind CSS
  - Message notifications
  - Typing indicators
  - File management interface
  - Cross-platform compatibility

## 🛠️ Tech Stack

**Frontend**
- Next.js (React Framework)
- TypeScript
- Tailwind CSS
- WebSocket API
- Axios (HTTP client)
- React Icons

**Backend**
- FastAPI (Python)
- WebSockets
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- JWT (Authentication)
- Uvicorn (ASGI server)
- Python-multipart (File handling)

## 📋 Prerequisites

- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL (v14+)
- npm (v9+)
- pip (v23+)

## 🚀 Installation

### Frontend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chat-portal.git
cd chat-portal/frontend

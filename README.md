# Chat Portal with FTP Enabled

A real-time chat application with integrated file transfer capabilities, built with Next.js (frontend) and FastAPI (backend) using WebSockets for real-time communication.

![Chat Portal](screenshots/Chat.png)

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

- Node.js version 18 or higher
- Python version 3.10 or higher
- PostgreSQL version 14 or higher
- npm version 9 or higher
- pip version 23 or higher

## 🚀 Installation

### Frontend Setup

1. Clone the repository and navigate to the frontend directory:

   git clone https://github.com/yourusername/chat-portal.git  
   cd chat-portal/frontend

2. Install dependencies:

   npm install

3. Create a `.env.local` file and configure environment variables:

   NEXT_PUBLIC_API_URL=http://localhost:8000/api  
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws

### Backend Setup

1. Navigate to the backend directory:

   cd ../backend

2. Create a virtual environment:

   python -m venv venv  
   source venv/bin/activate (for Linux/MacOS)  
   venv\Scripts\activate (for Windows)

3. Install dependencies:

   pip install -r requirements.txt

4. Create a `.env` file and configure environment variables:

   DATABASE_URL=sqlite:://user:password@localhost:5432/chatportal
   SECRET_KEY=your-secret-key  
   ALGORITHM=HS256  
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

## 🏃 Running the Application

**To start the backend:**

   uvicorn app.main:app --reload --port 8000

**To start the frontend:**

   cd frontend  
   npm run dev

Access the application at [http://localhost:3000](http://localhost:3000)


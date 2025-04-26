from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .database import Base, engine

from .auth.router import router as auth_router
from .chat.router import router as chat_router
from .ftp.router import router as ftp_router
from .ftp.server import start_ftp_server

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chat Portal with FTP")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(chat_router, prefix="/api/chat")
app.include_router(ftp_router, prefix="/api/ftp")

@app.on_event("startup")
def startup_event():
    # Start FTP server in a separate thread
    start_ftp_server()

@app.get("/")
def read_root():
    return {"message": "Welcome to Chat Portal with FTP"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
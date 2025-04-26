from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
import os
import threading
from sqlalchemy.orm import Session
from ..models.user import User
from ..models.file import File
from ..database import SessionLocal


class FTPServerThread(threading.Thread):
    def __init__(self, host='0.0.0.0', port=2121, root_dir='./ftp_data'):
        super().__init__()
        self.daemon = True
        self.host = host
        self.port = port
        self.root_dir = root_dir
        
        # Ensure root directory exists
        os.makedirs(self.root_dir, exist_ok=True)
    
    def run(self):
        # Create authorizer
        authorizer = DummyAuthorizer()
        
        # Add anonymous user (read-only)
        authorizer.add_anonymous(self.root_dir, perm='elr')
        
        # Add users from database
        db = SessionLocal()
        users = db.query(User).all()
        for user in users:
            print(f"Adding user: {user.username}")
            user_dir = os.path.join(self.root_dir, user.username)
            os.makedirs(user_dir, exist_ok=True)
            # Add user with read/write permissions
            authorizer.add_user(user.username, user.hashed_password, user_dir, perm='elradfmwM')
        db.close()
        
        # FTP handler settings
        handler = FTPHandler
        handler.authorizer = authorizer
        
        # Create server
        server = FTPServer((self.host, self.port), handler)
        server.serve_forever()

def start_ftp_server():
    # Get FTP server configuration from environment if needed
    ftp_thread = FTPServerThread()
    ftp_thread.start()
    return ftp_thread

# Record file upload in database
def record_file_upload(filename, path, size, user_id):
    db = SessionLocal()
    file = File(
        filename=filename,
        path=path,
        size=size,
        uploaded_by=user_id
    )
    db.add(file)
    db.commit()
    db.close()
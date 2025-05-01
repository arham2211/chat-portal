from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from ..database import get_db
from ..models.user import User
from ..models.file import File as FileModel
from ..auth.jwt import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["Files"])

ROOT_DIR = "./ftp_data"

class FileOut(BaseModel):
    id: int
    filename: str
    size: int
    received_by: int | None
    uploaded_at: datetime
    
    class Config:
        form_attribute = True

@router.post("/upload", response_model=FileOut)
async def upload_file(
    file: UploadFile = File(...),
    recipient_id: int = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_dir = os.path.join(ROOT_DIR, current_user.username)
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    print("Receipt id:", recipient_id)
    db_file = FileModel(
        filename=file.filename,
        path=file_path,
        size=file_size,
        uploaded_by=current_user.id,
        received_by=recipient_id  # set recipient
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return db_file


@router.get("/files", response_model=List[FileOut])
def get_user_files(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    files = db.query(FileModel).filter(
        (FileModel.uploaded_by == current_user.id) |
        (FileModel.received_by == current_user.id)
    ).all()
    return files

# Add to your FastAPI backend
@router.get("/files/{user_id}", response_model=List[FileOut])
async def get_user_files(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("Current user ID:", current_user.id)
    print("Requested user ID:", user_id)
    files = db.query(FileModel).filter(
        ((FileModel.uploaded_by == current_user.id) &
        (FileModel.received_by == user_id)) |
        ((FileModel.uploaded_by == user_id) &
        (FileModel.received_by == current_user.id))
    ).all()
    return files


@router.get("/download/{file_id}")
def download_file(file_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    file = db.query(FileModel).filter(FileModel.id == file_id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file.uploaded_by != current_user.id and file.received_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this file")
    
    if not os.path.exists(file.path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(path=file.path, filename=file.filename)

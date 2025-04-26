from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database import get_db
from ..models.user import User
from ..models.message import Message, Group, GroupMember
from ..auth.jwt import get_current_user
from pydantic import BaseModel
import json
from datetime import datetime
from typing import Optional
import pytz

router = APIRouter(tags=["Chat"])

class MessageCreate(BaseModel):
    content: str
    receiver_id: int
    group_id: Optional[int] = None

class MessageOut(BaseModel):
    id: int
    content: str
    sender_id: int
    receiver_id: int
    group_id: Optional[int] = None
    created_at: datetime  # Stored as timezone-aware datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.astimezone(pytz.timezone('Asia/Karachi')).isoformat()
        }

active_connections: Dict[int, WebSocket] = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await websocket.accept()
    active_connections[user_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Save message with PKT time
            pkt_time = datetime.now(pytz.timezone('Asia/Karachi'))
            db_message = Message(
                content=message_data["content"],
                sender_id=user_id,
                receiver_id=message_data.get("receiver_id"),
                group_id=message_data.get("group_id"),
                created_at=pkt_time
            )
            db.add(db_message)
            db.commit()
            db.refresh(db_message)
            
            # Format message with PKT time
            message_out = {
                "id": db_message.id,
                "content": db_message.content,
                "sender_id": db_message.sender_id,
                "receiver_id": db_message.receiver_id,
                "group_id": db_message.group_id,
                "created_at": db_message.created_at.astimezone(
                    pytz.timezone('Asia/Karachi')
                ).strftime("%Y-%m-%d %I:%M:%S %p (PKT)")
            }
            
            # Send to receiver/group members
            if db_message.receiver_id in active_connections:
                await active_connections[db_message.receiver_id].send_text(json.dumps(message_out))
            if db_message.group_id:
                group_members = db.query(GroupMember).filter(GroupMember.group_id == db_message.group_id).all()
                for member in group_members:
                    if member.user_id in active_connections and member.user_id != user_id:
                        await active_connections[member.user_id].send_text(json.dumps(message_out))
    
    except WebSocketDisconnect:
        if user_id in active_connections:
            del active_connections[user_id] 

@router.get("/messages/{user_id}", response_model=List[MessageOut])
def get_direct_messages(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"Fetching messages between {current_user.id} and {user_id}")
    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot fetch messages with yourself")
    if not db.query(User).filter(User.id == user_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    # if not db.query(Group).filter(Group.id == user_id).first():
    #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    # if not db.query(GroupMember).filter(GroupMember.group_id == user_id, GroupMember.user_id == current_user.id).first():
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")

    # Fetch messages between the current user and the specified user
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.created_at).all()
    if not messages:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No messages found")

    # Uncomment the following lines if you want to fetch messages for a group
    # if not db.query(Group).filter(Group.id == user_id).first():
    #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    # if not db.query(GroupMember).filter(GroupMember.group_id == user_id, GroupMember.user_id == current_user.id).first():
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this group")
    # Fetch messages for the group

    
    return messages

@router.post("/messages", response_model=MessageOut)
def create_message(message: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(datetime.utcnow())
    db_message = Message(
    content=message.content,
    sender_id=current_user.id,
    receiver_id=message.receiver_id,
    group_id=message.group_id,
    created_at=datetime.now(pytz.timezone('Asia/Karachi'))  # PKT time
)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message
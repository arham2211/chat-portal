
# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     email = Column(String, unique=True, index=True)
#     hashed_password = Column(String)
#     is_active = Column(Boolean, default=True)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())

#     sent_messages = relationship("Message", back_populates="sender", foreign_keys='Message.sender_id')
#     received_messages = relationship("Message", back_populates="receiver", foreign_keys='Message.receiver_id')

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Define relationships properly
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    groups = relationship("GroupMember", back_populates="user")
    created_groups = relationship("Group", foreign_keys="Group.created_by", back_populates="creator")
    sent_files = relationship("File", foreign_keys="[File.uploaded_by]", back_populates="sender")
    received_files = relationship("File", foreign_keys="[File.received_by]", back_populates="recipient")

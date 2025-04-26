from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    path = Column(String)
    size = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    received_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # New field
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[uploaded_by], back_populates="sent_files")
    recipient = relationship("User", foreign_keys=[received_by], back_populates="received_files")

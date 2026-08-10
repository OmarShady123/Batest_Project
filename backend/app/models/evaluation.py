import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    tour_id = Column(String(100), nullable=False, default="bastet-temple-tour", index=True)
    name = Column(String(255), nullable=True)
    user_type = Column(String(50), nullable=False)
    usability = Column(Integer, nullable=False)
    clarity = Column(Integer, nullable=False)
    tour_rating = Column(Integer, nullable=False)
    understanding = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

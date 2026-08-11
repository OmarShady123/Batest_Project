import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, CheckConstraint, Index, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    normalized_email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    has_local_password = Column(Boolean, nullable=False, default=True, server_default="true")
    google_sub = Column(String(255), nullable=True, unique=True, index=True)
    role = Column(String(20), nullable=False, default="visitor", server_default="visitor")
    
    # Persistent status: pending_verification, active, suspended, deleted
    status = Column(String(30), nullable=False, default="pending_verification", server_default="pending_verification")
    
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    is_verified = Column(Boolean, nullable=False, default=False, server_default="false")
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Temporary lock tracking
    failed_login_attempts = Column(Integer, nullable=False, default=0, server_default="0")
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Email change request
    pending_email = Column(String(255), nullable=True)
    pending_normalized_email = Column(String(255), nullable=True)
    pending_email_requested_at = Column(DateTime(timezone=True), nullable=True)
    
    # Preferences & Terms
    preferred_language = Column(String(10), nullable=False, default="ar", server_default="ar")
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    terms_version = Column(String(20), nullable=True)
    privacy_version = Column(String(20), nullable=True)
    
    # 2FA
    
    # Suspension & Deletion
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspended_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    suspension_reason = Column(Text, nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    @property
    def google_connected(self) -> bool:
        return bool(self.google_sub)

    __table_args__ = (
        CheckConstraint("role IN ('visitor', 'admin')", name="check_valid_user_role"),
        CheckConstraint("status IN ('pending_verification', 'active', 'suspended', 'deleted')", name="check_valid_user_status"),
        Index("ix_users_pending_normalized_email", "pending_normalized_email", unique=True, postgresql_where="pending_normalized_email IS NOT NULL"),
    )

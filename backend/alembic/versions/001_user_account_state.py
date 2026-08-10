"""User account state and profile fields

Revision ID: 001_user_account_state
Revises: 4b59c12f67e7
Create Date: 2026-08-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_user_account_state'
down_revision = '4b59c12f67e7'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add status column as nullable first
    op.add_column('users', sa.Column('status', sa.String(length=30), nullable=True))
    
    # 2. Add profile and state columns
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), server_default='0', nullable=False))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('password_changed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('pending_email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('pending_normalized_email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('pending_email_requested_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('preferred_language', sa.String(length=10), server_default='ar', nullable=False))
    op.add_column('users', sa.Column('terms_accepted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('terms_version', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('privacy_version', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('suspended_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('suspended_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('users', sa.Column('suspension_reason', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # Foreign key for suspended_by_id
    op.create_foreign_key('fk_users_suspended_by_id', 'users', 'users', ['suspended_by_id'], ['id'], ondelete='SET NULL')

    # 3. Backfill existing users: verified users become 'active', set email_verified_at
    op.execute("UPDATE users SET status = 'active', email_verified_at = created_at WHERE is_verified = true")
    op.execute("UPDATE users SET status = 'pending_verification' WHERE is_verified = false OR status IS NULL")

    # 4. Make status NOT NULL
    op.alter_column('users', 'status', nullable=False, server_default='pending_verification')

    # 5. Add constraints & indexes
    op.create_check_constraint('check_valid_user_status', 'users', "status IN ('pending_verification', 'active', 'suspended', 'deleted')")
    op.create_index('ix_users_pending_normalized_email', 'users', ['pending_normalized_email'], unique=True, postgresql_where=sa.text('pending_normalized_email IS NOT NULL'))

def downgrade() -> None:
    op.drop_index('ix_users_pending_normalized_email', table_name='users')
    op.drop_constraint('check_valid_user_status', 'users', type_='check')
    op.drop_constraint('fk_users_suspended_by_id', 'users', type_='foreignkey')
    op.drop_column('users', 'deleted_at')
    op.drop_column('users', 'suspension_reason')
    op.drop_column('users', 'suspended_by_id')
    op.drop_column('users', 'suspended_at')
    op.drop_column('users', 'privacy_version')
    op.drop_column('users', 'terms_version')
    op.drop_column('users', 'terms_accepted_at')
    op.drop_column('users', 'preferred_language')
    op.drop_column('users', 'pending_email_requested_at')
    op.drop_column('users', 'pending_normalized_email')
    op.drop_column('users', 'pending_email')
    op.drop_column('users', 'password_changed_at')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'status')

"""Session and refresh-token changes

Revision ID: 002_session_token_changes
Revises: 001_user_account_state
Create Date: 2026-08-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '002_session_token_changes'
down_revision = '001_user_account_state'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add token_family_id as nullable first
    op.add_column('user_sessions', sa.Column('token_family_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # 2. Add device and expiration fields
    op.add_column('user_sessions', sa.Column('device_name', sa.String(length=255), nullable=True))
    op.add_column('user_sessions', sa.Column('browser', sa.String(length=100), nullable=True))
    op.add_column('user_sessions', sa.Column('operating_system', sa.String(length=100), nullable=True))
    op.add_column('user_sessions', sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user_sessions', sa.Column('idle_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('user_sessions', sa.Column('revoke_reason', sa.String(length=100), nullable=True))

    # 3. Backfill existing sessions
    op.execute("UPDATE user_sessions SET token_family_id = gen_random_uuid() WHERE token_family_id IS NULL")
    op.execute("UPDATE user_sessions SET last_used_at = created_at WHERE last_used_at IS NULL")

    # 4. Make token_family_id and last_used_at NOT NULL
    op.alter_column('user_sessions', 'token_family_id', nullable=False)
    op.alter_column('user_sessions', 'last_used_at', nullable=False)

    # 5. Create index
    op.create_index('ix_user_sessions_token_family_id', 'user_sessions', ['token_family_id'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_user_sessions_token_family_id', table_name='user_sessions')
    op.drop_column('user_sessions', 'revoke_reason')
    op.drop_column('user_sessions', 'idle_expires_at')
    op.drop_column('user_sessions', 'last_used_at')
    op.drop_column('user_sessions', 'operating_system')
    op.drop_column('user_sessions', 'browser')
    op.drop_column('user_sessions', 'device_name')
    op.drop_column('user_sessions', 'token_family_id')

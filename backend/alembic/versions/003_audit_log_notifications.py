"""Audit log, token-purpose, and notification-preference tables

Revision ID: 003_audit_log_notifications
Revises: 002_session_token_changes
Create Date: 2026-08-04

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '003_audit_log_notifications'
down_revision = '002_session_token_changes'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Create security_audit_logs table
    op.create_table(
        'security_audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_security_audit_logs_user_id', 'security_audit_logs', ['user_id'], unique=False)
    op.create_index('ix_security_audit_logs_event_type', 'security_audit_logs', ['event_type'], unique=False)
    op.create_index('ix_security_audit_logs_created_at', 'security_audit_logs', ['created_at'], unique=False)

    # 2. Create user_notification_preferences table
    op.create_table(
        'user_notification_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('new_login_alerts', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('new_device_alerts', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('optional_product_emails', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_user_notification_preferences_user_id', 'user_notification_preferences', ['user_id'], unique=True)

    # 3. Add token fields to email_verifications & password_resets
    op.add_column('email_verifications', sa.Column('purpose', sa.String(length=50), server_default='initial_email_verification', nullable=False))
    op.add_column('email_verifications', sa.Column('target_email', sa.String(length=255), nullable=True))
    op.add_column('email_verifications', sa.Column('invalidated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('email_verifications', sa.Column('attempt_count', sa.Integer(), server_default='0', nullable=False))

    op.add_column('password_resets', sa.Column('purpose', sa.String(length=50), server_default='password_reset', nullable=False))
    op.add_column('password_resets', sa.Column('invalidated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('password_resets', sa.Column('attempt_count', sa.Integer(), server_default='0', nullable=False))

def downgrade() -> None:
    op.drop_column('password_resets', 'attempt_count')
    op.drop_column('password_resets', 'invalidated_at')
    op.drop_column('password_resets', 'purpose')

    op.drop_column('email_verifications', 'attempt_count')
    op.drop_column('email_verifications', 'invalidated_at')
    op.drop_column('email_verifications', 'target_email')
    op.drop_column('email_verifications', 'purpose')

    op.drop_index('ix_user_notification_preferences_user_id', table_name='user_notification_preferences')
    op.drop_table('user_notification_preferences')

    op.drop_index('ix_security_audit_logs_created_at', table_name='security_audit_logs')
    op.drop_index('ix_security_audit_logs_event_type', table_name='security_audit_logs')
    op.drop_index('ix_security_audit_logs_user_id', table_name='security_audit_logs')
    op.drop_table('security_audit_logs')

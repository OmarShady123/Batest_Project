import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTourAccess } from '../hooks/useTourAccess';
import { Link } from 'react-router-dom';
import { Shield, LockKey } from '@phosphor-icons/react';
import { useI18n } from '../i18n';

export function TourAccessGate({ children }) {
  const { t } = useI18n();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { access, loading: accessLoading, error, requestAccess, canAccess, effectiveStatus } = useTourAccess();

  // E2E test bypass
  if (typeof window !== 'undefined' && window.localStorage.getItem('e2e_bypass_auth') === 'true') {
    return children;
  }

  if (authLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="login-mock" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <LockKey size={48} style={{ color: 'var(--accent)', margin: '0 auto 15px' }} />
          <h2>{t('gate.loginRequiredTitle')}</h2>
          <p style={{ margin: '15px 0 25px' }}>{t('gate.loginRequiredText')}</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <Link className="button primary" to="/login">{t('gate.login')}</Link>
            <Link className="button secondary" to="/signup" style={{ border: '1px solid var(--line)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' }}>{t('gate.signup')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return children;
  }

  if (accessLoading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const handleRequest = async () => {
    try {
      await requestAccess();
    } catch (err) {
      // Error handled by hook
    }
  };

  const renderGateMessage = (title, description, showButton = false, buttonText = t('gate.defaultButton')) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
        <div className="login-mock" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <Shield size={48} style={{ color: 'var(--accent)', margin: '0 auto 15px' }} />
          <h2>{title}</h2>
          <p style={{ margin: '15px 0 25px', fontSize: '18px' }}>{description}</p>
          {error && <p className="form-error" style={{ marginBottom: '15px' }}>{error}</p>}
          {showButton && (
            <button className="button primary" onClick={handleRequest} style={{ margin: '0 auto' }}>
              {buttonText}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!effectiveStatus || effectiveStatus === 'not_requested') {
    return renderGateMessage(
      t('gate.noneTitle'),
      t('gate.noneText'),
      true
    );
  }

  if (effectiveStatus === 'pending') {
    return renderGateMessage(
      t('gate.pendingTitle'),
      t('gate.pendingText')
    );
  }

  if (effectiveStatus === 'rejected') {
    const reason = access?.rejection_reason ? t('gate.rejectionReason', { reason: access.rejection_reason }) : t('gate.noReason');
    return renderGateMessage(
      t('gate.rejectedTitle'),
      t('gate.rejectedText', { reason }),
      true,
      t('gate.sendNewRequest')
    );
  }

  if (effectiveStatus === 'expired') {
    return renderGateMessage(
      t('gate.expiredTitle'),
      t('gate.expiredText'),
      true,
      t('gate.requestNewPermit')
    );
  }

  if (effectiveStatus === 'revoked') {
    return renderGateMessage(
      t('gate.revokedTitle'),
      t('gate.revokedText'),
      true,
      t('gate.submitNewRequest')
    );
  }

  if (canAccess) {
    return children;
  }

  return renderGateMessage(
    t('gate.unavailableTitle'),
    t('gate.unavailableText'),
    true
  );
}

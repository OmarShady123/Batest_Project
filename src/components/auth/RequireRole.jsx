import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldWarning } from '@phosphor-icons/react';
import { useI18n } from '../../i18n';

export function RequireRole({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="loading-spinner" aria-label={t('auth.guards.loading')} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return (
      <section className="page-shell" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <ShieldWarning size={64} style={{ color: '#dc2626', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>{t('auth.guards.forbiddenTitle')}</h1>
          <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '24px' }}>
            {t('auth.guards.forbiddenText', { roles: allowedRoles.join(', ') })}
          </p>
          <Link to="/account" className="button primary">{t('auth.guards.backToAccount')}</Link>
        </div>
      </section>
    );
  }

  return children;
}

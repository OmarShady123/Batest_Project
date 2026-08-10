import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockKeyOpen, ArrowLeft, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { PageHero } from '../../components/Layout';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { PasswordRequirements } from '../../components/auth/PasswordRequirements';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { useI18n } from '../../i18n';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError(t('auth.reset.noToken'));
      return;
    }

    // Clean token from browser URL history
    try {
      if (window.history && window.history.replaceState) {
        const cleanHash = window.location.hash.split('?')[0];
        window.history.replaceState(null, '', window.location.pathname + cleanHash);
      }
    } catch (e) {
      // Ignore
    }

    const validateToken = async () => {
      try {
        await apiClient.post('/api/v1/auth/validate-reset-token', { token });
        setTokenValid(true);
      } catch (err) {
        setTokenError(getErrorMessage(err, t('auth.reset.invalidToken')));
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('auth.reset.mismatch'));
      return;
    }

    if (newPassword.length < 15) {
      setError(t('auth.reset.tooShort'));
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(getErrorMessage(err, t('auth.reset.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '18px', color: 'var(--muted)' }}>{t('auth.reset.checking')}</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <PageHero label={t('auth.reset.errorLabel')} title={t('auth.reset.errorTitle')} text={t('auth.reset.errorText')} />
        <section className="page-shell section" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <div className="login-mock" style={{ width: '100%', padding: '40px 30px' }}>
            <WarningCircle size={64} style={{ color: '#dc2626', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>{t('auth.reset.invalidHeading')}</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>{tokenError}</p>
            <Link to="/forgot-password" className="button primary" style={{ width: '100%', padding: '12px' }}>
              {t('auth.reset.requestNew')}
            </Link>
          </div>
        </section>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <PageHero label={t('auth.reset.successLabel')} title={t('auth.reset.successTitle')} text={t('auth.reset.successText')} />
        <section className="page-shell section" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
          <div className="login-mock" style={{ width: '100%', padding: '40px 30px' }}>
            <CheckCircle size={72} style={{ color: '#16a34a', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '24px', margin: '0 0 10px' }}>{t('auth.reset.successHeading')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '20px' }}>
              {t('auth.reset.successBody')}
            </p>
            <Link to="/login" className="button primary" style={{ width: '100%', padding: '12px' }}>
              {t('auth.reset.goToLogin')}
            </Link>
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('auth.reset.label')}
        title={t('auth.reset.title')}
        text={t('auth.reset.text')}
      />
      <section className="page-shell section" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <form className="login-mock" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <LockKeyOpen size={42} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: '10px 0 5px' }}>{t('auth.reset.heading')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{t('auth.reset.subheading')}</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }} role="alert">
              <WarningCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <PasswordInput
            label={t('auth.reset.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={submitting}
            autocomplete="new-password"
          />

          <PasswordStrength password={newPassword} />
          <PasswordRequirements password={newPassword} />

          <PasswordInput
            label={t('auth.reset.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            autocomplete="new-password"
          />

          <button
            type="submit"
            className="button primary"
            disabled={submitting}
            style={{ width: '100%', padding: '14px', marginTop: '15px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                <span>{t('auth.reset.saving')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.reset.submit')}</span>
                <ArrowLeft size={20} />
              </>
            )}
          </button>
        </form>
      </section>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockKey, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { PageHero } from '../../components/Layout';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { getErrorMessage } from '../../utils/errorHelper';
import { useI18n } from '../../i18n';
import { Forward } from '../../components/Forward';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);


  const handleGoogleCredential = async (credential) => {
    setError('');
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      await googleLogin(credential, false);
      navigate(redirect, { replace: true });
    } catch (err) {
      const code = err?.response?.data?.detail?.code;
      if (code === 'GOOGLE_SIGNUP_REQUIRED') {
        setError(t('auth.google.signupRequired'));
      } else {
        setError(getErrorMessage(err, t('auth.google.failed')));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setSubmitting(true);

    try {
      await login(email, password, rememberMe);
      navigate(redirect, { replace: true });
    } catch (err) {
      const code = err?.response?.data?.detail?.code;
      if (code === 'EMAIL_NOT_VERIFIED') setNeedsVerification(true);
      setError(getErrorMessage(err, t('auth.login.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('auth.login.label')}
        title={t('auth.login.title')}
        text={t('auth.login.text')}
      />
      <section className="page-shell section" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <form className="login-mock" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <LockKey size={42} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: '10px 0 5px' }}>{t('auth.login.heading')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{t('auth.login.subheading')}</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }} role="alert">
              <WarningCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {needsVerification && email && (
            <Link to="/check-email" state={{ email, purpose: 'verify' }} className="button secondary" style={{ width: '100%', justifyContent: 'center' }}>
              {t('auth.login.resendVerification')}
            </Link>
          )}

          <GoogleSignInButton onCredential={handleGoogleCredential} mode="signin" />
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)', fontSize: '13px' }}>
              <span style={{ height: 1, background: 'var(--line)', flex: 1 }} />
              <span>{t('auth.google.or')}</span>
              <span style={{ height: 1, background: 'var(--line)', flex: 1 }} />
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('common.email')}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@bastet-temple.org"
              autoComplete="email"
              required
              disabled={submitting}
              style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #bfc6c1', fontSize: '15px', direction: 'ltr', textAlign: 'left' }}
            />
          </label>

          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autocomplete="current-password"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={submitting}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
              />
              <span>{t('auth.login.rememberMe')}</span>
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            className="button primary"
            disabled={submitting}
            style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                <span>{t('auth.login.submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.login.submit')}</span>
                <Forward size={20} />
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--line)', fontSize: '14px', color: 'var(--muted)' }}>
            <span>{t('auth.login.noAccount')}</span>
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none' }}>
              {t('auth.login.createAccount')}
            </Link>
          </div>
        </form>
      </section>
    </motion.div>
  );
}

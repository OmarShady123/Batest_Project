import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { PageHero } from '../../components/Layout';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { PasswordRequirements } from '../../components/auth/PasswordRequirements';
import { getErrorMessage } from '../../utils/errorHelper';
import { useI18n } from '../../i18n';
import { Forward } from '../../components/Forward';

export default function Signup() {
  const { signup } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.signup.mismatch'));
      return;
    }

    if (password.length < 15) {
      setError(t('auth.signup.tooShort'));
      return;
    }

    if (!termsAccepted) {
      setError(t('auth.signup.mustAcceptTerms'));
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password, confirmPassword, termsAccepted);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('auth.signup.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('auth.signup.label')}
        title={t('auth.signup.title')}
        text={t('auth.signup.text')}
      />
      <section className="page-shell section" style={{ maxWidth: '580px', margin: '0 auto' }}>
        <form className="login-mock" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <UserPlus size={42} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: '10px 0 5px' }}>{t('auth.signup.heading')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{t('auth.signup.subheading')}</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }} role="alert">
              <WarningCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('auth.signup.fullName')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.signup.namePlaceholder')}
              autoComplete="name"
              required
              disabled={submitting}
              style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #bfc6c1', fontSize: '15px' }}
            />
          </label>

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
            label={t('auth.signup.passwordLabel')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autocomplete="new-password"
          />

          <PasswordStrength password={password} />
          <PasswordRequirements password={password} email={email} name={name} />

          <PasswordInput
            label={t('auth.signup.confirmPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={submitting}
            autocomplete="new-password"
          />

          <div style={{ marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'start', gap: '8px', cursor: 'pointer', fontSize: '13px', lineHeight: '1.5', fontWeight: 'normal' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={submitting}
                required
                style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--accent)' }}
              />
              <span>
                {t('auth.signup.termsPrefix')}<a href="#/terms" style={{ color: 'var(--accent)' }}>{t('auth.signup.termsLink')}</a>{t('auth.signup.termsMiddle')}<a href="#/privacy" style={{ color: 'var(--accent)' }}>{t('auth.signup.privacyLink')}</a>{t('auth.signup.termsSuffix')}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="button primary"
            disabled={submitting}
            style={{ width: '100%', padding: '14px', marginTop: '15px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                <span>{t('auth.signup.submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.signup.submit')}</span>
                <Forward size={20} />
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--line)', fontSize: '14px', color: 'var(--muted)' }}>
            <span>{t('auth.signup.haveAccount')}</span>
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none' }}>
              {t('auth.signup.login')}
            </Link>
          </div>
        </form>
      </section>
    </motion.div>
  );
}

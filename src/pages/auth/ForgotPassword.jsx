import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { PageHero } from '../../components/Layout';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { useI18n } from '../../i18n';
import { Forward } from '../../components/Forward';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email });
      navigate('/check-email', { state: { email }, replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('auth.forgot.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('auth.forgot.label')}
        title={t('auth.forgot.title')}
        text={t('auth.forgot.text')}
      />
      <section className="page-shell section" style={{ maxWidth: '520px', margin: '0 auto' }}>
        <form className="login-mock" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <Key size={42} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: '10px 0 5px' }}>{t('auth.forgot.heading')}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{t('auth.forgot.subheading')}</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }} role="alert">
              <WarningCircle size={20} style={{ flexShrink: 0 }} />
              <span>{error}</span>
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

          <button
            type="submit"
            className="button primary"
            disabled={submitting}
            style={{ width: '100%', padding: '14px', marginTop: '10px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {submitting ? (
              <>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                <span>{t('auth.forgot.submitting')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.forgot.submit')}</span>
                <Forward size={20} />
              </>
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--line)', fontSize: '14px', color: 'var(--muted)' }}>
            <span>{t('auth.forgot.remembered')}</span>
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none' }}>
              {t('auth.forgot.backToLogin')}
            </Link>
          </div>
        </form>
      </section>
    </motion.div>
  );
}

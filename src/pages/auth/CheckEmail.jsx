import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeSimple, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { PageHero } from '../../components/Layout';
import { useI18n } from '../../i18n';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { Backward } from '../../components/Forward';

export default function CheckEmail() {
  const location = useLocation();
  const { t } = useI18n();
  const email = location.state?.email || '';
  const purpose = location.state?.purpose || 'reset';
  const isVerification = purpose === 'verify';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const resendVerification = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    setMessage('');
    try {
      const res = await apiClient.post('/api/v1/auth/resend-verification', { email });
      setMessage(res.data?.detail || t('auth.checkEmail.resendSuccess'));
    } catch (err) {
      setError(getErrorMessage(err, t('auth.checkEmail.resendFailed')));
    } finally {
      setResending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('auth.checkEmail.label')}
        title={isVerification ? t('auth.checkEmail.verifyTitle') : t('auth.checkEmail.title')}
        text={isVerification ? t('auth.checkEmail.verifyText') : t('auth.checkEmail.text')}
      />
      <section className="page-shell section" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <div className="login-mock" style={{ width: '100%', padding: '40px 30px' }}>
          <EnvelopeSimple size={64} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', margin: '0 0 10px' }}>
            {isVerification ? t('auth.checkEmail.verifyHeading') : t('auth.checkEmail.heading')}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            {isVerification ? t('auth.checkEmail.verifyBody') : t('auth.checkEmail.body')}
            {email && <><br /><strong dir="ltr">{email}</strong></>}
            <br /><strong>{isVerification ? t('auth.checkEmail.verifyValidity') : t('auth.checkEmail.validity')}</strong>
          </p>

          {message && <div style={{ color: '#166534', marginBottom: '12px' }}><CheckCircle size={18} /> {message}</div>}
          {error && <div role="alert" style={{ color: '#991b1b', marginBottom: '12px' }}><WarningCircle size={18} /> {error}</div>}

          {isVerification && email && (
            <button type="button" className="button secondary" onClick={resendVerification} disabled={resending} style={{ width: '100%', marginBottom: '12px' }}>
              {resending ? t('auth.checkEmail.resending') : t('auth.checkEmail.resend')}
            </button>
          )}

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
            <Link to="/login" className="button primary" style={{ width: '100%', padding: '12px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Backward size={18} />
              <span>{t('auth.checkEmail.backToLogin')}</span>
            </Link>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

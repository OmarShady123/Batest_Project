import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EnvelopeSimple, ArrowRight } from '@phosphor-icons/react';
import { PageHero } from '../../components/Layout';
import { useI18n } from '../../i18n';
import { Backward } from '../../components/Forward';

export default function CheckEmail() {
  const location = useLocation();
  const { t } = useI18n();
  const email = location.state?.email || '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('auth.checkEmail.label')}
        title={t('auth.checkEmail.title')}
        text={t('auth.checkEmail.text')}
      />
      <section className="page-shell section" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <div className="login-mock" style={{ width: '100%', padding: '40px 30px' }}>
          <EnvelopeSimple size={64} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', margin: '0 0 10px' }}>{t('auth.checkEmail.heading')}</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
            {t('auth.checkEmail.body')}<br />
            <strong>{t('auth.checkEmail.validity')}</strong>
          </p>

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

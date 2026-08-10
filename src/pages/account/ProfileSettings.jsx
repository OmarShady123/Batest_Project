import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { CheckCircle, WarningCircle, EnvelopeSimple } from '@phosphor-icons/react';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { useI18n } from '../../i18n';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const { t, setLang: applySiteLanguage } = useI18n();

  const [name, setName] = useState(user?.name || '');
  const [lang, setLang] = useState(user?.preferred_language || 'ar');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Email change state
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    setSavingProfile(true);

    try {
      await updateProfile({ name, preferred_language: lang });
      applySiteLanguage(lang);
      setProfileMsg(t('account.profile.saved'));
    } catch (err) {
      setProfileError(getErrorMessage(err, t('account.profile.saveFailed')));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmailChangeSubmit = async (e) => {
    e.preventDefault();
    setEmailMsg('');
    setEmailError('');
    setEmailSubmitting(true);

    try {
      const res = await apiClient.post('/api/v1/account/change-email', {
        new_email: newEmail,
        current_password: currentPassword,
      });
      setEmailMsg(res.data?.detail || t('account.profile.emailSent'));
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      setEmailError(getErrorMessage(err, t('account.profile.emailFailed')));
    } finally {
      setEmailSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', color: 'var(--accent)', fontSize: '22px' }}>{t('account.profile.title')}</h2>

      {profileMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', marginBottom: '20px' }}>
          <CheckCircle size={20} />
          <span>{profileMsg}</span>
        </div>
      )}

      {profileError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '20px' }}>
          <WarningCircle size={20} />
          <span>{profileError}</span>
        </div>
      )}

      <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('account.profile.fullName')}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('account.profile.namePlaceholder')}
            required
            disabled={savingProfile}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bfc6c1', fontSize: '15px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('account.profile.currentEmail')}</span>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '15px', direction: 'ltr', textAlign: 'left' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('account.profile.preferredLanguage')}</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            disabled={savingProfile}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bfc6c1', fontSize: '15px' }}
          >
            <option value="ar">{t('account.profile.optionAr')}</option>
            <option value="en">{t('account.profile.optionEn')}</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button type="submit" className="button primary" disabled={savingProfile}>
            {savingProfile ? t('account.profile.saving') : t('account.profile.save')}
          </button>
          <button type="button" className="button secondary" onClick={() => setShowEmailChange(!showEmailChange)}>
            {showEmailChange ? t('account.profile.cancelEmailChange') : t('account.profile.changeEmail')}
          </button>
        </div>
      </form>

      {/* Email Change Section */}
      {showEmailChange && (
        <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: '1px solid var(--line)', maxWidth: '480px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--ink)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EnvelopeSimple size={22} style={{ color: 'var(--accent)' }} />
            <span>{t('account.profile.requestEmailChange')}</span>
          </h3>

          {emailMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', marginBottom: '15px' }}>
              <CheckCircle size={20} />
              <span>{emailMsg}</span>
            </div>
          )}

          {emailError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '15px' }}>
              <WarningCircle size={20} />
              <span>{emailError}</span>
            </div>
          )}

          <form onSubmit={handleEmailChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{t('account.profile.newEmail')}</span>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new.email@bastet-temple.org"
                required
                disabled={emailSubmitting}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bfc6c1', fontSize: '15px', direction: 'ltr', textAlign: 'left' }}
              />
            </label>

            <PasswordInput
              label={t('account.profile.confirmPassword')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={emailSubmitting}
            />

            <button type="submit" className="button primary" disabled={emailSubmitting}>
              {emailSubmitting ? t('account.profile.sending') : t('account.profile.sendConfirmation')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { PasswordStrength } from '../../components/auth/PasswordStrength';
import { PasswordRequirements } from '../../components/auth/PasswordRequirements';
import { CheckCircle, WarningCircle, GoogleLogo } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';

export default function SecuritySettings() {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');



  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError(t('account.security.mismatch'));
      return;
    }

    if (newPassword.length < 15) {
      setPwError(t('account.security.tooShort'));
      return;
    }

    setPwSubmitting(true);
    try {
      const res = await apiClient.post('/api/v1/account/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setPwMsg(res.data?.detail || t('account.security.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(getErrorMessage(err, t('account.security.passwordFailed')));
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', color: 'var(--accent)', fontSize: '22px' }}>{t('account.security.title')}</h2>

      {/* Change Password Form */}
      <div style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid var(--line)', maxWidth: '480px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>{t('account.security.changePasswordTitle')}</h3>

        {user?.google_connected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '15px' }}>
            <GoogleLogo size={20} />
            <span>{t('account.security.googleConnected')}</span>
          </div>
        )}

        {!user?.has_local_password && (
          <div style={{ padding: '14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '15px', color: '#92400e' }}>
            <p style={{ margin: '0 0 10px' }}>{t('account.security.noLocalPassword')}</p>
            <Link to="/forgot-password" className="button secondary">{t('account.security.setPassword')}</Link>
          </div>
        )}

        {pwMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', marginBottom: '15px' }}>
            <CheckCircle size={20} />
            <span>{pwMsg}</span>
          </div>
        )}

        {pwError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '15px' }}>
            <WarningCircle size={20} />
            <span>{pwError}</span>
          </div>
        )}

        {user?.has_local_password && <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <PasswordInput
            label={t('account.security.currentPassword')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={pwSubmitting}
            autocomplete="current-password"
          />

          <PasswordInput
            label={t('account.security.newPassword')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={pwSubmitting}
            autocomplete="new-password"
          />

          <PasswordStrength password={newPassword} />
          <PasswordRequirements password={newPassword} email={user?.email} name={user?.name} />

          <PasswordInput
            label={t('account.security.confirmNewPassword')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={pwSubmitting}
            autocomplete="new-password"
          />

          <button type="submit" className="button primary" disabled={pwSubmitting}>
            {pwSubmitting ? t('account.security.saving') : t('account.security.updatePassword')}
          </button>
        </form>}
      </div>

    </div>
  );
}

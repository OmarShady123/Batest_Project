import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { WarningCircle, Trash } from '@phosphor-icons/react';
import { useI18n } from '../../i18n';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useI18n();

  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');

    const phrase = confirmationPhrase.trim().toUpperCase();
    if (phrase !== 'DELETE' && phrase !== 'حذف') {
      setError(t('account.delete.badPhrase'));
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.delete('/api/v1/account', {
        data: {
          current_password: currentPassword,
          confirmation_phrase: confirmationPhrase,
        }
      });
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, t('account.delete.failed')));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '580px' }}>
      <h2 style={{ margin: '0 0 20px', color: '#dc2626', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trash size={26} />
        <span>{t('account.delete.title')}</span>
      </h2>

      <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', marginBottom: '25px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WarningCircle size={22} />
          <span>{t('account.delete.warningTitle')}</span>
        </h4>
        <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
          {t('account.delete.warningText')}
        </p>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '20px' }}>
          <WarningCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <PasswordInput
          label={t('account.delete.passwordLabel')}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={submitting}
        />

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>{t('account.delete.phraseLabel')}</span>
          <input
            type="text"
            value={confirmationPhrase}
            onChange={(e) => setConfirmationPhrase(e.target.value)}
            placeholder="DELETE"
            required
            disabled={submitting}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #bfc6c1', fontSize: '15px', direction: 'ltr', textAlign: 'center', fontWeight: 'bold' }}
          />
        </label>

        <button
          type="submit"
          className="button primary"
          disabled={submitting}
          style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', padding: '14px', marginTop: '10px', fontSize: '16px' }}
        >
          {submitting ? t('account.delete.deleting') : t('account.delete.confirm')}
        </button>
      </form>
    </div>
  );
}

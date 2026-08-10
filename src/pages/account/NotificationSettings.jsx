import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { CheckCircle, WarningCircle, Bell, ShieldCheck } from '@phosphor-icons/react';
import { useI18n } from '../../i18n';

export default function NotificationSettings() {
  const { t } = useI18n();
  const [newLoginAlerts, setNewLoginAlerts] = useState(true);
  const [newDeviceAlerts, setNewDeviceAlerts] = useState(true);
  const [optionalProductEmails, setOptionalProductEmails] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await apiClient.get('/api/v1/account/notification-preferences');
        if (res.data) {
          setNewLoginAlerts(res.data.new_login_alerts);
          setNewDeviceAlerts(res.data.new_device_alerts);
          setOptionalProductEmails(res.data.optional_product_emails);
        }
      } catch (err) {
        setError(getErrorMessage(err, t('account.notifications.fetchFailed')));
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setSaving(true);

    try {
      await apiClient.patch('/api/v1/account/notification-preferences', {
        new_login_alerts: newLoginAlerts,
        new_device_alerts: newDeviceAlerts,
        optional_product_emails: optionalProductEmails,
      });
      setMsg(t('account.notifications.saved'));
    } catch (err) {
      setError(getErrorMessage(err, t('account.notifications.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--muted)' }}>{t('account.notifications.loading')}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '580px' }}>
      <h2 style={{ margin: '0 0 20px', color: 'var(--accent)', fontSize: '22px' }}>{t('account.notifications.title')}</h2>

      {msg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '14px', marginBottom: '20px' }}>
          <CheckCircle size={20} />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px', marginBottom: '20px' }}>
          <WarningCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: 'var(--soft)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: '#16a34a' }} />
            <span>{t('account.notifications.mandatoryTitle')}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, lineHeight: '1.5' }}>
            {t('account.notifications.mandatoryText')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newLoginAlerts}
              onChange={(e) => setNewLoginAlerts(e.target.checked)}
              disabled={saving}
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--ink)' }}>{t('account.notifications.loginTitle')}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{t('account.notifications.loginText')}</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newDeviceAlerts}
              onChange={(e) => setNewDeviceAlerts(e.target.checked)}
              disabled={saving}
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--ink)' }}>{t('account.notifications.deviceTitle')}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{t('account.notifications.deviceText')}</div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={optionalProductEmails}
              onChange={(e) => setOptionalProductEmails(e.target.checked)}
              disabled={saving}
              style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--ink)' }}>{t('account.notifications.updatesTitle')}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{t('account.notifications.updatesText')}</div>
            </div>
          </label>
        </div>

        <button type="submit" className="button primary" disabled={saving} style={{ alignSelf: 'start', marginTop: '10px' }}>
          {saving ? t('account.notifications.saving') : t('account.notifications.save')}
        </button>
      </form>
    </div>
  );
}

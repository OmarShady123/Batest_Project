import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { Devices, Desktop, DeviceMobile, CheckCircle, WarningCircle, Trash } from '@phosphor-icons/react';
import { useI18n } from '../../i18n';

export default function SessionManagement() {
  const { t, isAr } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/v1/sessions');
      setSessions(res.data?.sessions || []);
    } catch (err) {
      setError(getErrorMessage(err, t('account.sessions.fetchFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    setMsg('');
    setError('');
    try {
      await apiClient.delete(`/api/v1/sessions/${sessionId}`);
      setMsg(t('account.sessions.revoked'));
      fetchSessions();
    } catch (err) {
      setError(getErrorMessage(err, t('account.sessions.revokeFailed')));
    }
  };

  const handleLogoutOthers = async () => {
    setMsg('');
    setError('');
    try {
      const res = await apiClient.post('/api/v1/sessions/logout-other-sessions');
      setMsg(res.data?.detail || t('account.sessions.othersLoggedOut'));
      fetchSessions();
    } catch (err) {
      setError(getErrorMessage(err, t('account.sessions.logoutOthersFailed')));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--accent)', fontSize: '22px' }}>{t('account.sessions.title')}</h2>
        {sessions.length > 1 && (
          <button type="button" className="button secondary" onClick={handleLogoutOthers} style={{ color: '#dc2626', borderColor: '#fecaca', fontSize: '13px' }}>
            {t('account.sessions.logoutOthers')}
          </button>
        )}
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
        {t('account.sessions.description')}
      </p>

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

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--muted)' }}>{t('account.sessions.loading')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sessions.map((sess) => (
            <div
              key={sess.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '16px',
                borderRadius: '8px',
                border: sess.is_current ? '2px solid var(--accent)' : '1px solid var(--line)',
                backgroundColor: sess.is_current ? 'var(--soft)' : '#ffffff',
                gap: '15px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--soft)', display: 'grid', placeItems: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                  {sess.device_name?.includes('Mobile') ? <DeviceMobile size={24} /> : <Desktop size={24} />}
                </div>

                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{sess.device_name} — {sess.browser}</span>
                    {sess.is_current && (
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                        {t('account.sessions.current')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                    {t('account.sessions.osLabel')} {sess.operating_system} | {t('account.sessions.ipLabel')} <code style={{ direction: 'ltr', display: 'inline-block' }}>{sess.ip_address}</code>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                    {t('account.sessions.lastActive')} {new Date(sess.last_used_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB')}
                  </div>
                </div>
              </div>

              {!sess.is_current && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.id)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash size={16} />
                  <span>{t('account.sessions.revoke')}</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

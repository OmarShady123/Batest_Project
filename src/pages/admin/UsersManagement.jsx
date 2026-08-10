import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MagnifyingGlass, UserGear, LockKey, LockKeyOpen, ShieldWarning, ArrowClockwise, EnvelopeSimple, CheckCircle, WarningCircle, Trash } from '@phosphor-icons/react';
import { PageHero } from '../../components/Layout';
import apiClient from '../../services/apiClient';
import { getErrorMessage } from '../../utils/errorHelper';
import { useI18n } from '../../i18n';

export default function UsersManagement() {
  const { t, isAr } = useI18n();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  // Action Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null); // 'role' | 'suspend'
  const [newRole, setNewRole] = useState('visitor');
  const [suspendReason, setSuspendReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Active Tab: users | evaluations | audit
  const [activeTab, setActiveTab] = useState('users');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationsTotal, setEvaluationsTotal] = useState(0);
  const [evaluationsLoading, setEvaluationsLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('user_status', statusFilter);
      if (verifiedFilter !== '') params.append('is_verified', verifiedFilter);
      params.append('page', page);
      params.append('page_size', 20);

      const res = await apiClient.get(`/api/v1/admin/users?${params.toString()}`);
      setUsers(res.data?.users || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, t('admin.fetchFailed')));
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await apiClient.get('/api/v1/admin/users/audit-logs?page=1&page_size=50');
      setAuditLogs(res.data?.logs || []);
    } catch (err) {
      // Ignore
    } finally {
      setAuditLoading(false);
    }
  };

  // Evaluations store language-independent slugs. Rows submitted before that
  // change hold literal Arabic, so an unknown value is shown as-is rather than
  // rendered as a missing translation key.
  const EVAL_USER_TYPES = { visitor: 'typeVisitor', student: 'typeStudent', researcher: 'typeResearcher', specialist: 'typeSpecialist' };
  const EVAL_ANSWERS = { yes: 'answerYes', partly: 'answerPartly', no: 'answerNo' };
  const userTypeLabel = (v) => (EVAL_USER_TYPES[v] ? t(`evaluation.${EVAL_USER_TYPES[v]}`) : (v || '—'));
  const understandingLabel = (v) => (EVAL_ANSWERS[v] ? t(`evaluation.${EVAL_ANSWERS[v]}`) : (v || '—'));

  const fetchEvaluations = async () => {
    setEvaluationsLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/v1/admin/evaluations/');
      setEvaluations(res.data?.evaluations || []);
      setEvaluationsTotal(res.data?.total || 0);
    } catch (err) {
      setError(getErrorMessage(err, t('admin.evalFetchFailed')));
    } finally {
      setEvaluationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'evaluations') {
      fetchEvaluations();
    } else {
      fetchAuditLogs();
    }
  }, [page, roleFilter, statusFilter, verifiedFilter, activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    setMsg('');
    setError('');
    try {
      const res = await apiClient.patch(`/api/v1/admin/users/${selectedUser.id}/role`, { new_role: newRole });
      setMsg(res.data?.detail || t('admin.roleChanged'));
      setActionType(null);
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, t('admin.roleChangeFailed')));
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    setMsg('');
    setError('');
    try {
      const res = await apiClient.post(`/api/v1/admin/users/${selectedUser.id}/suspend`, { reason: suspendReason });
      setMsg(res.data?.detail || t('admin.suspended'));
      setActionType(null);
      setSuspendReason('');
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, t('admin.suspendFailed')));
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReactivate = async (userId) => {
    setMsg('');
    setError('');
    try {
      const res = await apiClient.post(`/api/v1/admin/users/${userId}/reactivate`);
      setMsg(res.data?.detail || t('admin.reactivated'));
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, t('admin.reactivateFailed')));
    }
  };

  const handleUnlock = async (userId) => {
    setMsg('');
    setError('');
    try {
      const res = await apiClient.post(`/api/v1/admin/users/${userId}/unlock`);
      setMsg(res.data?.detail || t('admin.unlocked'));
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, t('admin.unlockFailed')));
    }
  };


  const handleSendResetPassword = async (userId) => {
    setMsg('');
    setError('');
    try {
      const res = await apiClient.post(`/api/v1/admin/users/${userId}/reset-password`);
      setMsg(res.data?.detail || t('admin.resetSent'));
    } catch (err) {
      setError(getErrorMessage(err, t('admin.resetFailed')));
    }
  };

  // Turns a visitor's tour access on or off. The endpoint accepts either value
  // from any state, so this can be flipped back and forth freely.
  const handleSetTourAccess = async (userId, granted) => {
    setMsg('');
    setError('');
    try {
      await apiClient.put(`/api/v1/admin/tour-access/user/${userId}`, { granted });
      setMsg(granted ? t('admin.tourGranted') : t('admin.tourRevoked'));
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err, t('admin.tourUpdateFailed')));
    }
  };

  const handleRevokeSessions = async (userId) => {
    setMsg('');
    setError('');
    try {
      const res = await apiClient.delete(`/api/v1/admin/users/${userId}/sessions`);
      setMsg(res.data?.detail || t('admin.sessionsRevoked'));
    } catch (err) {
      setError(getErrorMessage(err, t('admin.sessionsRevokeFailed')));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('admin.label')}
        title={t('admin.title')}
        text={t('admin.text')}
      />

      <section className="page-shell section">
        {/* Top Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`button ${activeTab === 'users' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('users')}
            >
              {t('admin.tabUsers', { total })}
            </button>
            <button
              className={`button ${activeTab === 'evaluations' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('evaluations')}
            >
              {t('admin.tabEvaluations')}
            </button>
            <button
              className={`button ${activeTab === 'audit' ? 'primary' : 'secondary'}`}
              onClick={() => setActiveTab('audit')}
            >
              {t('admin.tabAudit')}
            </button>
          </div>
        </div>

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

        {activeTab === 'users' && (
          <>
            {/* Filters Bar */}
            <div style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'end' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold' }}>{t('admin.searchLabel')}</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('admin.searchPlaceholder')}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfc6c1' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold' }}>{t('admin.roleLabel')}</span>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfc6c1' }}>
                    <option value="">{t('admin.all')}</option>
                    <option value="visitor">{t('admin.roleVisitor')}</option>
                    <option value="admin">{t('admin.roleAdmin')}</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold' }}>{t('admin.statusLabel')}</span>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfc6c1' }}>
                    <option value="">{t('admin.all')}</option>
                    <option value="active">{t('admin.statusActive')}</option>
                    <option value="pending_verification">{t('admin.statusPending')}</option>
                    <option value="suspended">{t('admin.statusSuspended')}</option>
                    <option value="deleted">{t('admin.statusDeleted')}</option>
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold' }}>{t('admin.verifiedLabel')}</span>
                  <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #bfc6c1' }}>
                    <option value="">{t('admin.all')}</option>
                    <option value="true">{t('admin.verifiedYes')}</option>
                    <option value="false">{t('admin.verifiedNo')}</option>
                  </select>
                </label>

                <button type="submit" className="button primary" style={{ padding: '9px 18px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <MagnifyingGlass size={18} />
                  <span>{t('admin.search')}</span>
                </button>
              </form>
            </div>

            {/* Users Table */}
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--muted)' }}>{t('admin.loading')}</p>
              </div>
            ) : users.length === 0 ? (
              <div style={{ backgroundColor: 'var(--paper)', padding: '40px', textAlign: 'center', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>{t('admin.noResults')}</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--soft)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colName')}</th>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colEmail')}</th>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colRole')}</th>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colStatus')}</th>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colTourAccess')}</th>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colLastLogin')}</th>
                      <th style={{ padding: '14px 16px' }}>{t('admin.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{u.name || t('admin.unnamed')}</td>
                        <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: isAr ? 'right' : 'left', fontFamily: 'monospace' }}>{u.email}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', backgroundColor: u.role === 'admin' ? '#fef3c7' : '#f1f5f9', color: u.role === 'admin' ? '#92400e' : '#475569' }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', backgroundColor: u.effective_status === 'active' ? '#dcfce7' : (u.effective_status === 'suspended' ? '#fef2f2' : (u.effective_status === 'locked' ? '#fee2e2' : '#f1f5f9')), color: u.effective_status === 'active' ? '#166534' : (u.effective_status === 'suspended' ? '#dc2626' : (u.effective_status === 'locked' ? '#991b1b' : '#64748b')) }}>
                            {u.effective_status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {u.role === 'admin' ? (
                            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{t('admin.tourAlways')}</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', backgroundColor: u.tour_can_access ? '#dcfce7' : '#f1f5f9', color: u.tour_can_access ? '#166534' : '#64748b' }}>
                                {u.tour_can_access ? t('admin.tourAllowed') : t('admin.tourBlocked')}
                              </span>
                              <button
                                type="button"
                                className={`button ${u.tour_can_access ? 'secondary' : 'primary'}`}
                                onClick={() => handleSetTourAccess(u.id, !u.tour_can_access)}
                                style={{ padding: '4px 10px', minHeight: '30px', fontSize: '12px', borderRadius: '6px' }}
                              >
                                {u.tour_can_access ? t('admin.tourRevokeAction') : t('admin.tourGrantAction')}
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--muted)' }}>
                          {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB') : t('admin.neverLoggedIn')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="button secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => { setSelectedUser(u); setNewRole(u.role); setActionType('role'); }}
                            >
                              {t('admin.changeRole')}
                            </button>

                            {u.effective_status === 'suspended' ? (
                              <button
                                type="button"
                                className="button primary"
                                style={{ padding: '4px 8px', fontSize: '12px', backgroundColor: '#16a34a' }}
                                onClick={() => handleReactivate(u.id)}
                              >
                                {t('admin.reactivate')}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="button secondary"
                                style={{ padding: '4px 8px', fontSize: '12px', color: '#dc2626', borderColor: '#fecaca' }}
                                onClick={() => { setSelectedUser(u); setActionType('suspend'); }}
                              >
                                {t('admin.suspend')}
                              </button>
                            )}

                            {u.effective_status === 'locked' && (
                              <button
                                type="button"
                                className="button secondary"
                                style={{ padding: '4px 8px', fontSize: '12px', color: '#0284c7' }}
                                onClick={() => handleUnlock(u.id)}
                              >
                                {t('admin.unlock')}
                              </button>
                            )}

                            <button
                              type="button"
                              className="button secondary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              title={t('admin.resetPasswordTitle')}
                              onClick={() => handleSendResetPassword(u.id)}
                            >
                              {t('admin.resetPassword')}
                            </button>

                            <button
                              type="button"
                              className="button secondary"
                              style={{ padding: '4px 8px', fontSize: '12px', color: '#9333ea' }}
                              title={t('admin.revokeSessionsTitle')}
                              onClick={() => handleRevokeSessions(u.id)}
                            >
                              {t('admin.revokeSessions')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && (
          <>
            {evaluationsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: 'var(--muted)' }}>{t('admin.evalLoading')}</p>
              </div>
            ) : evaluations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
                <p style={{ color: 'var(--muted)', fontSize: '16px', margin: 0 }}>{t('admin.evalEmpty')}</p>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '15px' }}>
                  {t('admin.evalCount', { total: evaluationsTotal })}
                </p>
                <div className="table-wrap" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'start' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--soft)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ padding: '14px 16px' }}>{t('admin.colEmail')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColName')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColUserType')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColUsability')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColClarity')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColTour')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColUnderstanding')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.evalColNotes')}</th>
                        <th style={{ padding: '14px 16px' }}>{t('admin.colDateTime')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((ev) => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid var(--line)' }}>
                          <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: isAr ? 'right' : 'left', fontFamily: 'monospace', fontSize: '13px' }}>
                            {ev.user_email || t('admin.evalDeletedUser')}
                          </td>
                          <td style={{ padding: '14px 16px' }}>{ev.name || ev.user_name || '—'}</td>
                          <td style={{ padding: '14px 16px' }}>{userTypeLabel(ev.user_type)}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{ev.usability}/5</td>
                          <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{ev.clarity}/5</td>
                          <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>{ev.tour_rating}/5</td>
                          <td style={{ padding: '14px 16px' }}>{understandingLabel(ev.understanding)}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--muted)', maxWidth: '260px' }}>{ev.notes || '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {new Date(ev.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="table-wrap" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--soft)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '14px 16px' }}>{t('admin.colEvent')}</th>
                  <th style={{ padding: '14px 16px' }}>{t('admin.colUserId')}</th>
                  <th style={{ padding: '14px 16px' }}>{t('admin.colIp')}</th>
                  <th style={{ padding: '14px 16px' }}>{t('admin.colDateTime')}</th>
                  <th style={{ padding: '14px 16px' }}>{t('admin.colDetails')}</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 'bold', color: 'var(--accent)' }}>{l.event_type}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{l.user_id || t('admin.guest')}</td>
                    <td style={{ padding: '14px 16px', direction: 'ltr', textAlign: isAr ? 'right' : 'left', fontFamily: 'monospace', fontSize: '13px' }}>{l.ip_address}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>{new Date(l.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB')}</td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', fontFamily: 'monospace' }}>
                      {l.event_data ? JSON.stringify(l.event_data) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Change Role Modal */}
        {actionType === 'role' && selectedUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
            <form onSubmit={handleRoleSubmit} style={{ backgroundColor: 'var(--paper)', padding: '30px', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px', border: '1px solid var(--line)' }}>
              <h3 style={{ margin: '0 0 15px' }}>{t('admin.changeRoleTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '15px' }}>
                {t('admin.changeRoleFor')} <strong>{selectedUser.name || selectedUser.email}</strong>:
              </p>

              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                disabled={actionSubmitting}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '20px', fontSize: '15px' }}
              >
                <option value="visitor">{t('admin.roleVisitor')}</option>
                <option value="admin">{t('admin.roleAdminLong')}</option>
              </select>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="button primary" style={{ flex: 1 }} disabled={actionSubmitting}>
                  {actionSubmitting ? t('admin.savingRole') : t('admin.saveRole')}
                </button>
                <button type="button" className="button secondary" onClick={() => setActionType(null)}>{t('admin.cancel')}</button>
              </div>
            </form>
          </div>
        )}

        {/* Suspend Modal */}
        {actionType === 'suspend' && selectedUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
            <form onSubmit={handleSuspendSubmit} style={{ backgroundColor: 'var(--paper)', padding: '30px', borderRadius: 'var(--radius)', width: '100%', maxWidth: '440px', border: '1px solid var(--line)' }}>
              <h3 style={{ margin: '0 0 15px', color: '#dc2626' }}>{t('admin.suspendTitle')}</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '15px' }}>
                {t('admin.suspendFor')} <strong>{selectedUser.name || selectedUser.email}</strong>:
              </p>

              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder={t('admin.suspendPlaceholder')}
                required
                rows={3}
                disabled={actionSubmitting}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '20px', fontSize: '14px', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="button primary" style={{ flex: 1, backgroundColor: '#dc2626' }} disabled={actionSubmitting}>
                  {actionSubmitting ? t('admin.suspending') : t('admin.confirmSuspend')}
                </button>
                <button type="button" className="button secondary" onClick={() => setActionType(null)}>{t('admin.cancel')}</button>
              </div>
            </form>
          </div>
        )}
      </section>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, ShieldCheck, Devices, Bell, Trash, ShieldWarning } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { PageHero } from '../../components/Layout';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import SessionManagement from './SessionManagement';
import NotificationSettings from './NotificationSettings';
import DeleteAccount from './DeleteAccount';
import { useI18n } from '../../i18n';

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: t('account.tabProfile'), icon: <UserCircle size={20} /> },
    { id: 'security', label: t('account.tabSecurity'), icon: <ShieldCheck size={20} /> },
    { id: 'sessions', label: t('account.tabSessions'), icon: <Devices size={20} /> },
    { id: 'notifications', label: t('account.tabNotifications'), icon: <Bell size={20} /> },
    { id: 'privacy', label: t('account.tabPrivacy'), icon: <Trash size={20} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <PageHero
        label={t('account.label')}
        title={t('account.greeting', { name: user?.name || user?.email || t('account.defaultUser') })}
        text={t('account.text')}
      />

      <section className="page-shell section" style={{ minHeight: '600px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: '30px', alignItems: 'start' }}>
          {/* Navigation Sidebar */}
          <aside style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--line)', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--ink)' }}>{user?.name || t('account.fallbackUser')}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', direction: 'ltr', textAlign: 'start' }}>{user?.email}</div>
              <div style={{ marginTop: '8px', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--soft)', color: 'var(--accent)', fontSize: '12px', fontWeight: 'bold' }}>
                {t('account.rolePrefix')} {user?.role === 'admin' ? t('account.roleAdmin') : t('account.roleVisitor')}
              </div>
            </div>

            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--ink)',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  fontSize: '15px',
                  textAlign: 'start',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={logout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                marginTop: '20px'
              }}
            >
              {t('account.logout')}
            </button>
          </aside>

          {/* Main Tab Content */}
          <main style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '32px' }}>
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'sessions' && <SessionManagement />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'privacy' && <DeleteAccount />}
          </main>
        </div>
      </section>
    </motion.div>
  );
}

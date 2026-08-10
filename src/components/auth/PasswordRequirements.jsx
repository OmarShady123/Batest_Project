import React from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { useI18n } from '../../i18n';

export function PasswordRequirements({ password = "", email = "", name = "" }) {
  const { t } = useI18n();
  const isMin15 = password.length >= 15;
  const isMax128 = password.length <= 128;
  
  const lowerPW = password.toLowerCase();
  const lowerEmail = email.toLowerCase().trim();
  const lowerName = name.toLowerCase().trim();

  const matchesEmail = lowerEmail && (lowerPW === lowerEmail || lowerPW === lowerEmail.split('@')[0]);
  const matchesName = lowerName && lowerName.length >= 3 && lowerPW.includes(lowerName);

  const notMatchesIdentity = !matchesEmail && !matchesName;

  const rules = [
    { label: t('password.rule1'), ok: isMin15 },
    { label: t('password.rule2'), ok: isMax128 },
    { label: t('password.rule3'), ok: notMatchesIdentity },
  ];

  return (
    <div style={{ backgroundColor: 'var(--soft)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', margin: '8px 0' }}>
      <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--ink)' }}>{t('password.requirementsTitle')}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rules.map((rule, idx) => (
          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: rule.ok ? '#16a34a' : 'var(--muted)' }}>
            {rule.ok ? <CheckCircle size={16} weight="fill" /> : <XCircle size={16} />}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

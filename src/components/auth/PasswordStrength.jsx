import React from 'react';
import { useI18n } from '../../i18n';

export function PasswordStrength({ password = "" }) {
  const { t } = useI18n();
  if (!password) return null;

  const len = password.length;
  let score = 0;
  
  if (len >= 15) score += 2;
  else if (len >= 10) score += 1;

  if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || len >= 20) score += 1;

  const levels = [
    { label: t('password.strength1'), color: "#dc2626", pct: "25%" },
    { label: t('password.strength2'), color: "#f97316", pct: "50%" },
    { label: t('password.strength3'), color: "#eab308", pct: "75%" },
    { label: t('password.strength4'), color: "#16a34a", pct: "100%" }
  ];

  const currentLevel = levels[Math.min(score, 3)];

  return (
    <div style={{ marginTop: '8px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px', fontWeight: 600 }}>
        <span>{t('password.strengthLabel')}</span>
        <span style={{ color: currentLevel.color }}>{currentLevel.label}</span>
      </div>
      <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            width: currentLevel.pct,
            height: '100%',
            backgroundColor: currentLevel.color,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}

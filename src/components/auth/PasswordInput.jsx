import React, { useState } from 'react';
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react';
import { useI18n } from '../../i18n';

export function PasswordInput({
  value,
  onChange,
  name = "password",
  id = "password",
  placeholder = "••••••••••••••••",
  autocomplete = "current-password",
  required = true,
  disabled = false,
  label,
  error = null
}) {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLock(true);
    } else {
      setCapsLock(false);
    }
  };

  return (
    <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>{label ?? t('password.label')}</span>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyDown}
          placeholder={placeholder}
          autoComplete={autocomplete}
          required={required}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px 42px 12px 14px',
            borderRadius: '8px',
            border: error ? '2px solid #a12626' : '1px solid #bfc6c1',
            fontSize: '15px',
            direction: 'ltr',
            textAlign: 'left',
            fontFamily: 'Tahoma, Arial, sans-serif',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? t('password.hide') : t('password.show')}
          tabIndex={-1}
          style={{
            position: 'absolute',
            top: '50%',
            // Physical `right`, not a logical inset: the field itself is forced
            // to `direction: ltr` so a password always reads left-to-right, and
            // its padding reserves the 42px on the physical right. A logical
            // inset would flip to the left in Arabic and sit on top of the text.
            right: '12px',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            padding: 0
          }}
        >
          {showPassword ? <EyeSlash size={22} /> : <Eye size={22} />}
        </button>
      </div>

      {capsLock && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '13px', marginTop: '2px' }}>
          <WarningCircle size={16} />
          <span>{t('password.capsLock')}</span>
        </div>
      )}

      {error && (
        <span className="form-error" role="alert" style={{ color: '#a12626', fontSize: '13px', fontWeight: 600 }}>
          {error}
        </span>
      )}
    </label>
  );
}

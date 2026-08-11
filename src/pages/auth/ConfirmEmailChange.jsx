import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useI18n } from '../../i18n';

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams();
  const { lang } = useI18n();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  const isAr = lang === 'ar';

  useEffect(() => {
    let cancelled = false;

    async function confirmEmail() {
      if (!token) {
        setStatus('error');
        setMessage(
          isAr
            ? 'رابط تأكيد البريد الإلكتروني غير صالح.'
            : 'The email confirmation link is invalid.'
        );
        return;
      }

      try {
        const res = await apiClient.post(
          '/api/v1/account/confirm-email-change',
          { token }
        );

        if (!cancelled) {
          setStatus('success');
          setMessage(
            res.data?.detail ||
              (isAr
                ? 'تم تغيير البريد الإلكتروني بنجاح.'
                : 'Your email address has been changed successfully.')
          );
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            err?.response?.data?.detail?.message ||
              err?.response?.data?.detail ||
              (isAr
                ? 'تعذر تأكيد البريد الإلكتروني الجديد. قد يكون الرابط منتهي الصلاحية.'
                : 'Could not confirm the new email address. The link may have expired.')
          );
        }
      }
    }

    confirmEmail();

    return () => {
      cancelled = true;
    };
  }, [token, isAr]);

  return (
    <section className="page-shell section" style={{ maxWidth: 620, margin: '0 auto' }}>
      <div className="login-mock" style={{ textAlign: 'center' }}>
        <h1>
          {isAr ? 'تأكيد البريد الإلكتروني الجديد' : 'Confirm New Email'}
        </h1>

        {status === 'loading' && (
          <>
            <div className="loading-spinner" style={{ margin: '24px auto' }} />
            <p>{isAr ? 'جارٍ تأكيد البريد...' : 'Confirming your email...'}</p>
          </>
        )}

        {status !== 'loading' && <p>{message}</p>}

        {status === 'success' && (
          <Link className="button primary" to="/account">
            {isAr ? 'الذهاب إلى الحساب' : 'Go to Account'}
          </Link>
        )}

        {status === 'error' && (
          <Link className="button secondary" to="/">
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        )}
      </div>
    </section>
  );
}

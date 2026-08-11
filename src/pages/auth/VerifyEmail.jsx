import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { useI18n } from '../../i18n';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { lang } = useI18n();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  const isAr = lang === 'ar';

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setStatus('error');
        setMessage(
          isAr
            ? 'رابط التفعيل غير صالح أو لا يحتوي على رمز التفعيل.'
            : 'The verification link is invalid or missing its token.'
        );
        return;
      }

      try {
        const res = await apiClient.post('/api/v1/auth/verify-email', { token });
        if (!cancelled) {
          setStatus('success');
          setMessage(
            res.data?.detail ||
              (isAr
                ? 'تم تفعيل الحساب بنجاح.'
                : 'Your account has been verified successfully.')
          );
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(
            err?.response?.data?.detail?.message ||
              err?.response?.data?.detail ||
              (isAr
                ? 'تعذر تفعيل الحساب. قد يكون الرابط منتهي الصلاحية.'
                : 'Could not verify the account. The link may have expired.')
          );
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, isAr]);

  return (
    <section className="page-shell section" style={{ maxWidth: 620, margin: '0 auto' }}>
      <div className="login-mock" style={{ textAlign: 'center' }}>
        <h1>
          {isAr ? 'تفعيل البريد الإلكتروني' : 'Email Verification'}
        </h1>

        {status === 'loading' && (
          <>
            <div className="loading-spinner" style={{ margin: '24px auto' }} />
            <p>{isAr ? 'جارٍ التحقق من الرابط...' : 'Verifying your link...'}</p>
          </>
        )}

        {status !== 'loading' && <p>{message}</p>}

        {status === 'success' && (
          <Link className="button primary" to="/login">
            {isAr ? 'الذهاب إلى تسجيل الدخول' : 'Go to Login'}
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

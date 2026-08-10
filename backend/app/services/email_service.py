import os
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from app.core.config import settings

DEV_EMAILS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dev_emails")

def build_frontend_url(route: str, token: Optional[str] = None, extra_params: Optional[Dict[str, str]] = None) -> str:
    """Centralized builder for HashRouter compatible links."""
    base = settings.FRONTEND_URL.rstrip("/")
    clean_route = route.lstrip("/")
    url = f"{base}/#/{clean_route}"
    params = []
    if token:
        params.append(f"token={token}")
    if extra_params:
        for k, v in extra_params.items():
            params.append(f"{k}={v}")
    if params:
        url += f"?{'&'.join(params)}"
    return url

def _render_html_template(
    title_ar: str,
    title_en: str,
    body_ar: str,
    body_en: str,
    action_url: Optional[str] = None,
    action_text_ar: Optional[str] = None,
    action_text_en: Optional[str] = None,
    lang: str = "ar"
) -> str:
    is_ar = lang == "ar"
    dir_attr = "rtl" if is_ar else "ltr"
    lang_attr = "ar" if is_ar else "en"
    title = title_ar if is_ar else title_en
    body = body_ar if is_ar else body_en
    action_text = (action_text_ar if is_ar else action_text_en) or ("اضغط هنا" if is_ar else "Click Here")

    button_html = ""
    if action_url:
        button_html = f"""
        <div style="margin: 30px 0; text-align: center;">
            <a href="{action_url}" style="background-color: #a45f2c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                {action_text}
            </a>
        </div>
        <p style="font-size: 13px; color: #666; margin-top: 20px;">
            {"إذا لم يعمل الزر أعلاه، قم بنسخ الرابط التالي ولصقه في المتصفح:" if is_ar else "If the button above does not work, copy and paste the following URL into your browser:"}<br>
            <a href="{action_url}" style="color: #a45f2c; word-break: break-all;">{action_url}</a>
        </p>
        """

    return f"""<!DOCTYPE html>
<html lang="{lang_attr}" dir="{dir_attr}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f5f6; margin: 0; padding: 20px; color: #222;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <tr>
            <td style="background-color: #a45f2c; padding: 24px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold;">معبد باستت — Bastet Temple</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px 24px;">
                <h2 style="color: #111; font-size: 20px; margin-top: 0;">{title}</h2>
                <div style="font-size: 16px; line-height: 1.6; color: #444;">
                    {body}
                </div>
                {button_html}
            </td>
        </tr>
        <tr>
            <td style="background-color: #fafafa; padding: 16px 24px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p style="margin: 0;">© {datetime.now(timezone.utc).year} Bastet Temple Project. All rights reserved.</p>
                <p style="margin: 4px 0 0 0;">هذه الرسالة تم إرسالها تلقائياً، يرجى عدم الرد عليها مباشرة.</p>
            </td>
        </tr>
    </table>
</body>
</html>"""


class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: str):
        # Development mode file logger
        if settings.ENVIRONMENT == "development" and settings.DEV_EMAIL_MODE:
            try:
                os.makedirs(DEV_EMAILS_DIR, exist_ok=True)
                timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
                safe_email = to_email.replace("@", "_at_").replace(".", "_")
                filename = f"{timestamp}_{safe_email}.html"
                filepath = os.path.join(DEV_EMAILS_DIR, filename)

                log_entry = f"<!-- TO: {to_email} | SUBJECT: {subject} | TIME: {datetime.now(timezone.utc).isoformat()} -->\n" + html_content
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(log_entry)
            except Exception as e:
                print(f"[EmailService DevLog Error] Failed to write email to dev_emails: {e}")

        # Real SMTP Delivery
        host = settings.get_smtp_host()
        username = settings.get_smtp_username()
        password = settings.get_smtp_password()

        if host and username and password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.get_smtp_from()}>"
                msg["To"] = to_email

                part1 = MIMEText(text_content, "plain", "utf-8")
                part2 = MIMEText(html_content, "html", "utf-8")
                msg.attach(part1)
                msg.attach(part2)

                port = settings.get_smtp_port()
                with smtplib.SMTP(host, port) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls()
                    server.login(username, password)
                    server.send_message(msg)
            except Exception as e:
                print(f"[EmailService SMTP Error] Failed to send email via SMTP to {to_email}: {e}")

    @classmethod
    def send_verification_email(cls, email: str, token: str, lang: str = "ar"):
        url = build_frontend_url("verify-email", token=token)
        is_ar = lang == "ar"
        subject = "تفعيل حساب معبد باستت" if is_ar else "Verify your Bastet Temple Account"
        
        body_ar = "<p>مرحباً،</p><p>شكراً لتسجيلك في موقع معبد باستت. يرجى اضغط على الزر أدناه لتفعيل حسابك ومتابعة الاستخدام:</p><p><strong>هذا الرابط صالح لمدة 24 ساعة فقط.</strong></p>"
        body_en = "<p>Hello,</p><p>Thank you for registering at Bastet Temple. Please click the button below to verify your email and activate your account:</p><p><strong>This link is valid for 24 hours.</strong></p>"

        html = _render_html_template(
            title_ar="تفعيل الحساب",
            title_en="Email Verification",
            body_ar=body_ar,
            body_en=body_en,
            action_url=url,
            action_text_ar="تفعيل الحساب الآن",
            action_text_en="Verify Account Now",
            lang=lang
        )
        text = f"مرحباً، يرجى تفعيل حسابك باستخدام الرابط التالي: {url}" if is_ar else f"Hello, please verify your account using this link: {url}"
        cls.send_email(email, subject, html, text)

    @classmethod
    def send_password_reset_email(cls, email: str, token: str, lang: str = "ar"):
        url = build_frontend_url("reset-password", token=token)
        is_ar = lang == "ar"
        subject = "إعادة تعيين كلمة المرور - معبد باستت" if is_ar else "Reset Password - Bastet Temple"

        body_ar = "<p>مرحباً،</p><p>لقد استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر أدناه لاختيار كلمة مرور جديدة:</p><p><strong>هذا الرابط صالح لمدة 30 دقيقة فقط. إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة.</strong></p>"
        body_en = "<p>Hello,</p><p>We received a request to reset your password. Click the button below to choose a new password:</p><p><strong>This link is valid for 30 minutes. If you did not request this, please ignore this email.</strong></p>"

        html = _render_html_template(
            title_ar="إعادة تعيين كلمة المرور",
            title_en="Reset Password",
            body_ar=body_ar,
            body_en=body_en,
            action_url=url,
            action_text_ar="إعادة تعيين كلمة المرور",
            action_text_en="Reset Password",
            lang=lang
        )
        text = f"رابط إعادة تعيين كلمة المرور: {url}" if is_ar else f"Password reset link: {url}"
        cls.send_email(email, subject, html, text)

    @classmethod
    def send_password_changed_email(cls, email: str, lang: str = "ar"):
        is_ar = lang == "ar"
        subject = "تنبيه أمني: تم تغيير كلمة المرور" if is_ar else "Security Alert: Password Changed"
        body_ar = "<p>مرحباً،</p><p>نعلمك أنه تم تغيير كلمة المرور الخاصة بحسابك بنجاح. تم إلغاء جميع الجلسات القديمة للحفاظ على أمان حسابك.</p><p>إذا لم تقم به التغيير بنفسك، يرجى التواصل مع الدعم الفني فوراً.</p>"
        body_en = "<p>Hello,</p><p>This is to inform you that your password has been successfully changed. All existing active sessions have been revoked for your security.</p><p>If you did not make this change, please contact support immediately.</p>"

        html = _render_html_template(
            title_ar="تم تغيير كلمة المرور",
            title_en="Password Changed",
            body_ar=body_ar,
            body_en=body_en,
            lang=lang
        )
        cls.send_email(email, subject, html, body_ar if is_ar else body_en)

    @classmethod
    def send_email_change_email(cls, new_email: str, token: str, lang: str = "ar"):
        url = build_frontend_url("confirm-email-change", token=token)
        is_ar = lang == "ar"
        subject = "تأكيد تغيير البريد الإلكتروني" if is_ar else "Confirm Email Change"
        body_ar = f"<p>مرحباً،</p><p>لقد طلبت تغيير بريدك الإلكتروني إلى {new_email}. يرجى تأكيد هذا التغيير بالضغط على الزر أدناه:</p>"
        body_en = f"<p>Hello,</p><p>You requested to change your email address to {new_email}. Please confirm by clicking below:</p>"

        html = _render_html_template(
            title_ar="تأكيد البريد الجديد",
            title_en="Confirm New Email",
            body_ar=body_ar,
            body_en=body_en,
            action_url=url,
            action_text_ar="تأكيد البريد الإلكتروني",
            action_text_en="Confirm Email",
            lang=lang
        )
        cls.send_email(new_email, subject, html, f"Link: {url}")

    @classmethod
    def send_account_suspended_email(cls, email: str, reason: Optional[str] = None, lang: str = "ar"):
        is_ar = lang == "ar"
        subject = "تنبيه: تم تعليق حسابك" if is_ar else "Notice: Account Suspended"
        reason_str = f"<p><strong>السبب:</strong> {reason}</p>" if reason else ""
        body_ar = f"<p>مرحباً،</p><p>تم تعليق حسابك في موقع معبد باستت بواسطة الإدارة.</p>{reason_str}<p>يرجى التواصل مع إدارة الموقع لمزيد من التفاصيل.</p>"
        body_en = f"<p>Hello,</p><p>Your account has been suspended by the administration.</p>{reason_str}<p>Please contact site administration for further information.</p>"

        html = _render_html_template(
            title_ar="تعليق الحساب",
            title_en="Account Suspended",
            body_ar=body_ar,
            body_en=body_en,
            lang=lang
        )
        cls.send_email(email, subject, html, body_ar if is_ar else body_en)

    @classmethod
    def send_account_reactivated_email(cls, email: str, lang: str = "ar"):
        is_ar = lang == "ar"
        subject = "تم إعادة تفعيل حسابك" if is_ar else "Account Reactivated"
        body_ar = "<p>مرحباً،</p><p>تم إعادة تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول واستخدام كافة الخدمات المتاحة.</p>"
        body_en = "<p>Hello,</p><p>Your account has been reactivated. You can now sign in and use all available features.</p>"

        html = _render_html_template(
            title_ar="تفعيل الحساب",
            title_en="Account Reactivated",
            body_ar=body_ar,
            body_en=body_en,
            lang=lang
        )
        cls.send_email(email, subject, html, body_ar if is_ar else body_en)

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import httpx
from ..config import settings


def send_password_reset_email(to_email: str, reset_token: str, user_name: Optional[str] = None) -> bool:
    """
    Sends a CareerFit AI branded password reset email.
    Supports SMTP (Gmail, Resend SMTP, SendGrid, Brevo) or Resend API.
    If no SMTP or API key is set, it logs the direct reset link to the console for testing.
    """
    frontend_url = (settings.frontend_url or "http://localhost:5173").rstrip("/")
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    greeting = f"Hello {user_name}," if user_name else "Hello,"

    subject = "Reset Your CareerFit AI Password"
    from_name = settings.emails_from_name or "CareerFit AI"
    from_email = settings.emails_from_email or "noreply@careerfit.ai"

    # Plain text version
    text_content = f"""
{greeting}

We received a request to reset your password for your CareerFit AI account.
To choose a new password, click the link below (valid for 60 minutes):

{reset_url}

If you didn't request a password reset, you can safely ignore this email.

Best regards,
CareerFit AI Team
"""

    # Modern SaaS HTML template with CareerFit AI branding
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }}
    .header {{ background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .logo {{ font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }}
    .tagline {{ font-size: 12px; font-weight: 500; opacity: 0.9; margin-top: 4px; }}
    .content {{ padding: 32px 28px; line-height: 1.6; font-size: 14px; }}
    .greeting {{ font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
    .btn-wrapper {{ text-align: center; margin: 28px 0; }}
    .btn {{ display: inline-block; background: linear-gradient(135deg, #2563eb, #0284c7); color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); }}
    .security-note {{ background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #475569; margin: 20px 0; }}
    .footer {{ padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">CareerFit AI</h1>
      <p class="tagline">Intelligent Placement & Career Acceleration</p>
    </div>
    <div class="content">
      <p class="greeting">{greeting}</p>
      <p>We received a request to reset your password. Click the button below to choose a new password for your CareerFit AI account:</p>
      <div class="btn-wrapper">
        <a href="{reset_url}" class="btn" target="_blank">Reset My Password</a>
      </div>
      <div class="security-note">
        <strong>Security Notice:</strong> This link will expire in <strong>60 minutes</strong>. If you did not request this password reset, please ignore this email or contact support.
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br>
        <a href="{reset_url}" style="color: #2563eb; word-break: break-all;">{reset_url}</a>
      </p>
    </div>
    <div class="footer">
      &copy; 2026 CareerFit AI. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

def _dispatch_email(to_email: str, subject: str, html_content: str, text_content: str, log_title: str, meta: Optional[dict] = None) -> bool:
    """Dispatches email via Resend API, SMTP, or logs to terminal if no email provider is configured."""
    from_name = settings.emails_from_name or "CareerFit AI"
    from_email = settings.emails_from_email or "noreply@careerfit.ai"

    # 1. Try Resend API if RESEND_API_KEY is configured
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key:
        try:
            resend_from = os.getenv("EMAILS_FROM_EMAIL") or "onboarding@resend.dev"
            if "careerfit.ai" in resend_from:
                resend_from = "onboarding@resend.dev"

            with httpx.Client(timeout=10.0) as client:
                res = client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_api_key}"},
                    json={
                        "from": f"{from_name} <{resend_from}>",
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content,
                    },
                )
                if res.status_code in (200, 201):
                    print(f"📧 [Email Service] {log_title} sent via Resend API to {to_email}")
                    return True
                else:
                    print(f"⚠️ [Email Service] Resend API error ({res.status_code}): {res.text}")
        except Exception as e:
            print(f"⚠️ [Email Service] Resend dispatch error: {e}")

    # 2. Try SMTP if SMTP_HOST or SMTP_USER is configured
    smtp_host = settings.smtp_host or os.getenv("SMTP_HOST") or "smtp.gmail.com"
    smtp_port = settings.smtp_port or int(os.getenv("SMTP_PORT", 587))
    smtp_user = settings.smtp_user or os.getenv("SMTP_USER")
    smtp_password = settings.smtp_password or os.getenv("SMTP_PASSWORD")

    if smtp_user and smtp_password:
        try:
            from email.utils import formatdate, make_msgid

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{smtp_user}>"
            msg["To"] = to_email
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="gmail.com")
            msg["Reply-To"] = smtp_user

            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)

            # Try ports in order of reliability for cloud hosts (465 SSL, then 587 TLS)
            ports_to_try = [465, 587] if smtp_port == 465 else [587, 465]
            last_err = None

            for port in ports_to_try:
                server = None
                try:
                    if port == 465:
                        server = smtplib.SMTP_SSL(smtp_host, 465, timeout=12)
                    else:
                        server = smtplib.SMTP(smtp_host, 587, timeout=12)
                        server.starttls()

                    server.login(smtp_user, smtp_password)
                    server.sendmail(smtp_user, [to_email], msg.as_string())
                    server.quit()
                    print(f"📧 [Email Service] {log_title} sent via SMTP ({smtp_host}:{port}) to {to_email}")
                    return True
                except Exception as port_err:
                    last_err = port_err
                    if server:
                        try:
                            server.quit()
                        except Exception:
                            pass
                    print(f"⚠️ [Email Service] Port {port} failed: {port_err}. Trying fallback port...")

            print(f"❌ [Email Service] All SMTP attempts failed for {to_email}. Last error: {last_err}")
        except Exception as e:
            print(f"⚠️ [Email Service] SMTP dispatch error: {e}")

    # 3. Development / Local Fallback: Log directly to terminal
    print("\n" + "=" * 70)
    print(f"🚀 [CareerFit AI - {log_title}]")
    print(f"Recipient: {to_email}")
    print(f"Subject:   {subject}")
    if meta:
        for k, v in meta.items():
            print(f"{k}: {v}")
    print("Notice:    Add SMTP_USER & SMTP_PASSWORD to your Render Environment to send real emails.")
    print("=" * 70 + "\n")
    return True


def send_password_reset_email(to_email: str, reset_token: str, user_name: Optional[str] = None) -> bool:
    """
    Sends a CareerFit AI branded password reset email.
    Supports SMTP (Gmail, SendGrid, Brevo) or Resend API with local terminal fallback.
    """
    raw_frontend = (settings.frontend_url or os.getenv("FRONTEND_URL") or "").rstrip("/")
    if not raw_frontend or "localhost" in raw_frontend:
        frontend_url = "https://frontend-nine-rouge-55.vercel.app"
    else:
        frontend_url = raw_frontend
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    greeting = f"Hello {user_name}," if user_name else "Hello,"
    subject = "Reset Your CareerFit AI Password"

    text_content = f"""
{greeting}

We received a request to reset your password for your CareerFit AI account.
To choose a new password, click the link below (valid for 60 minutes):

{reset_url}

If you didn't request a password reset, you can safely ignore this email.

Best regards,
CareerFit AI Team
"""

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }}
    .header {{ background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .logo {{ font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }}
    .tagline {{ font-size: 12px; font-weight: 500; opacity: 0.9; margin-top: 4px; }}
    .content {{ padding: 32px 28px; line-height: 1.6; font-size: 14px; }}
    .greeting {{ font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
    .btn-wrapper {{ text-align: center; margin: 28px 0; }}
    .btn {{ display: inline-block; background: linear-gradient(135deg, #2563eb, #0284c7); color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); }}
    .security-note {{ background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #475569; margin: 20px 0; }}
    .footer {{ padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">CareerFit AI</h1>
      <p class="tagline">Intelligent Placement & Career Acceleration</p>
    </div>
    <div class="content">
      <p class="greeting">{greeting}</p>
      <p>We received a request to reset your password. Click the button below to choose a new password for your CareerFit AI account:</p>
      <div class="btn-wrapper">
        <a href="{reset_url}" class="btn" target="_blank">Reset My Password</a>
      </div>
      <div class="security-note">
        <strong>Security Notice:</strong> This link will expire in <strong>60 minutes</strong>. If you did not request this password reset, please ignore this email or contact support.
      </div>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br>
        <a href="{reset_url}" style="color: #2563eb; word-break: break-all;">{reset_url}</a>
      </p>
    </div>
    <div class="footer">
      &copy; 2026 CareerFit AI. All rights reserved.
    </div>
  </div>
</body>
</html>
"""
    return _dispatch_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        log_title="Password Reset Email",
        meta={"Reset URL": reset_url},
    )


def send_welcome_email(to_email: str, user_name: Optional[str] = None) -> bool:
    """
    Sends a CareerFit AI branded Welcome email upon new user registration.
    """
    raw_frontend = (settings.frontend_url or os.getenv("FRONTEND_URL") or "").rstrip("/")
    if not raw_frontend or "localhost" in raw_frontend:
        frontend_url = "https://frontend-nine-rouge-55.vercel.app"
    else:
        frontend_url = raw_frontend
    app_url = f"{frontend_url}/app/dashboard"
    greeting = f"Welcome {user_name}," if user_name else "Welcome to CareerFit AI,"
    subject = "Welcome to CareerFit AI — Your Placement Acceleration Platform!"

    text_content = f"""
{greeting}

Your CareerFit AI account has been successfully created!

Here is what you can do right now:
1. AI Resume Builder & ATS Scorecard: Build and optimize your ATS-ready resume.
2. Placement Eligibility Engine: Verify recruiter cutoffs (CGPA, backlogs, branch) against top companies.
3. AI Mock Interviews: Practice voice and technical mock interviews powered by Gemini AI.
4. Scikit-Learn Career Matcher: Discover career domains that fit your exact skillset.

Launch your dashboard:
{app_url}

Best regards,
CareerFit AI Team
"""

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{subject}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }}
    .header {{ background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 36px 24px; text-align: center; color: #ffffff; }}
    .logo {{ font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }}
    .tagline {{ font-size: 13px; font-weight: 500; opacity: 0.95; margin-top: 4px; }}
    .content {{ padding: 32px 28px; line-height: 1.6; font-size: 14px; }}
    .greeting {{ font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
    .feature-card {{ background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }}
    .feature-title {{ font-weight: 700; color: #2563eb; margin: 0 0 4px 0; font-size: 14px; }}
    .feature-desc {{ margin: 0; color: #64748b; font-size: 13px; }}
    .btn-wrapper {{ text-align: center; margin: 32px 0 20px 0; }}
    .btn {{ display: inline-block; background: linear-gradient(135deg, #2563eb, #0284c7); color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 32px; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); }}
    .footer {{ padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">CareerFit AI</h1>
      <p class="tagline">Intelligent Placement & Career Acceleration Platform</p>
    </div>
    <div class="content">
      <p class="greeting">{greeting}</p>
      <p>Congratulations! Your account is active and connected to our <strong>Neon Serverless PostgreSQL</strong> backend. You are all set to unlock AI-powered campus recruitment prep.</p>
      
      <div style="margin: 24px 0;">
        <div class="feature-card">
          <p class="feature-title">📄 ATS Resume Scoring & Optimization</p>
          <p class="feature-desc">Upload your resume to get instant section-by-section scoring and keyword gap fixes.</p>
        </div>
        <div class="feature-card">
          <p class="feature-title">🎯 Strict Recruiter Placement Engine</p>
          <p class="feature-desc">Verify your eligibility for top tech giants (Google, Microsoft, Amazon, TCS) against live cutoffs.</p>
        </div>
        <div class="feature-card">
          <p class="feature-title">🎙️ AI Interactive Mock Interviews</p>
          <p class="feature-desc">Practice real-time technical and behavioral interviews with real-time feedback.</p>
        </div>
      </div>

      <div class="btn-wrapper">
        <a href="{app_url}" class="btn" target="_blank">Open Your Dashboard &rarr;</a>
      </div>
    </div>
    <div class="footer">
      &copy; 2026 CareerFit AI. All rights reserved.
    </div>
  </div>
</body>
</html>
"""
    return _dispatch_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
        log_title="Welcome Email",
        meta={"Dashboard URL": app_url},
    )

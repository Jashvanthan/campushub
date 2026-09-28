import os
import random
import time
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

# In-memory OTP storage mapping identifier -> { 'code': str, 'expires_at': float, 'username': str, 'email': str }
_OTP_STORE = {}
OTP_EXPIRY_SECONDS = 600  # 10 minutes

def generate_otp() -> str:
    """Generate a secure 6-digit verification code."""
    return str(random.randint(100000, 999999))

def store_otp(username: str, email: str, code: str) -> None:
    """Store verification code with expiration for both username and email lookups."""
    now = time.time()
    expires_at = now + OTP_EXPIRY_SECONDS
    entry = {
        'code': code,
        'expires_at': expires_at,
        'username': username.lower().strip(),
        'email': email.lower().strip()
    }
    _OTP_STORE[username.lower().strip()] = entry
    if email:
        _OTP_STORE[email.lower().strip()] = entry

def verify_and_consume_otp(identifier: str, input_code: str) -> tuple[bool, str]:
    """
    Validates the OTP code for the given identifier (username or email).
    Returns (is_valid, error_or_success_message).
    """
    clean_id = (identifier or '').lower().strip()
    clean_code = str(input_code or '').strip()

    if not clean_id or not clean_code:
        return False, "Identifier and verification code are required."

    entry = _OTP_STORE.get(clean_id)
    if not entry:
        return False, "No active verification code found for this account. Please request a new code."

    now = time.time()
    if now > entry['expires_at']:
        # Expired
        _OTP_STORE.pop(clean_id, None)
        return False, "Verification code has expired. Please request a new code."

    if entry['code'] != clean_code:
        return False, "Invalid verification code. Please check your email and try again."

    # Code matches! Invalidate so it cannot be reused
    _OTP_STORE.pop(entry['username'], None)
    if entry.get('email'):
        _OTP_STORE.pop(entry['email'], None)

    return True, "Verification code verified successfully."

def send_resend_email(to_email: str, username: str, otp_code: str) -> dict:
    """
    Sends an HTML verification email via Resend REST API (https://api.resend.com/emails).
    """
    resend_api_key = os.environ.get('RESEND_API_KEY', '').strip()
    from_email = os.environ.get('RESEND_FROM_EMAIL', 'CampusHub Security <onboarding@resend.dev>').strip()

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CampusHub Password Reset Code</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .logo {{ font-size: 24px; font-weight: 800; color: #818cf8; letter-spacing: -0.5px; }}
        .badge {{ display: inline-block; padding: 4px 12px; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #a5b4fc; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }}
        h2 {{ color: #ffffff; font-size: 20px; margin-top: 0; margin-bottom: 12px; }}
        p {{ color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; }}
        .code-box {{ background: rgba(15, 23, 42, 0.9); border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; font-family: 'Courier New', Courier, monospace; margin: 0; }}
        .expiry-note {{ font-size: 12px; color: #f59e0b; margin-top: 8px; }}
        .footer {{ text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #1f2937; color: #64748b; font-size: 12px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚀 CampusHub</div>
          <div class="badge">Security &amp; Account Protection</div>
        </div>
        <h2>Password Reset Request</h2>
        <p>Hello <strong>{username}</strong>,</p>
        <p>We received a request to reset the password for your CampusHub account associated with <strong>{to_email}</strong>. Use the 6-digit verification code below to complete your reset:</p>
        
        <div class="code-box">
          <div class="otp-code">{otp_code}</div>
          <div class="expiry-note">⏱ This code is valid for 10 minutes. Do not share it with anyone.</div>
        </div>

        <p>If you did not request this password reset, you can safely ignore this message. Your account remains secure.</p>
        
        <div class="footer">
          &copy; 2026 CampusHub Platform. All rights reserved.<br>
          Next-Generation Academic Engineering &amp; Collaboration Ecosystem
        </div>
      </div>
    </body>
    </html>
    """

    if not resend_api_key:
        print(f"[CampusHub Dev Simulator] RESEND_API_KEY not configured. OTP for {to_email} ({username}): {otp_code}")
        return {
            'sent': False,
            'simulated': True,
            'code': otp_code,
            'message': 'RESEND_API_KEY not configured in backend .env. Code generated in simulation mode.'
        }

    try:
        url = "https://api.resend.com/emails"
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": f"CampusHub Password Reset Code: {otp_code}",
            "html": html_content
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {resend_api_key}",
                "Content-Type": "application/json",
                "User-Agent": "CampusHub-Backend/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            resp_body = response.read().decode('utf-8')
            parsed = json.loads(resp_body) if resp_body else {}
            return {
                'sent': True,
                'id': parsed.get('id'),
                'message': 'Email dispatched successfully via Resend.'
            }
    except urllib.error.HTTPError as err:
        err_msg = err.read().decode('utf-8')
        print(f"[Resend API HTTP Error] {err.code}: {err_msg}")
        return {
            'sent': False,
            'error': f"Resend API error: {err_msg}",
            'simulated': True,
            'code': otp_code
        }
    except Exception as e:
        print(f"[Resend Email Error] {str(e)}")
        return {
            'sent': False,
            'error': str(e),
            'simulated': True,
            'code': otp_code
        }

import os
import smtplib
from email.message import EmailMessage

from worker import celery


def _build_smtp_message(to_email, subject, message, reply_to=""):
    sender_email = os.getenv("SUPPORT_EMAIL", "support@example.com")

    email_message = EmailMessage()
    email_message["From"] = sender_email
    email_message["To"] = to_email
    email_message["Subject"] = subject
    if reply_to:
        email_message["Reply-To"] = reply_to
    email_message.set_content(message)
    return email_message


def _deliver_email(email_message, reply_to=""):
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not smtp_host:
        print(
            f"[email skipped] to={email_message['To']} subject={email_message['Subject']} reply_to={reply_to}"
        )
        return {"sent": False, "reason": "smtp_not_configured"}

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as smtp:
        if smtp_use_tls:
            smtp.starttls()
        if smtp_username:
            smtp.login(smtp_username, smtp_password)
        smtp.send_message(email_message)

    return {"sent": True, "recipient": str(email_message["To"])}


@celery.task(name="tasks.send_email")
def send_email(to_email, reply_to="", subject="", message=""):
    email_message = _build_smtp_message(
        to_email=to_email,
        subject=subject or "Support request",
        message=message,
        reply_to=reply_to,
    )
    return _deliver_email(email_message, reply_to=reply_to)


@celery.task(name="tasks.send_welcome_email")
def send_welcome_email(to_email, username):
    support_email = os.getenv("SUPPORT_EMAIL", "support@example.com")
    email_message = _build_smtp_message(
        to_email=to_email,
        subject="Welcome to OPSDEV",
        message=(
            f"Hi {username},\n\n"
            "Welcome to OPSDEV.\n\n"
            "Your account has been created successfully and you can now sign in to the "
            "storefront and access platform workflows.\n\n"
            f"If you did not create this account, please contact support at {support_email}.\n"
        ),
    )
    result = _deliver_email(email_message)
    result["username"] = username
    return result


@celery.task(name="tasks.log_signup_analytics")
def log_signup_analytics(user_id, email, username, role="customer"):
    """Mock signup analytics event logging."""
    print(
        f"[analytics] event=user_signup user_id={user_id} email={email} username={username} role={role}"
    )
    return {
        "logged": True,
        "event": "user_signup",
        "user_id": user_id,
        "email": email,
        "username": username,
        "role": role,
    }

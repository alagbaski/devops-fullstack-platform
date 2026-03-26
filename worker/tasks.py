import os
import smtplib
from email.message import EmailMessage

from worker import celery


@celery.task(name="tasks.send_email")
def send_email(to_email, reply_to="", subject="", message=""):
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    sender_email = os.getenv("SUPPORT_EMAIL", "support@example.com")

    email_message = EmailMessage()
    email_message["From"] = sender_email
    email_message["To"] = to_email
    email_message["Subject"] = subject or "Support request"
    if reply_to:
        email_message["Reply-To"] = reply_to
    email_message.set_content(message)

    if not smtp_host:
        print(f"[email skipped] to={to_email} subject={email_message['Subject']} reply_to={reply_to}")
        return {"sent": False, "reason": "smtp_not_configured"}

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as smtp:
        if smtp_use_tls:
            smtp.starttls()
        if smtp_username:
            smtp.login(smtp_username, smtp_password)
        smtp.send_message(email_message)

    return {"sent": True, "recipient": to_email}

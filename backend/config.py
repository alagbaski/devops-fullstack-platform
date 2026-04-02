import os
from pathlib import Path

DB_HOST = os.getenv("DB_HOST", "db")
POSTGRES_DB = os.getenv("POSTGRES_DB", "devopsdb")
POSTGRES_USER = os.getenv("POSTGRES_USER", "devops")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "devops")

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

NGINX_PORT = os.getenv("NGINX_PORT", "80")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")
RABBITMQ_UI_PORT = os.getenv("RABBITMQ_UI_PORT", "15672")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://devops:devops@rabbitmq:5672//")

SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "support@example.com")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

MEDIA_URL = os.getenv("MEDIA_URL", "/media")
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", "media")).resolve()

"""
Configuration Module

This module centralizes all environment variables and default settings
for the FastAPI backend application. It uses `os.getenv` to read values
from the environment, providing sensible defaults where appropriate.

Values are typically loaded from a `.env` file in local development
or injected as environment variables in production environments.
"""
import os
from pathlib import Path

# Database Configuration
DB_HOST = os.getenv("DB_HOST", "db")
POSTGRES_DB = os.getenv("POSTGRES_DB", "devopsdb")
POSTGRES_USER = os.getenv("POSTGRES_USER", "devops")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "devops")

# JWT (JSON Web Token) Configuration for Authentication
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

# Admin User Credentials (for initial setup or specific admin login)
# These should ideally be set securely in production, not hardcoded.
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# Application Port Configuration
NGINX_PORT = os.getenv("NGINX_PORT", "80")
BACKEND_PORT = os.getenv("BACKEND_PORT", "8000")

# RabbitMQ Configuration (for message queuing and background tasks)
RABBITMQ_UI_PORT = os.getenv("RABBITMQ_UI_PORT", "15672")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://devops:devops@rabbitmq:5672//")

# SMTP Configuration (for sending emails, e.g., support requests)
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "support@example.com")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# Media Storage Configuration (for uploaded product images)
MEDIA_URL = os.getenv("MEDIA_URL", "/media")
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", "media")).resolve()

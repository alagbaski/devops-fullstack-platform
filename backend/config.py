import os

DB_HOST = os.getenv("DB_HOST", "db")
POSTGRES_DB = os.getenv("POSTGRES_DB", "devopsdb")
POSTGRES_USER = os.getenv("POSTGRES_USER", "devops")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "devops")

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

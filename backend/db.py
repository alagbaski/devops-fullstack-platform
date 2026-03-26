import time
from contextlib import closing

import psycopg2

from config import ADMIN_EMAIL, ADMIN_PASSWORD, DB_HOST, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER
from security.passwords import hash_password


def get_conn():
    retries = 10
    while retries > 0:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                database=POSTGRES_DB,
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
            )
            print("Connected to database")
            return conn
        except Exception as exc:
            print(f"DB not ready, retrying... {exc}")
            retries -= 1
            time.sleep(3)

    raise Exception("Database not reachable after retries")


def initialize_database() -> None:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS items (
                    id SERIAL PRIMARY KEY,
                    name TEXT
                );
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'customer',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_users_email
                ON users (email);
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    description TEXT NOT NULL,
                    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
                    currency TEXT NOT NULL DEFAULT 'USD',
                    inventory_count INTEGER NOT NULL DEFAULT 0 CHECK (inventory_count >= 0),
                    image_url TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_products_active
                ON products (is_active);
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_products_slug
                ON products (slug);
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    message TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
            cur.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_feedback_user_id
                ON feedback (user_id);
                """
            )
            if ADMIN_EMAIL and ADMIN_PASSWORD:
                cur.execute("SELECT id FROM users WHERE email = %s;", (ADMIN_EMAIL.lower(),))
                if cur.fetchone() is None:
                    cur.execute(
                        """
                        INSERT INTO users (email, password_hash, role)
                        VALUES (%s, %s, %s);
                        """,
                        (ADMIN_EMAIL.lower(), hash_password(ADMIN_PASSWORD), "admin"),
                    )
        conn.commit()

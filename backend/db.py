"""
Database Utility Module

Handles the connection to PostgreSQL and initializes the database schema.
Includes helper functions for username normalization and ensures that an
initial admin account is created based on environment variables.
"""

import time
from contextlib import closing

import psycopg2

from config import (
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    DB_HOST,
    POSTGRES_DB,
    POSTGRES_PASSWORD,
    POSTGRES_USER,
)
from security.passwords import hash_password

DEFAULT_PRODUCT_CATALOG = (
    {
        "name": "Platform Launch Kit",
        "slug": "platform-launch-kit",
        "description": "A premium delivery bundle with deployment checklists, rollout templates, and polished handoff assets for engineering teams.",
        "price": "149.00",
        "currency": "USD",
        "inventory_count": 14,
        "image_url": "",
        "is_active": True,
    },
    {
        "name": "Observability Command Center",
        "slug": "observability-command-center",
        "description": "Dashboards, alert playbooks, and incident-ready monitors packaged for teams that want faster signal from day one.",
        "price": "89.00",
        "currency": "USD",
        "inventory_count": 20,
        "image_url": "",
        "is_active": True,
    },
    {
        "name": "Developer Portal Blueprint",
        "slug": "developer-portal-blueprint",
        "description": "A storefront-grade internal developer portal starter with onboarding flows, service inventory patterns, and team docs structure.",
        "price": "129.00",
        "currency": "USD",
        "inventory_count": 9,
        "image_url": "",
        "is_active": True,
    },
    {
        "name": "Support Workflow Studio",
        "slug": "support-workflow-studio",
        "description": "Customer support playbooks, queue rules, and feedback-routing patterns designed for technical products with real operators behind them.",
        "price": "64.00",
        "currency": "USD",
        "inventory_count": 18,
        "image_url": "",
        "is_active": True,
    },
)


def normalize_username(value: str) -> str:
    """Removes non-alphanumeric characters and lowercases the username."""
    normalized = "".join(
        char for char in value.strip().lower() if char.isalnum() or char == "_"
    )
    return normalized or "user"


def default_username_from_email(email: str) -> str:
    """Generates a base username from the local-part of an email address."""
    return normalize_username(email.split("@", 1)[0])


def ensure_unique_username(
    cur, desired_username: str, *, exclude_user_id: int | None = None
) -> str:
    """
    Checks if a username exists in the database. If it does, appends a
    numeric suffix until a unique name is found (e.g., 'admin', 'admin2').
    """
    candidate = normalize_username(desired_username)
    suffix = 1

    while True:
        if exclude_user_id is None:
            cur.execute("SELECT 1 FROM users WHERE username = %s;", (candidate,))
        else:
            cur.execute(
                "SELECT 1 FROM users WHERE username = %s AND id <> %s;",
                (candidate, exclude_user_id),
            )

        if cur.fetchone() is None:
            return candidate

        suffix += 1
        candidate = f"{normalize_username(desired_username)}{suffix}"


def get_conn():
    """
    Creates a connection to PostgreSQL.

    Includes a retry loop to handle "race conditions" where the backend
    might start up faster than the database container is ready to accept connections.
    """
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


def seed_default_products(cur) -> None:
    """
    Insert a demo storefront catalog when the product table is empty.

    This keeps fresh local or cloud deployments visually useful without
    affecting environments that already have real catalog data.
    """
    cur.execute("SELECT COUNT(*) FROM products;")
    product_count = cur.fetchone()[0]

    if product_count > 0:
        return

    for product in DEFAULT_PRODUCT_CATALOG:
        cur.execute(
            """
            INSERT INTO products (
                name,
                slug,
                description,
                price,
                currency,
                inventory_count,
                image_url,
                is_active
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """,
            (
                product["name"],
                product["slug"],
                product["description"],
                product["price"],
                product["currency"],
                product["inventory_count"],
                product["image_url"],
                product["is_active"],
            ),
        )


def initialize_database() -> None:
    """
    Idempotent database setup.
    Creates tables, indexes, and an initial admin user if they don't exist.
    """
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS items (
                    id SERIAL PRIMARY KEY,
                    name TEXT
                );
                """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    username TEXT,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'customer',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """)
            cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;")

            # Migration logic: Ensure all existing users have a non-null username
            cur.execute(
                "SELECT id, email FROM users WHERE username IS NULL OR username = '';"
            )
            missing_usernames = cur.fetchall()
            for user_id, email in missing_usernames:
                username = ensure_unique_username(
                    cur, default_username_from_email(email), exclude_user_id=user_id
                )
                cur.execute(
                    "UPDATE users SET username = %s WHERE id = %s;", (username, user_id)
                )

            cur.execute("ALTER TABLE users ALTER COLUMN username SET NOT NULL;")
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_users_email
                ON users (email);
                """)
            cur.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username
                ON users (username);
                """)
            cur.execute("""
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
                """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_products_active
                ON products (is_active);
                """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_products_slug
                ON products (slug);
                """)
            seed_default_products(cur)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    message TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_feedback_user_id
                ON feedback (user_id);
                """)

            # Bootstrap: Create the Admin account if credentials are provided in .env
            if ADMIN_EMAIL and ADMIN_PASSWORD:
                admin_username = normalize_username(
                    ADMIN_USERNAME or default_username_from_email(ADMIN_EMAIL)
                )
                cur.execute(
                    "SELECT id FROM users WHERE email = %s;", (ADMIN_EMAIL.lower(),)
                )
                existing_admin = cur.fetchone()
                if existing_admin is None:
                    admin_username = ensure_unique_username(cur, admin_username)
                    cur.execute(
                        """
                        INSERT INTO users (email, username, password_hash, role)
                        VALUES (%s, %s, %s, %s);
                        """,
                        (
                            ADMIN_EMAIL.lower(),
                            admin_username,
                            hash_password(ADMIN_PASSWORD),
                            "admin",
                        ),
                    )
                else:
                    admin_id = existing_admin[0]
                    admin_username = ensure_unique_username(
                        cur, admin_username, exclude_user_id=admin_id
                    )
                    cur.execute(
                        """
                        UPDATE users
                        SET email = %s,
                            username = %s,
                            password_hash = %s,
                            role = %s
                        WHERE id = %s;
                        """,
                        (
                            ADMIN_EMAIL.lower(),
                            admin_username,
                            hash_password(ADMIN_PASSWORD),
                            "admin",
                            admin_id,
                        ),
                    )
        conn.commit()

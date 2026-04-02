from contextlib import closing

from db import get_conn
from models.user import User
from security.passwords import hash_password, verify_password


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_username(username: str) -> str:
    return username.strip().lower()


def create_user(email: str, username: str, password: str, role: str = "customer") -> dict:
    normalized_email = _normalize_email(email)
    normalized_username = _normalize_username(username)
    if not normalized_email:
        raise ValueError("Email is required")
    if not normalized_username:
        raise ValueError("Username is required")

    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s;", (normalized_email,))
            if cur.fetchone() is not None:
                raise ValueError("Email is already registered")

            cur.execute("SELECT id FROM users WHERE username = %s;", (normalized_username,))
            if cur.fetchone() is not None:
                raise ValueError("Username is already taken")

            cur.execute(
                """
                INSERT INTO users (email, username, password_hash, role)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, username, role, created_at, updated_at;
                """,
                (normalized_email, normalized_username, hash_password(password), role),
            )
            row = cur.fetchone()
        conn.commit()

    return User.from_public_row(row).to_response()


def get_user_by_identifier(identifier: str):
    normalized_identifier = identifier.strip().lower()
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, username, password_hash, role, created_at, updated_at
                FROM users
                WHERE email = %s OR username = %s;
                """,
                (normalized_identifier, normalized_identifier),
            )
            row = cur.fetchone()

    if row is None:
        return None

    return {
        "id": row[0],
        "email": row[1],
        "username": row[2],
        "password_hash": row[3],
        "role": row[4],
        "created_at": row[5],
        "updated_at": row[6],
    }


def authenticate_user(identifier: str, password: str):
    user = get_user_by_identifier(identifier)
    if user is None:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    return User.from_db_row(
        (
            user["id"],
            user["email"],
            user["username"],
            user["password_hash"],
            user["role"],
            user["created_at"],
            user["updated_at"],
        )
    ).to_response()

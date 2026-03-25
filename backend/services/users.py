from contextlib import closing

from db import get_conn
from security.passwords import hash_password, verify_password


def create_user(email: str, password: str, role: str = "customer") -> dict:
    normalized_email = email.strip().lower()
    if not normalized_email:
        raise ValueError("Email is required")

    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s;", (normalized_email,))
            if cur.fetchone() is not None:
                raise ValueError("Email is already registered")

            cur.execute(
                """
                INSERT INTO users (email, password_hash, role)
                VALUES (%s, %s, %s)
                RETURNING id, email, role, created_at, updated_at;
                """,
                (normalized_email, hash_password(password), role),
            )
            row = cur.fetchone()
        conn.commit()

    return _row_to_user(row)


def get_user_by_email(email: str):
    normalized_email = email.strip().lower()
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, role, created_at, updated_at
                FROM users
                WHERE email = %s;
                """,
                (normalized_email,),
            )
            row = cur.fetchone()

    if row is None:
        return None

    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "role": row[3],
        "created_at": row[4],
        "updated_at": row[5],
    }


def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if user is None:
        return None

    if not verify_password(password, user["password_hash"]):
        return None

    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
    }


def _row_to_user(row) -> dict:
    return {
        "id": row[0],
        "email": row[1],
        "role": row[2],
        "created_at": row[3],
        "updated_at": row[4],
    }

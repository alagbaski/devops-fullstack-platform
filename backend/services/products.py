from contextlib import closing

import psycopg2

from db import get_conn
from schemas.products import ProductCreate


def list_active_products() -> list[dict]:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, slug, description, price, currency, inventory_count,
                       image_url, is_active, created_at, updated_at
                FROM products
                WHERE is_active = TRUE
                ORDER BY created_at DESC;
                """
            )
            rows = cur.fetchall()

    return [_row_to_product(row) for row in rows]


def create_product(payload: ProductCreate) -> dict:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            try:
                cur.execute(
                    """
                    INSERT INTO products (
                        name, slug, description, price, currency, inventory_count, image_url, is_active
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, name, slug, description, price, currency, inventory_count,
                              image_url, is_active, created_at, updated_at;
                    """,
                    (
                        payload.name.strip(),
                        payload.slug.strip().lower(),
                        payload.description.strip(),
                        payload.price,
                        payload.currency.upper(),
                        payload.inventory_count,
                        payload.image_url.strip() if payload.image_url else None,
                        payload.is_active,
                    ),
                )
                row = cur.fetchone()
            except psycopg2.errors.UniqueViolation as exc:
                conn.rollback()
                raise ValueError("Product slug already exists") from exc
        conn.commit()

    return _row_to_product(row)


def _row_to_product(row) -> dict:
    return {
        "id": row[0],
        "name": row[1],
        "slug": row[2],
        "description": row[3],
        "price": row[4],
        "currency": row[5],
        "inventory_count": row[6],
        "image_url": row[7],
        "is_active": row[8],
        "created_at": row[9],
        "updated_at": row[10],
    }

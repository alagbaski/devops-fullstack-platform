from contextlib import closing

import psycopg2

from db import get_conn
from models.product import Product
from schemas.products import ProductCreate, ProductUpdate


def list_active_products() -> list[dict]:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, slug, description, price, currency, inventory_count,
                       image_url, is_active, created_at, updated_at
                FROM products
                WHERE is_active = TRUE
                ORDER BY created_at DESC;
                """)
            rows = cur.fetchall()

    return [_row_to_product(row) for row in rows]


def get_product(product_id: int) -> dict | None:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, slug, description, price, currency, inventory_count,
                       image_url, is_active, created_at, updated_at
                FROM products
                WHERE id = %s;
                """,
                (product_id,),
            )
            row = cur.fetchone()

    if row is None:
        return None

    return _row_to_product(row)


def list_products_for_admin() -> list[dict]:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, slug, description, price, currency, inventory_count,
                       image_url, is_active, created_at, updated_at
                FROM products
                ORDER BY created_at DESC;
                """)
            rows = cur.fetchall()

    return [_row_to_product(row) for row in rows]


def create_product(payload: ProductCreate) -> dict:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            try:
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


def update_product(product_id: int, payload: ProductUpdate) -> dict:
    update_values = payload.model_dump(exclude_unset=True)
    if not update_values:
        raise ValueError("No product changes supplied")

    normalized_values = {}
    for key, value in update_values.items():
        if isinstance(value, str):
            normalized_values[key] = value.strip()
        else:
            normalized_values[key] = value

    if "currency" in normalized_values:
        normalized_values["currency"] = normalized_values["currency"].upper()

    assignments = ", ".join(f"{field} = %s" for field in normalized_values)
    parameters = list(normalized_values.values()) + [product_id]

    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM products WHERE id = %s;", (product_id,))
            if cur.fetchone() is None:
                raise ValueError("Product not found")

            cur.execute(
                f"""
                UPDATE products
                SET {assignments}, updated_at = NOW()
                WHERE id = %s
                RETURNING id, name, slug, description, price, currency, inventory_count,
                          image_url, is_active, created_at, updated_at;
                """,
                parameters,
            )
            row = cur.fetchone()
        conn.commit()

    return _row_to_product(row)


def delete_product(product_id: int) -> None:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM products WHERE id = %s;", (product_id,))
            if cur.fetchone() is None:
                raise ValueError("Product not found")

            cur.execute("DELETE FROM products WHERE id = %s;", (product_id,))
        conn.commit()


def get_product_counts() -> dict:
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_active = TRUE) AS active,
                    COUNT(*) FILTER (WHERE is_active = FALSE) AS inactive
                FROM products;
                """)
            row = cur.fetchone()

    return {
        "total": row[0],
        "active": row[1],
        "inactive": row[2],
    }


def _row_to_product(row) -> dict:
    return Product.from_db_row(row).to_response()

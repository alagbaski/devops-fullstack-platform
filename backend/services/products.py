"""
Product Service Module

This module provides business logic and data access functions for managing products.
It interacts directly with the PostgreSQL database to perform CRUD operations
and retrieve product-related information.

The `closing` context manager ensures that database connections are properly
closed after use, even if errors occur.
"""
from contextlib import closing

import psycopg2

from db import get_conn
from exceptions import EntityAlreadyExistsException, EntityNotFoundException, ValidationException
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
            rows = cur.fetchall() # Fetch all results from the query

    # Convert database rows into a list of Product response dictionaries
    return [_row_to_product(row) for row in rows]


def get_product(product_id: int) -> dict | None:
    """
    Retrieves a single product by its ID.
    Returns None if no product with the given ID is found.
    """
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

    # If no row is found, return None
    if row is None:
        return None

    # Convert the single database row to a Product response dictionary
    return _row_to_product(row)


def list_products_for_admin() -> list[dict]:
    """
    Retrieves all products, including inactive ones, typically for admin views.
    """
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, slug, description, price, currency, inventory_count,
                       image_url, is_active, created_at, updated_at
                FROM products
                ORDER BY created_at DESC;
                """)
            rows = cur.fetchall()

    # Convert database rows into a list of Product response dictionaries
    return [_row_to_product(row) for row in rows]


def create_product(payload: ProductCreate) -> dict:
    """
    Creates a new product in the database.
    Raises ValueError if a product with the same slug already exists.
    """
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
                conn.rollback() # Rollback the transaction on unique constraint violation
                raise EntityAlreadyExistsException("Product slug already exists") from exc
        conn.commit() # Commit the transaction if successful

    # Convert the newly created product's row to a response dictionary
    return _row_to_product(row)


def update_product(product_id: int, payload: ProductUpdate) -> dict:
    """
    Updates an existing product identified by its ID.
    Only fields provided in the payload will be updated.
    Raises ValueError if the product is not found or no changes are supplied.
    """
    update_values = payload.model_dump(exclude_unset=True)
    if not update_values:
        raise ValidationException("No product changes supplied")

    normalized_values = {}
    for key, value in update_values.items():
        if isinstance(value, str):
            normalized_values[key] = value.strip()
        else:
            normalized_values[key] = value

    # Ensure currency is always uppercase
    if "currency" in normalized_values:
        normalized_values["currency"] = normalized_values["currency"].upper()

    # Dynamically build the SET clause for the SQL UPDATE statement
    assignments = ", ".join(f"{field} = %s" for field in normalized_values)
    parameters = list(normalized_values.values()) + [product_id]

    # Check if the product exists before attempting to update
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM products WHERE id = %s;", (product_id,))
            if cur.fetchone() is None:
                raise EntityNotFoundException("Product not found")

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

    # Convert the updated product's row to a response dictionary
    return _row_to_product(row)


def delete_product(product_id: int) -> None:
    """
    Deletes a product from the database by its ID.
    Raises ValueError if the product is not found.
    """
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM products WHERE id = %s;", (product_id,))
            if cur.fetchone() is None:
                raise EntityNotFoundException("Product not found")

            cur.execute("DELETE FROM products WHERE id = %s;", (product_id,))
        conn.commit()


def get_product_counts() -> dict:
    """
    Retrieves a summary of product counts (total, active, inactive).
    """
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

    # Map the fetched counts to a dictionary
    return {
        "total": row[0],
        "active": row[1],
        "inactive": row[2],
    }


def _row_to_product(row) -> dict:
    """
    Helper function to convert a database row tuple into a Product model
    and then to a dictionary suitable for API responses.
    """
    return Product.from_db_row(row).to_response()

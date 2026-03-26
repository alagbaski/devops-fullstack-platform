from contextlib import closing

from fastapi import APIRouter

from db import get_conn
from schemas import Item

router = APIRouter()


@router.post("/items")
def add_item(item: Item):
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO items (name) VALUES (%s) RETURNING id;",
                (item.name,),
            )
            item_id = cur.fetchone()[0]
        conn.commit()

    return {"id": item_id, "name": item.name}


@router.get("/items")
def get_items():
    with closing(get_conn()) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM items;")
            rows = cur.fetchall()

    return [{"id": row[0], "name": row[1]} for row in rows]

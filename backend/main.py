
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel
import psycopg2
import os
import time

app = FastAPI()
Instrumentator().instrument(app).expose(app)

DB_HOST = os.getenv("DB_HOST","db")
DB_NAME = os.getenv("POSTGRES_DB","devopsdb")
DB_USER = os.getenv("POSTGRES_USER","devops")
DB_PASS = os.getenv("POSTGRES_PASSWORD","devops")

def get_conn():
    retries = 10
    while retries > 0:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            print("✅ Connected to database")
            return conn
        except Exception as e:
            print(f"⏳ DB not ready, retrying... {e}")
            retries -= 1
            time.sleep(3)

    raise Exception("❌ Database not reachable after retries")

class Item(BaseModel):
    name:str

@app.on_event("startup")
def startup():
    conn=get_conn()
    cur=conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, name TEXT);")
    conn.commit()
    cur.close()
    conn.close()

@app.post("/items")
def add_item(item:Item):
    conn=get_conn()
    cur=conn.cursor()
    cur.execute("INSERT INTO items (name) VALUES (%s) RETURNING id;",(item.name,))
    item_id=cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"id":item_id,"name":item.name}

@app.get("/items")
def get_items():
    conn=get_conn()
    cur=conn.cursor()
    cur.execute("SELECT id,name FROM items;")
    rows=cur.fetchall()
    cur.close()
    conn.close()
    return [{"id":r[0],"name":r[1]} for r in rows]

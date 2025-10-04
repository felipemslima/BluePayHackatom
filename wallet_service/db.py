import psycopg2
import os
from flask import g
from dotenv import load_dotenv

load_dotenv()

def get_db():
    if "db" not in g:
        g.db = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        g.db.set_session(isolation_level='SERIALIZABLE', autocommit=False)
    return g.db

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

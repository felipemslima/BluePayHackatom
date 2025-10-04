import sqlite3
import hashlib
import uuid
from datetime import datetime
import os

# Caminho do banco local (vai criar um arquivo .db na pasta)
DB_PATH = os.path.join(os.path.dirname(__file__), "wallet.db")

# Cria a tabela se não existir
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            token_id TEXT PRIMARY KEY,
            denom_cents INTEGER NOT NULL CHECK (denom_cents > 0),
            issued_at TEXT NOT NULL,
            state TEXT NOT NULL DEFAULT 'ISSUED',
            payload_sha256 BLOB NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def gerar_tokens(qtd: int):
    """Gera tokens de R$1 e salva no banco local SQLite"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    tokens_criados = []

    for _ in range(qtd):
        token_id = str(uuid.uuid4())
        denom_cents = 100  # 1 real
        issued_at = datetime.utcnow().isoformat() + "Z"

        payload = f"{token_id}:{denom_cents}:{issued_at}".encode()
        payload_hash = hashlib.sha256(payload).digest()

        cur.execute("""
            INSERT INTO tokens (token_id, denom_cents, issued_at, payload_sha256)
            VALUES (?, ?, ?, ?)
        """, (token_id, denom_cents, issued_at, payload_hash))

        tokens_criados.append({
            "token_id": token_id,
            "value": "R$ 1,00",
            "issued_at": issued_at
        })

    conn.commit()
    conn.close()

    print(f"{qtd} tokens criados com sucesso!\n")
    for t in tokens_criados:
        print(f"Token: {t['token_id']} | Valor: {t['value']} | Data: {t['issued_at']}")

if __name__ == "__main__":
    init_db()
    try:
        qtd = int(input("Quantos tokens você quer gerar? "))
        gerar_tokens(qtd)
    except Exception as e:
        print("Erro:", e)

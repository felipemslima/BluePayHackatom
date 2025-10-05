# debug_token.py
import requests
import sqlite3
import json
import os
import uuid # Necessário para a função canonical_bytes (se estiver usando)
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import Base64Encoder
from nacl.secret import SecretBox
from nacl.utils import random

SERVER_PK_B64 = "tIv5wPAmF2uiuDwqWKdWXGdbFRtG2d4I0sYUs8IlvfA=" 

# --- 1. CONFIGURAÇÕES GLOBAIS ---
FLASK_HOST = "http://localhost:5000"
ISSUE_ENDPOINT = "/tokens/issue"
REDEEM_ENDPOINT = "/redeem"
QTD_TOKENS = 1
WALLET_DB = "wallet.db"
DEBUG_ENDPOINT = "/_debug/token/"

# Ler o DB SQLite (ou criar se não existir)
if not os.path.exists(WALLET_DB):
    conn = sqlite3.connect(WALLET_DB)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE tokens (
            token_id TEXT PRIMARY KEY,
            denom_cents INTEGER,
            issuer_pubkey TEXT,
            issued_at TEXT,
            payload_sha256 BLOB,
            signature_b64 TEXT,
            state TEXT
        )
    """)
    conn.commit()
    conn.close()
conn = sqlite3.connect(WALLET_DB)
cur = conn.cursor()

token = "b873c703-ef41-4677-ab3e-58074f7009cf"

redeem_request = {
    "token_id": "b873c703-ef41-4677-ab3e-58074f7009cf",
    "user_id": "33333333-3333-3333-3333-333333333333",
    "requester_device": "bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbc",
    "token_payload": {
        "denom_cents": 100,
        "issued_at": "2025-10-05T12:34:00.155111Z",
        "issuer_pubkey": "tIv5wPAmF2uiuDwqWKdWXGdbFRtG2d4I0sYUs8IlvfA=",
        "token_id": "b873c703-ef41-4677-ab3e-58074f7009cf"
    },
    "token_signature_b64": "RGfbhljnSn9ABlGiYePCyaeBl4HuRZpUF5UjGQDLXFN9qwbVbpE7WB9iNusDrJp/v3TTxXlnKL1rJ0SHOVTLAQ=="
}

print("\n➡️ Enviando requisição de resgate manual...")
resposta = requests.post(FLASK_HOST + REDEEM_ENDPOINT, json=redeem_request)
print("Resposta do servidor:", resposta.status_code, resposta.text)

resposta = requests.get(FLASK_HOST + DEBUG_ENDPOINT + token)

print("Resposta do servidor:", resposta.status_code, resposta.text)

redeem = json.loads(resposta.text)
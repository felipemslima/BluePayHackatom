import sqlite3
import hashlib
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import Base64Encoder

# -------------------- Config/DB --------------------
load_dotenv()
DB_PATH = os.path.join(os.path.dirname(__file__), "wallet.db")

SERVER_SK_B64 = os.getenv("SERVER_SK_B64")
SERVER_PK_B64 = os.getenv("SERVER_PK_B64")

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
        );
    """)
    conn.commit()
    conn.close()

# -------------------- Crypto helpers --------------------
def canonical_bytes(payload: dict) -> bytes:
    """
    Serialização CANÔNICA estável:
    - chaves ordenadas
    - separadores compactos
    """
    # para evitar dependência extra, montamos manualmente a string canônica:
    # garantimos ordem de chaves: denom_cents, issued_at, issuer_pubkey, token_id
    s = f'{{"denom_cents":{payload["denom_cents"]},"issued_at":"{payload["issued_at"]}","issuer_pubkey":"{payload["issuer_pubkey"]}","token_id":"{payload["token_id"]}"}}'
    return s.encode("utf-8")

def sha256(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()

def sign_payload(payload_bytes: bytes, sk_b64: str) -> str:
    sk = SigningKey(sk_b64, encoder=Base64Encoder)
    sig = sk.sign(payload_bytes).signature
    return Base64Encoder.encode(sig).decode()

def verify_signature(payload_bytes: bytes, sig_b64: str, pk_b64: str) -> bool:
    try:
        vk = VerifyKey(pk_b64, encoder=Base64Encoder)
        sig = Base64Encoder.decode(sig_b64)
        vk.verify(payload_bytes, sig)  # lança exceção se inválida
        return True
    except Exception:
        return False

# -------------------- Emissão --------------------
def emitir_tokens(qtd: int):
    if not SERVER_SK_B64 or not SERVER_PK_B64:
        raise RuntimeError("Defina SERVER_SK_B64 e SERVER_PK_B64 no .env (use gen_keys.py).")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    emitidos = []
    for _ in range(qtd):
        token_id = str(uuid.uuid4())
        denom_cents = 100  # R$ 1,00
        issued_at = datetime.utcnow().isoformat() + "Z"

        # payload que VIAJA com a cédula
        payload = {
            "token_id": token_id,
            "denom_cents": denom_cents,
            "issuer_pubkey": SERVER_PK_B64,
            "issued_at": issued_at
        }
        pb = canonical_bytes(payload)
        digest = sha256(pb)
        signature_b64 = sign_payload(pb, SERVER_SK_B64)

        # Persistimos APENAS o hash (lookup rápido no resgate)
        cur.execute("""
            INSERT INTO tokens (token_id, denom_cents, issued_at, payload_sha256)
            VALUES (?, ?, ?, ?)
        """, (token_id, denom_cents, issued_at, digest))

        # “Pacote do cliente”: o que você entrega ao app
        emitidos.append({
            "token": payload,
            "signature_b64": signature_b64
        })

    conn.commit()
    conn.close()
    return emitidos

# -------------------- Execução CLI --------------------
if __name__ == "__main__":
    init_db()
    try:
        qtd = int(input("Quantos tokens de R$1 você quer gerar? "))
        tokens = emitir_tokens(qtd)
        print(f"\n{qtd} token(s) emitido(s). Entregue ao cliente os pacotes abaixo:\n")
        for pkg in tokens:
            print(pkg)  # pode trocar por JSON bonito se quiser
    except Exception as e:
        print("Erro:", e)

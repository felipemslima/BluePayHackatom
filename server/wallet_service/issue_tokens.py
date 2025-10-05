import hashlib
import uuid
from datetime import datetime
import os
from dotenv import load_dotenv
from nacl.signing import SigningKey
from nacl.encoding import Base64Encoder
from db import get_db
import psycopg2
import base64

load_dotenv()

SERVER_SK_B64 = os.getenv("SERVER_SK_B64")
SERVER_PK_B64 = os.getenv("SERVER_PK_B64")

def canonical_bytes(payload: dict) -> bytes:
    """Serialização canônica estável e determinística"""
    s = (
        f'{{"denom_cents":{payload["denom_cents"]},'
        f'"issued_at":"{payload["issued_at"]}",'
        f'"issuer_pubkey":"{payload["issuer_pubkey"]}",'
        f'"token_id":"{payload["token_id"]}"}}'
    )
    return s.encode("utf-8")

def sha256(b: bytes) -> bytes:
    return hashlib.sha256(b).digest()

def sign_payload(payload_bytes: bytes, sk_b64: str) -> str:
    sk = SigningKey(sk_b64, encoder=Base64Encoder)
    sig = sk.sign(payload_bytes).signature
    return Base64Encoder.encode(sig).decode()

def emitir_tokens(qtd: int):
    db = get_db()
    cur = db.cursor()
    emitidos = []
    
    # Decodifica a chave pública de Base64 para bytes UMA VEZ fora do loop
    issuer_pubkey_bytes = base64.b64decode(SERVER_PK_B64)

    print(f"🚀 Emitindo {qtd} tokens...")
    try:
        for _ in range(qtd):
            token_id = str(uuid.uuid4())
            denom_cents = 100
            issued_at = datetime.utcnow().isoformat() + "Z"

            payload = {
                "token_id": token_id,
                "denom_cents": denom_cents,
                "issuer_pubkey": SERVER_PK_B64, # A chave em Base64 vai no payload JSON
                "issued_at": issued_at
            }

            pb = canonical_bytes(payload)
            digest = sha256(pb)
            signature_b64 = sign_payload(pb, SERVER_SK_B64)

            cur.execute("""
                INSERT INTO tokens (token_id, denom_cents, issued_at, issuer_pubkey, payload_sha256, state)
                VALUES (%s, %s, %s, %s, %s, 'ISSUED')
            """, (token_id, denom_cents, issued_at, issuer_pubkey_bytes, psycopg2.Binary(digest)))

            emitidos.append({
                "payload": payload,
                "signature_b64": signature_b64,
                "payload_sha256_b64": Base64Encoder.encode(digest).decode()
            })

        db.commit()
        print(f"✅ {len(emitidos)} token(s) emitido(s) com sucesso.")
    
    except (Exception, psycopg2.Error) as error:
        db.rollback() # Desfaz a transação em caso de erro
        print(f"❌ Erro ao emitir tokens: {error}")
        raise error # Propaga o erro para o endpoint Flask tratar
    
    finally:
        cur.close()
        db.close()

    return emitidos
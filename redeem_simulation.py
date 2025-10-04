import psycopg2
import uuid
from datetime import datetime

DB_CONFIG = {
    "dbname": "offlinepay",
    "user": "admin",
    "password": "admin123",
    "host": "localhost",
    "port": "5432"
}

def new_uuid():
    return str(uuid.uuid4())

# -------------------------------------------------------------------
# Função principal de redenção
# -------------------------------------------------------------------
def redeem_token(token_id, requester_user):
    conn = psycopg2.connect(**DB_CONFIG)
    conn.set_session(isolation_level='SERIALIZABLE', autocommit=False)
    cur = conn.cursor()

    redemption_id = new_uuid()
    idempotency_key = uuid.uuid5(uuid.NAMESPACE_DNS, token_id)  # determinístico

    # 🔧 Verifica se o user tem device; se não, cria um
    cur.execute("SELECT device_id FROM devices WHERE user_id=%s LIMIT 1;", (requester_user,))
    row = cur.fetchone()
    if row:
        requester_device = row[0]
    else:
        requester_device = new_uuid()
        cur.execute("""
            INSERT INTO devices (device_id, user_id, attested_pubkey, cert_fingerprint)
            VALUES (%s, %s, %s, %s)
        """, (requester_device, requester_user, b"mock_pubkey", b"mock_fingerprint"))
        print(f"🆕 Dispositivo criado: {requester_device}")

    try:
                # 1) Registro de redenção (com proteção idempotente)
        cur.execute("""
        INSERT INTO redemptions (redemption_id, requester_user, requester_device, idempotency_key)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (idempotency_key) DO NOTHING
        """, (redemption_id, requester_user, requester_device, idempotency_key.bytes))

        # Verifica se a inserção foi ignorada (replay idempotente)
        cur.execute("""
        SELECT redemption_id, status FROM redemptions WHERE idempotency_key = %s
        """, (idempotency_key.bytes,))
        existing = cur.fetchone()
        if existing and existing[1] == 'APPLIED':
            print(f"⚠️ Requisição repetida detectada. Redenção {existing[0]} já aplicada.")
            conn.rollback()
            return

        # 2) Item de redenção
        cur.execute("""
        INSERT INTO redemption_items (redemption_id, token_id)
        VALUES (%s, %s)
        """, (redemption_id, token_id))

        # 3) Lock e verificação do token
        cur.execute("""
        SELECT token_id, denom_cents, state
        FROM tokens
        WHERE token_id = %s
        FOR UPDATE
        """, (token_id,))
        row = cur.fetchone()

        if not row:
            raise Exception("❌ Token não encontrado!")
        if row[2] != 'ISSUED':
            raise Exception(f"⚠️ Token já resgatado ou inválido (estado = {row[2]})")

        denom = row[1]

        # 4) Atualizar token
        cur.execute("""
        UPDATE tokens SET state='REDEEMED', owner_hint=%s WHERE token_id=%s
        """, (requester_user, token_id))

        # 5) Partida dobrada
        issuer_account = get_issuer_account(cur)
        receiver_account = get_receiver_account(cur, requester_user)
        tx_id = new_uuid()

        cur.execute("""
        INSERT INTO ledger_entries (tx_id, account_id, side, amount_cents, currency, description)
        VALUES
          (%s, %s, 'DEBIT',  %s, 'BRL', 'Resgate de token'),
          (%s, %s, 'CREDIT', %s, 'BRL', 'Recebimento de token');
        """, (
            tx_id, issuer_account, denom,
            tx_id, receiver_account, denom
        ))

        cur.execute("UPDATE redemptions SET status='APPLIED' WHERE redemption_id=%s", (redemption_id,))
        conn.commit()

        print(f"✅ Token {token_id} resgatado com sucesso ({denom} centavos).")
    except Exception as e:
        conn.rollback()
        print(f"❌ Falha no resgate: {e}")
    finally:
        cur.close()
        conn.close()

def get_issuer_account(cur):
    cur.execute("SELECT account_id FROM accounts WHERE kind='ISSUANCE_RESERVE' LIMIT 1;")
    return cur.fetchone()[0]

def get_receiver_account(cur, user_id):
    cur.execute("SELECT account_id FROM accounts WHERE user_id=%s AND kind='USER_WALLET' LIMIT 1;", (user_id,))
    return cur.fetchone()[0]

# -------------------------------------------------------------------
# Simulação
# -------------------------------------------------------------------
if __name__ == "__main__":
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("SELECT token_id FROM tokens WHERE state='ISSUED' LIMIT 1;")
    token_id = cur.fetchone()[0]

    cur.execute("SELECT user_id FROM users LIMIT 1;")
    user_id = cur.fetchone()[0]

    cur.close()
    conn.close()

    print(f"🎟️ Tentando resgatar token {token_id} para o usuário {user_id}")

    redeem_token(token_id, user_id)

    print("\n💥 Tentando resgatar o mesmo token novamente (deve falhar)...")
    redeem_token(token_id, user_id)

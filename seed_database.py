import psycopg2
import uuid
from datetime import datetime, timedelta

# Conexão com o banco no Docker
conn = psycopg2.connect(
    dbname="offlinepay",
    user="admin",
    password="admin123",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

# Helper para gerar UUID
def new_uuid():
    return str(uuid.uuid4())

# -------------------------------------------------------------------
# 1. Criar usuários
# -------------------------------------------------------------------
user1 = new_uuid()
user2 = new_uuid()

cur.execute("""
INSERT INTO users (user_id, kyc_level, status)
VALUES (%s, %s, %s), (%s, %s, %s)
RETURNING user_id;
""", (user1, 'basic', 'active', user2, 'basic', 'active'))

print(f"Usuários criados:\n- user1: {user1}\n- user2: {user2}")

# -------------------------------------------------------------------
# 2. Criar contas (carteiras + conta emissora)
# -------------------------------------------------------------------
issuer_account = new_uuid()
wallet1 = new_uuid()
wallet2 = new_uuid()

cur.execute("""
INSERT INTO accounts (account_id, user_id, kind, currency)
VALUES
  (%s, NULL, 'ISSUANCE_RESERVE', 'BRL'),
  (%s, %s, 'USER_WALLET', 'BRL'),
  (%s, %s, 'USER_WALLET', 'BRL');
""", (issuer_account, wallet1, user1, wallet2, user2))

print(f"Contas criadas:\n- issuer_account: {issuer_account}\n- wallet1: {wallet1}\n- wallet2: {wallet2}")

# -------------------------------------------------------------------
# 3. Criar tokens emitidos
# -------------------------------------------------------------------
issuer_pubkey = b'issuer_public_key_mock'  # apenas exemplo binário

tokens = []
for denom in [100, 500, 1000]:
    for i in range(3):  # 3 tokens por denominação
        token_id = new_uuid()
        tokens.append((token_id, denom))
        cur.execute("""
        INSERT INTO tokens (token_id, denom_cents, issuer_pubkey, issued_at, exp_at, state, owner_hint, payload_sha256)
        VALUES (%s, %s, %s, %s, %s, 'ISSUED', NULL, %s)
        """, (
            token_id,
            denom,
            issuer_pubkey,
            datetime.utcnow(),
            datetime.utcnow() + timedelta(days=30),
            b'fake_hash_example'
        ))

print(f"Total de tokens criados: {len(tokens)}")

# -------------------------------------------------------------------
# 4. Criar lançamentos iniciais (contábil: emissor credita tokens emitidos)
# -------------------------------------------------------------------
for tid, denom in tokens:
    tx_id = new_uuid()
    cur.execute("""
    INSERT INTO ledger_entries (tx_id, account_id, side, amount_cents, currency, description)
    VALUES
      (%s, %s, 'CREDIT', %s, 'BRL', 'Token emission to reserve'),
      (%s, %s, 'DEBIT',  %s, 'BRL', 'Liability for issued token');
    """, (
        tx_id, issuer_account, denom,
        tx_id, issuer_account, denom  # aqui simplificado (mesma conta, apenas mock)
    ))

# -------------------------------------------------------------------
# 5. Commit final
# -------------------------------------------------------------------
conn.commit()
print("✅ Dados inseridos com sucesso!")

# Visualizar tokens emitidos
cur.execute("SELECT token_id, denom_cents, state FROM tokens LIMIT 10;")
for row in cur.fetchall():
    print(row)

cur.close()
conn.close()

from flask import Flask, jsonify, request
from db import get_db, close_db
import uuid
from datetime import datetime

app = Flask(__name__)
app.teardown_appcontext(close_db)

def new_uuid(): return str(uuid.uuid4())

# ===============================================================
# Endpoint de teste
# ===============================================================
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok", "service": "wallet-service"}), 200


# ===============================================================
# 1. Listar tokens disponíveis (mock de carteira do usuário)
# ===============================================================
@app.route("/tokens/<user_id>", methods=["GET"])
def list_tokens(user_id):
    print(f"🔍 Listando tokens para user_id: {user_id}")
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute("""
            SELECT token_id, denom_cents, state
            FROM tokens
            WHERE owner_hint IS NULL OR owner_hint = %s::uuid
            ORDER BY issued_at DESC
        """, (user_id,))
        tokens = [
            {"token_id": str(tid), "denom": denom, "state": state}
            for tid, denom, state in cur.fetchall()
        ]
        return jsonify(tokens), 200
    except Exception as e:
        db.rollback()
        print("❌ Erro em list_tokens:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()


# ===============================================================
# 2. Endpoint para resgatar token
# ===============================================================
@app.route("/redeem", methods=["POST"])
def redeem_token():
    data = request.get_json()
    user_id = data.get("user_id")
    token_id = data.get("token_id")

    if not user_id or not token_id:
        return jsonify({"error": "Campos obrigatórios: user_id, token_id"}), 400

    db = get_db()
    cur = db.cursor()
    redemption_id = new_uuid()
    idempotency_key = uuid.uuid5(uuid.NAMESPACE_DNS, token_id).bytes

    try:
        # garante device
        cur.execute("SELECT device_id FROM devices WHERE user_id=%s LIMIT 1;", (user_id,))
        row = cur.fetchone()
        if row:
            requester_device = row[0]
        else:
            requester_device = new_uuid()
            cur.execute("""
                INSERT INTO devices (device_id, user_id, attested_pubkey, cert_fingerprint)
                VALUES (%s, %s, %s, %s)
            """, (requester_device, user_id, b"pubkey", b"fingerprint"))

        # cria redenção (idempotente)
        cur.execute("""
            INSERT INTO redemptions (redemption_id, requester_user, requester_device, idempotency_key)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (idempotency_key) DO NOTHING
        """, (redemption_id, user_id, requester_device, idempotency_key))

        cur.execute("SELECT redemption_id, status FROM redemptions WHERE idempotency_key=%s;",
                    (idempotency_key,))
        existing = cur.fetchone()
        if existing and existing[1] == "APPLIED":
            db.rollback()
            return jsonify({"status": "duplicate", "message": "Redenção já aplicada"}), 200

        # insere item
        cur.execute("""
            INSERT INTO redemption_items (redemption_id, token_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, (redemption_id, token_id))

        # lock token
        cur.execute("SELECT token_id, denom_cents, state FROM tokens WHERE token_id=%s FOR UPDATE;",
                    (token_id,))
        row = cur.fetchone()
        if not row:
            db.rollback()
            return jsonify({"error": "Token não encontrado"}), 404
        if row[2] != "ISSUED":
            db.rollback()
            return jsonify({"error": f"Token já resgatado ({row[2]})"}), 409

        denom = row[1]

        # atualiza token
        cur.execute("UPDATE tokens SET state='REDEEMED', owner_hint=%s WHERE token_id=%s;",
                    (user_id, token_id))

        # contas
        cur.execute("SELECT account_id FROM accounts WHERE kind='ISSUANCE_RESERVE' LIMIT 1;")
        issuer_account = cur.fetchone()[0]
        cur.execute("SELECT account_id FROM accounts WHERE user_id=%s AND kind='USER_WALLET' LIMIT 1;",
                    (user_id,))
        receiver_account = cur.fetchone()[0]

        tx_id = new_uuid()
        cur.execute("""
            INSERT INTO ledger_entries (tx_id, account_id, side, amount_cents, currency, description)
            VALUES
              (%s, %s, 'DEBIT',  %s, 'BRL', 'Resgate de token via API'),
              (%s, %s, 'CREDIT', %s, 'BRL', 'Recebimento de token via API');
        """, (tx_id, issuer_account, denom, tx_id, receiver_account, denom))

        cur.execute("UPDATE redemptions SET status='APPLIED' WHERE redemption_id=%s;", (redemption_id,))
        db.commit()
        return jsonify({"status": "success", "redemption_id": redemption_id}), 200

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()

import logging
logging.basicConfig(level=logging.DEBUG)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

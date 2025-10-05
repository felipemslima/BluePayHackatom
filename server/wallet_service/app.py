from flask import Flask, jsonify, request, current_app
from db import get_db, close_db
import uuid
from datetime import datetime
from issue_tokens import emitir_tokens
from base64 import b64encode
import hashlib
from nacl.signing import SigningKey, VerifyKey
from issue_tokens import emitir_tokens


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

# ===============================================================
# 3. Emitir tokens (somente servidor)
# ===============================================================
@app.route("/tokens/issue", methods=["POST"])
def issue_tokens(): # Renomeei de issue_tokens2 para o nome no traceback
    try:
        data = request.get_json(force=True)
        qtd = int(data.get("qtd", 1))
        
        # A função emitir_tokens já retorna uma lista de dicionários
        # com 'payload', 'signature_b64', etc.
        tokens_emitidos = emitir_tokens(qtd)

        # Você pode retornar essa lista diretamente!
        return jsonify({
            "status": "success",
            "qtd_emitidos": len(tokens_emitidos),
            "tokens": tokens_emitidos # Retorna a lista completa de tokens gerados
        }), 201

    except Exception as e:
        current_app.logger.error(f"Erro ao emitir tokens: {e}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Erro interno ao emitir tokens."
        }), 500
    
@app.route("/tokens/issue2", methods=["POST"])
def issue_tokens2():
    try:
        data = request.get_json(force=True)
        if not data or "qtd" not in data:
            return jsonify({"status": "error", "message": "Missing 'qtd' in request body"}), 400

        qtd = int(data.get("qtd", 1))
        if qtd <= 0:
            return jsonify({"status": "error", "message": "'qtd' must be a positive integer"}), 400

        print(f"🪙 Emitindo {qtd} token(s) de R$1")
        
        # A variável 'tokens' agora é usada, embora não seja retornada ao cliente
        tokens = emitir_tokens(qtd)

        return jsonify({
            "status": "success",
            "message": f"{len(tokens)} token(s) issued successfully.",
            "qtd_emitidos": len(tokens)
        }), 201

    except ValueError:
         return jsonify({"status": "error", "message": "'qtd' must be a valid integer"}), 400
    except Exception as e:
        # Captura qualquer erro da função emitir_tokens e retorna um erro 500 claro
        return jsonify({
            "status": "error",
            "message": "An internal error occurred while issuing tokens.",
            "error_details": str(e) # Opcional: não exponha detalhes do erro em produção
        }), 500


# ===============================================================
# Logging
@app.before_request
def log_request_info():
    app.logger.debug(f"Request: {request.method} {request.url}")
    app.logger.debug(f"Headers: {request.headers}")
    app.logger.debug(f"Body: {request.get_data()}")
# ===============================================================


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

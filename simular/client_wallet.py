# client_wallet.py
import requests
import sqlite3
import json
import os
import uuid # Necessário para a função canonical_bytes (se estiver usando)
from nacl.signing import SigningKey, VerifyKey
from nacl.encoding import Base64Encoder
from nacl.secret import SecretBox
from nacl.utils import random

if os.path.exists("wallet.db"):
    os.remove("wallet.db")  # Remove DB antigo para começar do zero (apenas para demonstração)


# --- CHAVE PÚBLICA DO SERVIDOR (PARA FINS DIDÁTICOS) ---
# Substitua pelo valor real da sua chave pública do servidor.
# O cliente usa esta chave para verificar a autenticidade dos tokens.
SERVER_PK_B64 = os.environ["SERVER_PK_B64"]  # same value as server/wallet_service/.env

# --- 1. CONFIGURAÇÕES GLOBAIS ---
FLASK_HOST = "http://localhost:5000"
ISSUE_ENDPOINT = "/tokens/issue"
REDEEM_ENDPOINT = "/redeem"
QTD_TOKENS = 1
WALLET_DB = "wallet.db"

# --- FUNÇÕES DE CRIPTOGRAFIA AUXILIARES (IDÊNTICAS AO BACKEND) ---

def canonical_bytes(payload: dict) -> bytes:
    """Serialização canônica estável e determinística (DEVE ser idêntica ao servidor)"""
    s = (
        f'{{"denom_cents":{payload["denom_cents"]},'
        f'"issued_at":"{payload["issued_at"]}",'
        f'"issuer_pubkey":"{payload["issuer_pubkey"]}",'
        f'"token_id":"{payload["token_id"]}"}}'
    )
    return s.encode("utf-8")

def verify_signature(payload_bytes: bytes, signature_b64: str, pk_b64: str) -> bool:
    """Verifica a assinatura usando a chave pública do emissor."""
    try:
        vk = VerifyKey(pk_b64, encoder=Base64Encoder)
        signature = Base64Encoder.decode(signature_b64)
        vk.verify(payload_bytes, signature)
        return True
    except Exception:
        return False

# --- 2. GERAÇÃO DE CHAVES E CONFIGURAÇÃO ---

def generate_key_pair(name):
    """Gera e salva chaves Ed25519 para um cliente."""
    if os.path.exists(f"{name}_sk.b64"):
        with open(f"{name}_sk.b64", "r") as f:
            sk_b64 = f.read().strip()
            sk = SigningKey(sk_b64, encoder=Base64Encoder)
    else:
        sk = SigningKey.generate()
        sk_b64 = sk.encode(Base64Encoder).decode()
        with open(f"{name}_sk.b64", "w") as f:
            f.write(sk_b64)
    
    pk_b64 = sk.verify_key.encode(Base64Encoder).decode()
    return sk, pk_b64

# Geração ou Carregamento das Chaves
CLIENT1_SK, CLIENT1_PK_B64 = generate_key_pair("client1")
CLIENT2_SK, CLIENT2_PK_B64 = generate_key_pair("client2")

# IDs Reais do Cliente 2 (Redentor)
CLIENT2_USER_ID = "22222222-2222-2222-2222-222222222222" 
CLIENT2_DEVICE_ID = "bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


# --- 3. FUNÇÕES DE BANCO DE DADOS (CARTEIRA) ---
# (As funções setup_db, store_token, get_first_available_token e mark_token_redeemed permanecem as mesmas)

NEW_USER_ENDPOINT = "/new_user"

def ensure_user_exists(user_id: str, kyc_level: str = "basic", status: str = "active"):
    """Verifica se o usuário existe no backend e cria caso não exista."""
    payload = {
        "user_id": user_id,
        "kyc_level": kyc_level,
        "status": status
    }

    try:
        print(f"👤 Verificando/criando usuário {user_id} no backend...")
        response = requests.post(f"{FLASK_HOST}{NEW_USER_ENDPOINT}", json=payload)
        if response.status_code in (200, 201):
            print(f"✅ Usuário {user_id} disponível no servidor.")
        elif response.status_code == 409:
            print(f"⚠️ Usuário {user_id} já existe.")
        else:
            print(f"⚠️ Resposta inesperada do servidor: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Falha ao conectar ao servidor para criar usuário: {e}")

NEW_DEVICE_ENDPOINT = "/new_device"

def ensure_device_exists(user_id: str, device_id: str, pubkey_b64: str):
    """Registra um device no backend, se ainda não existir."""
    payload = {
        "device_id": device_id,
        "user_id": user_id,
        "attested_pubkey": pubkey_b64,
        "cert_fingerprint": pubkey_b64  # simplificação didática
    }

    try:
        print(f"📱 Verificando/criando device {device_id} para user {user_id}...")
        response = requests.post(f"{FLASK_HOST}{NEW_DEVICE_ENDPOINT}", json=payload)
        if response.status_code in (200, 201):
            print(f"✅ Device {device_id} registrado no backend.")
        else:
            print(f"⚠️ Resposta inesperada do servidor: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Falha ao criar device: {e}")

def setup_db(db_name):
    """Cria/abre a carteira SQLite e garante colunas necessárias."""

    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id TEXT NOT NULL UNIQUE,
            token_data_json TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'AVAILABLE'
        )
    """)
    # --- MIGRAÇÃO: adicionar coluna transferred se não existir ---
    cursor.execute("PRAGMA table_info(tokens)")
    cols = [row[1] for row in cursor.fetchall()]
    if "transferred" not in cols:
        cursor.execute("ALTER TABLE tokens ADD COLUMN transferred INTEGER NOT NULL DEFAULT 0")
        conn.commit()
    return conn, cursor


def store_token(conn, cursor, token_id, token_data):
    """Armazena o token completo como JSON na carteira."""
    try:
        cursor.execute("""
            INSERT INTO tokens (token_id, token_data_json)
            VALUES (?, ?)
        """, (token_id, json.dumps(token_data)))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        print(f"⚠️ Token ID {token_id} já existe na carteira. Ignorando.")
        return False

def get_first_available_token(cursor):
    """Pega o primeiro token disponível e ainda não transferido; marca como PENDING."""
    cursor.execute("""
        SELECT token_id, token_data_json
        FROM tokens
        WHERE status='AVAILABLE' AND transferred=0
        LIMIT 1
    """)
    row = cursor.fetchone()
    if row:
        token_id, token_data_json = row
        token_data = json.loads(token_data_json)
        cursor.execute("UPDATE tokens SET status='PENDING' WHERE token_id=?", (token_id,))
        return token_id, token_data
    return None, None

def mark_token_redeemed(conn, cursor, token_id):
    """Marca o token como RESGATADO após o sucesso do servidor."""
    cursor.execute("UPDATE tokens SET status='REDEEMED' WHERE token_id=?", (token_id,))
    conn.commit()
    print(f"   -> Token {token_id[:8]}... marcado como REDEEMED na carteira local.")


# --- 4. FUNÇÕES DE CRIPTOGRAFIA E TRANSFÊNCIA ---
# (As funções encrypt_token e decrypt_token permanecem as mesmas)

def encrypt_token(token_data: dict, recipient_pubkey_b64: str) -> str:
    """Simula a criptografia para transferência P2P (Simétrica simples para demonstração)."""
    transfer_key = random(SecretBox.KEY_SIZE) 
    secret_box = SecretBox(transfer_key)
    token_bytes = json.dumps(token_data).encode('utf-8')
    nonce = random(SecretBox.NONCE_SIZE)
    encrypted_token = secret_box.encrypt(token_bytes, nonce).ciphertext
    
    transfer_data = {
        "encrypted_token_b64": Base64Encoder.encode(encrypted_token).decode(),
        "transfer_key_b64": Base64Encoder.encode(transfer_key).decode(), 
        "nonce_b64": Base64Encoder.encode(nonce).decode()
    }
    return json.dumps(transfer_data)

def decrypt_token(transfer_data_json: str) -> dict:
    """Cliente 2 descriptografa o token recebido."""
    data = json.loads(transfer_data_json)
    encrypted_token = Base64Encoder.decode(data['encrypted_token_b64'])
    transfer_key = Base64Encoder.decode(data['transfer_key_b64'])
    nonce = Base64Encoder.decode(data['nonce_b64'])

    secret_box = SecretBox(transfer_key)
    decrypted_bytes = secret_box.decrypt(encrypted_token, nonce)
    
    return json.loads(decrypted_bytes.decode('utf-8'))

NEW_ACCOUNT_ENDPOINT = "/new_account"

def ensure_account_exists(user_id: str):
    """Garante que o usuário tenha uma conta (USER_WALLET) registrada no backend."""
    payload = {"user_id": user_id}

    try:
        print(f"🏦 Verificando/criando conta para user {user_id}...")
        response = requests.post(f"{FLASK_HOST}{NEW_ACCOUNT_ENDPOINT}", json=payload)
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Conta criada com sucesso: {data.get('account_id')}")
        elif response.status_code == 200:
            print(f"⚠️ Conta já existente: {response.json().get('account_id')}")
        else:
            print(f"⚠️ Resposta inesperada do servidor: {response.status_code} - {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Falha ao criar/verificar conta: {e}")
 

# --- 5. LÓGICA DO FLUXO PRINCIPAL ---

def flow_1_issue_tokens(qtd: int):
    """
    Chama o endpoint de emissão, ARMAZENA e VALIDA a assinatura do servidor.
    """
    conn, cursor = setup_db(WALLET_DB)
    
    print(f"\n🚀 [FLUXO 1: EMISSÃO] Solicitando {qtd} tokens ao Servidor Flask...")
    
    try:
        response = requests.post(
            f"{FLASK_HOST}{ISSUE_ENDPOINT}",
            json={"qtd": qtd},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        tokens_list = response.json().get("tokens", [])
        tokens_validos = 0

        for token_data in tokens_list:
            payload = token_data['payload']
            signature_b64 = token_data['signature_b64']
            
            # --- VALIDAÇÃO CRÍTICA DO CLIENTE ---
            payload_bytes = canonical_bytes(payload)
            if not verify_signature(payload_bytes, signature_b64, SERVER_PK_B64):
                print(f"❌ Token {payload['token_id'][:8]}... falhou na verificação do Servidor! IGNORADO.")
                continue
            # --- FIM DA VALIDAÇÃO ---
            
            store_token(conn, cursor, payload['token_id'], token_data)
            tokens_validos += 1
        
        print(f"✅ {tokens_validos} token(s) emitido(s) e válidos armazenado(s) na carteira de Client 1.")

    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao conectar/emitir tokens: {e}")
    finally:
        conn.close()

def flow_2_offline_transfer():
    """Simula a transferência offline (criptografia) de Client 1 para Client 2."""
    conn, cursor = setup_db(WALLET_DB)

    # Começa uma transação para evitar condições de corrida
    conn.execute("BEGIN IMMEDIATE")
    token_id, token_data = get_first_available_token(cursor)
    if not token_id:
        conn.commit()
        conn.close()
        print("\n⚠️ [FLUXO 2: TRANSFERÊNCIA] Nenhum token disponível/legítimo para transferência.")
        return None

    # Tenta marcar como transferido (idempotente e atômico)
    cursor.execute("UPDATE tokens SET transferred=1 WHERE token_id=? AND transferred=0", (token_id,))
    if cursor.rowcount == 0:
        # Outro fluxo já marcou; aborta esta tentativa
        conn.rollback()
        conn.close()
        print(f"⚠️ Token {token_id[:8]}... já foi marcado como transferido. Abortando.")
        return None

    # Confirma a marcação antes de gerar o payload P2P
    conn.commit()
    conn.close()

    print(f"\n🤝 [FLUXO 2: TRANSFERÊNCIA] Transferindo token {token_id[:8]}... para Client 2")
    encrypted_data_p2p = encrypt_token(token_data, CLIENT2_PK_B64)
    print(f"   -> Token criptografado. Client 1 envia este JSON para Client 2.")
    return encrypted_data_p2p, token_id

def revert_transfer_flag(conn, cursor, token_id):
    cursor.execute("UPDATE tokens SET transferred=0, status='AVAILABLE' WHERE token_id=?", (token_id,))
    conn.commit()
    print(f"↩️  Transfer flag revertido para token {token_id[:8]}...")

def flow_3_redeem_token(encrypted_data_p2p, original_token_id):
    """
    Client 2 descriptografa, verifica e envia o token para resgate no servidor, 
    incluindo a prova criptográfica para o backend.
    """
    if not encrypted_data_p2p:
        return

    print(f"\n💸 [FLUXO 3: RESGATE] Client 2 recebeu o token. Descriptografando...")
    
    # 1. Descriptografia e Validação (pode incluir validação da assinatura aqui)
    try:
        token_data = decrypt_token(encrypted_data_p2p)
        print("   -> Token descriptografado com sucesso.")
    except Exception as e:
        print(f"❌ Erro ao descriptografar token: {e}")
        return
    
    print(token_data)

    payload = token_data['payload']
    signature_b64 = token_data['signature_b64']
    
    # 2. Criação da Requisição de Resgate (COM PROVA CRIPTOGRÁFICA)
    redeem_request = {
        "token_id": payload['token_id'],
        "user_id": CLIENT2_USER_ID,
        "requester_device": CLIENT2_DEVICE_ID, # Adicionado o Device ID
        
        # PROVAS CRÍTICAS PARA O BACKEND VALIDAR A AUTENTICIDADE:
        "token_payload": payload,
        "token_signature_b64": signature_b64
    }

    print(f"   -> Enviando requisição de resgate para o servidor...")
    conn, cursor = setup_db(WALLET_DB) 

    try:
        response = requests.post(f"{FLASK_HOST}{REDEEM_ENDPOINT}", json=redeem_request)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == "success":
            print(f"🎉 SUCESSO! Token {payload['token_id'][:8]}... RESGATADO pelo Servidor.")
            mark_token_redeemed(conn, cursor, original_token_id)
        else:
            print(f"❌ Resgate falhou no servidor: {data.get('message') or data}")
            revert_transfer_flag(conn, cursor, original_token_id)
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao resgatar token: {e}")
        revert_transfer_flag(conn, cursor, original_token_id)
    finally:
        conn.close()

# --- EXECUÇÃO ---
if __name__ == "__main__":
    print("\n🚀 Inicializando fluxo da carteira...")


    # 1️⃣ Client 1 (Carteira) solicita emissão de tokens
    flow_1_issue_tokens(QTD_TOKENS)

    # 2️⃣ Client 1 (Emissor) transfere o token para Client 2
    transfer_data, token_id_original = flow_2_offline_transfer()



    # 3️⃣ Client 2 (Recebedor) descriptografa e resgata o token
    if transfer_data:
        flow_3_redeem_token(transfer_data, token_id_original)

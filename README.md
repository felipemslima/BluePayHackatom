# 💳 BluePay — Sistema de Pagamentos Offline (Hackatom 2025)

> Prova de conceito (PoC) de **pagamentos digitais offline** com tokens criptograficamente assinados.  
> O projeto demonstra a emissão, transferência e resgate de cédulas digitais entre carteiras **sem conexão contínua com o servidor**.

---

## 📘 Visão Geral

O sistema é composto por **dois componentes principais**:

1. 🖥️ **Servidor Flask (`server-wallet-service`)**
   - Emite tokens assinados (`/tokens/issue`)
   - Garante unicidade e rastreabilidade no resgate (`/redeem`)
   - Mantém base de dados **PostgreSQL** com controle contábil de duplo lançamento

2. 💼 **Cliente (`client_wallet.py`)**
   - Solicita tokens emitidos pelo servidor
   - Armazena localmente em uma `wallet.db` (SQLite)
   - Transfere tokens P2P (criptografia simétrica simulada)
   - Resgata o token no servidor para crédito em conta

---

## ⚙️ Arquitetura
    ┌──────────────────────────┐
    │        Servidor          │
    │  Flask + PostgreSQL      │
    │                          │
    │ /new_user                │
    │ /new_device              │
    │ /create_account          │
    │ /tokens/issue            │
    │ /redeem                  │
    └──────────┬───────────────┘
               │ HTTP (REST)
               ▼
    ┌──────────────────────────┐
    │        Cliente           │
    │  Python + SQLite         │
    │                          │
    │  flow_1_issue_tokens()   │
    │  flow_2_offline_transfer(│
    │  flow_3_redeem_token()   │
    └──────────────────────────┘


---

## 🧩 Componentes

### 🗄️ Banco de Dados (`PostgreSQL`)

- Banco: `offlinepay`
- Usuário padrão: `admin` / `admin123`
- Tabelas principais:
  - `users`, `devices`, `accounts`
  - `tokens`, `redemptions`, `redemption_items`
  - `ledger_entries`

### 💰 Tokens digitais

Cada token é emitido com um payload canônico:

```json
{
  "denom_cents": 100,
  "issued_at": "2025-10-05T12:30:45Z",
  "issuer_pubkey": "tIv5wPAmF2u...",
  "token_id": "90b2cfc6-28d1-4789-a4f7-2aa14e079ca4"
}



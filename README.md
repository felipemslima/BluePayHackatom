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
```

## 📱 Aplicativo Android
Idealização da estrutura do nosso app, feito em react para web depois convertido em um app android. pode ser instalado via .apk.
Por questão de tempo não foram implementadas as conexões com backend e a funcionalidade de transferência

## 🧰 Instalação e Execução
### 1️⃣ Clonar o repositório
```
git clone https://github.com/<seu-user>/BluePayHackatom.git
cd BluePayHackatom
``` 

###2️⃣ Subir containers
``` 
docker compose up --build
``` 


###3️⃣ Testes 
Esse teste simula a transação entre duas pessoas.
Cliente 1 gera tokens, guarda no seu próprio banco de dados, assina e transfere para o Cliente 2 (guarda em uma variável).
Cliente 2 verifica a assinatura e faz envia solicitação de redeem.
``` 
python client_wallet.py
``` 

## 🧩 Endpoints da API

| **Método** | **Endpoint** | **Descrição** |
|:-----------:|:-------------|:--------------|
| `POST` | `/new_user` | Cria um novo usuário com `user_id`, `kyc_level`, e `status`. |
| `POST` | `/new_device` | Registra um dispositivo vinculado a um usuário. |
| `POST` | `/create_account` | Cria uma conta (carteira) vinculada ao usuário. |
| `POST` | `/tokens/issue` | Emite *n* tokens assinados pelo servidor. |
| `POST` | `/redeem` | Realiza o resgate com verificação completa da assinatura. |
| `POST` | `/redeem2` | Resgate simplificado — apenas verifica existência do token. |
| `GET`  | `/_debug/token/<token_id>` | Retorna o estado atual do token no servidor. |

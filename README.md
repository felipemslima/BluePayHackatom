# BluePay — Offline Digital Payments

> Proof of concept built in 48 h at **Hackatom 2025**: digital "banknotes" that can change hands **without an internet connection** and are settled later, with double-spend protection on the server.

<!-- TODO: add a screenshot or GIF of the app here -->

## The problem

Digital payments stop working when the network does: rural areas, transit, outages, crowded events. Cash works offline, but it is not digital. BluePay explores a middle ground: **signed digital tokens** that behave like cash between two phones and get reconciled with the bank once anyone goes back online.

## How it works

```
 ┌────────────┐  1. issue (online)   ┌──────────────────────┐
 │  Wallet A  │ ◄─────────────────── │   Wallet service     │
 │  (SQLite)  │   Ed25519-signed     │   Flask + PostgreSQL │
 └─────┬──────┘   tokens             └──────────▲───────────┘
       │ 2. transfer P2P (offline)              │
       │    token encrypted for B               │ 3. redeem (online)
       ▼                                        │    verify signature,
 ┌────────────┐                                 │    reject double spend,
 │  Wallet B  │ ────────────────────────────────┘    post to ledger
 └────────────┘
```

1. **Issue** — the server mints tokens with a fixed denomination and signs a canonical payload with its **Ed25519** key.
   ```json
   { "token_id": "90b2cfc6-…", "denom_cents": 100,
     "issued_at": "2025-10-05T12:30:45Z", "issuer_pubkey": "tIv5wPAm…" }
   ```
2. **Transfer offline** — wallet A encrypts the token for wallet B (NaCl `SecretBox`). Wallet B **verifies the issuer signature locally**, so it does not need to call the server to trust the token.
3. **Redeem** — when B is online, the server checks the signature and the token state (`ISSUED → REDEEMED`). An idempotency key per request and a unique constraint per token **block double spending**. The credit is then posted to a **double-entry ledger**.

## Highlights

- **Ed25519 signatures** (PyNaCl) over a canonical JSON payload
- PostgreSQL schema with token lifecycle (`ISSUED / REDEEMED / REVOKED / EXPIRED`), device registry with attested public keys, idempotent redemptions and `ledger_entries` (debit/credit)
- Dockerized backend (`docker compose up`)
- End-to-end simulation script that runs the full issue → transfer → redeem flow between two wallets
- Mobile UI prototype in React + Tailwind, packaged for Android with **Capacitor**

## Stack

`Python` · `Flask` · `PostgreSQL` · `PyNaCl (Ed25519)` · `SQLite` · `Docker` · `React` · `Vite` · `Tailwind` · `Capacitor`

## Repository layout

```
server/
├── docker-compose.yml        # PostgreSQL + wallet service
├── init/01_schema.sql        # tokens, redemptions, double-entry ledger
└── wallet_service/           # Flask API, key generation, token issuing
simular/
└── client_wallet.py          # two-wallet simulation of the full flow
aplicativo/                   # React mobile UI → Android via Capacitor
```

## Running

```bash
# 1. config: copy the example and generate the server's signing keys
cp server/wallet_service/.env.example server/wallet_service/.env
pip install pynacl
python server/wallet_service/gen_keys.py >> server/wallet_service/.env

# 2. start PostgreSQL + API (http://localhost:5000)
cd server && docker compose up --build

# 3. in another terminal: simulate two people exchanging a token
export SERVER_PK_B64=<same public key as in .env>
python simular/client_wallet.py
```

The Android UI prototype can be installed from the [Releases page](https://github.com/felipemslima/BluePayHackatom/releases).

### API

| Method | Endpoint | Description |
|:--:|---|---|
| `POST` | `/new_user` | Create a user (`kyc_level`, `status`) |
| `POST` | `/new_device` | Register a device and its public key |
| `POST` | `/create_account` | Create a wallet account for a user |
| `POST` | `/tokens/issue` | Mint *n* signed tokens |
| `POST` | `/redeem` | Redeem with full signature + state verification |
| `GET`  | `/tokens/<user_id>` | List a user's tokens |

## Status and limitations

This is a hackathon PoC, not production code:

- The mobile app is a **UI prototype**. It is not yet wired to the backend or the P2P transfer.
- The P2P channel is simulated in the script; a real version would use NFC/Bluetooth/QR.
- Offline double spending can only be **detected at redemption**, not prevented. A real system needs hardware-backed keys on the device and spending limits.

## Team

Built at Hackatom 2025 by Felipe Martins Silveira Lima (backend, database, app) and Rennan Santos Nascimento (token signing).

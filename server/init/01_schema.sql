-- 1. Tipos auxiliares
CREATE TYPE token_state AS ENUM ('ISSUED','REDEEMED','REVOKED','EXPIRED');
CREATE TYPE entry_side  AS ENUM ('DEBIT','CREDIT');

-- 2. Identidade
CREATE TABLE users (
  user_id         UUID PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  kyc_level       TEXT NOT NULL,              -- ex.: "basic", "enhanced"
  status          TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE devices (
  device_id       UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(user_id),
  attested_pubkey BYTEA NOT NULL,             -- chave pública do dispositivo (Ed25519), DER/RAW
  cert_fingerprint BYTEA NOT NULL,            -- SHA-256 do cert emitido pela CA interna
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'active',
  UNIQUE (cert_fingerprint)
);

-- 3. Carteiras/contas para razão em partidas dobradas
CREATE TABLE accounts (
  account_id      UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(user_id),
  kind            TEXT NOT NULL,              -- 'USER_WALLET', 'ISSUANCE_RESERVE', 'FEE', etc.
  currency        TEXT NOT NULL DEFAULT 'BRL',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tokens emitidos (cédulas digitais)
CREATE TABLE tokens (
  token_id        UUID PRIMARY KEY,           -- ID único do token
  denom_cents     BIGINT NOT NULL CHECK (denom_cents > 0),
  issuer_pubkey   BYTEA NOT NULL,             -- pubkey do emissor (server) para auditoria
  issued_at       TIMESTAMPTZ NOT NULL,
  exp_at          TIMESTAMPTZ,                -- opcional
  state           token_state NOT NULL DEFAULT 'ISSUED',
  -- O "owner_hint" é opcional (privacidade). Não é canônico; titularidade muda no cliente.
  owner_hint      UUID,                        -- último recebedor conhecido (será confirmado no resgate)
  -- Prova criptográfica do emissor (blind/normal signature armazenada no payload do cliente)
  -- No servidor guardamos o hash do payload para verificação rápida:
  payload_sha256  BYTEA NOT NULL
);

-- 5. Solicitações de redenção (resgate) - previne duplo gasto via unicidade por token
CREATE TABLE redemptions (
  redemption_id   UUID PRIMARY KEY,
  requester_user  UUID NOT NULL REFERENCES users(user_id),
  requester_device UUID NOT NULL REFERENCES devices(device_id),
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'PENDING',  -- 'PENDING','APPLIED','REJECTED'
  idempotency_key BYTEA NOT NULL,                   -- sha-256 de chave idempotente do cliente
  UNIQUE (idempotency_key)
);

CREATE TABLE redemption_items (
  redemption_id   UUID NOT NULL REFERENCES redemptions(redemption_id) ON DELETE CASCADE,
  token_id        UUID NOT NULL REFERENCES tokens(token_id),
  PRIMARY KEY (redemption_id, token_id),
  -- garantia extra: um token só aparece em uma redenção bem-sucedida
  UNIQUE (token_id)
);

-- 6. Razão contábil (partidas dobradas)
CREATE TABLE ledger_entries (
  entry_id        BIGSERIAL PRIMARY KEY,
  tx_id           UUID NOT NULL,                 -- ID lógico da transação (redenção)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  account_id      UUID NOT NULL REFERENCES accounts(account_id),
  side            entry_side NOT NULL,           -- DEBIT/CREDIT
  amount_cents    BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency        TEXT NOT NULL,
  description     TEXT
);

-- 7. Índices e garantias
CREATE INDEX idx_tokens_state ON tokens(state);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_ledger_tx ON ledger_entries(tx_id);

-- 8. View de saldos
CREATE VIEW account_balances AS
SELECT
  account_id,
  currency,
  COALESCE(SUM(CASE WHEN side='CREDIT' THEN amount_cents ELSE -amount_cents END),0) AS balance_cents
FROM ledger_entries
GROUP BY account_id, currency;

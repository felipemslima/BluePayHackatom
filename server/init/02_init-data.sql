-- ========== MOCK USERS ==========
INSERT INTO users (user_id, kyc_level, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'basic', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'basic', 'active');

-- ========== MOCK DEVICES ==========
INSERT INTO devices (device_id, user_id, attested_pubkey, cert_fingerprint)
VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', decode('616161', 'hex'), decode('626262', 'hex')),
  ('bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', decode('636363', 'hex'), decode('646464', 'hex'));

-- ========== MOCK ACCOUNTS ==========
-- Emissor do sistema
INSERT INTO accounts (account_id, kind, currency)
VALUES ('99999999-9999-9999-9999-999999999999', 'ISSUANCE_RESERVE', 'BRL');

-- Carteiras dos usuários
INSERT INTO accounts (account_id, user_id, kind, currency)
VALUES
  ('aaaa1111-aaaa-1111-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'USER_WALLET', 'BRL'),
  ('bbbb2222-bbbb-2222-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', 'USER_WALLET', 'BRL');

-- ========== MOCK TOKENS ==========
INSERT INTO tokens (token_id, denom_cents, issuer_pubkey, issued_at, exp_at, state, payload_sha256)
VALUES
  ('10000000-0000-0000-0000-000000000001', 1, decode('746f6b656e31', 'hex'), now(), now() + interval '30 days', 'ISSUED', decode('6861736831', 'hex')),
  ('10000000-0000-0000-0000-000000000002', 1, decode('746f6b656e32', 'hex'), now(), now() + interval '30 days', 'ISSUED', decode('6861736832', 'hex')),
  ('10000000-0000-0000-0000-000000000003', 1, decode('746f6b656e33', 'hex'), now(), now() + interval '30 days', 'ISSUED', decode('6861736833', 'hex'));

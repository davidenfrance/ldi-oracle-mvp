# ldi-oracle-mvp

LDI Oracle MVP on Vercel. Same pattern as `lde-discovery-index-mvp`.

An interrogating agent asks:

1. Who is the Recorded Controller (beneficial owner) of this Authenticating Device?
2. Is identity cover in force, and can cover be purchased?

This host does **not** bind cover. A response is not a policy.

## Env

- `DATABASE_URL` Neon / Vercel Postgres
- `ORACLE_PRIVATE_KEY_PEM` Ed25519 PKCS8
- `ORACLE_PUBLIC_KEY_HEX` 32-byte hex (burned into the wallet with the locator)
- `ORACLE_ID` default `ldi-oracle-mvp`

## API

- `GET /api/v1/health`
- `GET /api/v1/oracle-identity`
- `GET /api/v1/cover?device_id=` or `?agent_id=`
- `POST /api/v1/cover` signed publish
- `POST /api/v1/cover/{id}/revoke` signed revoke

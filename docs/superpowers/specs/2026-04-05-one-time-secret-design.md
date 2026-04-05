# One-Time Secret Sharing Tool — Design Spec

## Overview

A serverless tool that lets users share secrets via one-time links. Text is encrypted client-side with a random password, stored in DynamoDB, and can only be viewed once. After first view, the secret self-destructs within 5 minutes. Decryption happens entirely in the browser — the server never sees plaintext or the password after creation.

## Architecture

Single AWS Lambda function behind a Lambda Function URL, backed by a DynamoDB table. No API Gateway, no VPC.

### Endpoints

**POST /** — Create a secret
- Input: `{ "text": "secret content" }`
- Generates a random password (8-14 characters, alphanumeric + symbols from `!@#$%^&*`)
- Generates a random key (UUID)
- Encrypts text server-side with AES-256-GCM using the password (Node.js `crypto` module):
  - Random salt → PBKDF2 → derived key
  - Random IV → AES-256-GCM encrypt
- Stores `{ pk, encryptedText, iv, salt, viewed, createdAt, ttl }` in DynamoDB (TTL = now + 2 days)
- Returns: `{ "url": "https://<function-url>/?key=<uuid>", "password": "<random-password>" }`

**GET /?key=\<key\>** — View a secret
- Looks up key in DynamoDB
- If not found or `ttl < now` → return themed "expired" HTML page
- If `viewed === false` → update `viewed = true` and `ttl = now + 300` (5 minutes), return viewer HTML
- If `viewed === true` → return viewer HTML (no TTL update — already set)
- Viewer HTML contains encrypted payload as data attributes; decryption happens in the browser

### Security Model

- Server stores only encrypted text — never plaintext after creation
- Password is returned once on POST, never stored
- On GET, password is never sent to server — entered directly in browser
- Decryption uses Web Crypto API (AES-256-GCM with PBKDF2 key derivation)
- Wrong password → AES-GCM authentication tag failure → "Invalid decryption key" message

## Data Model (DynamoDB)

**Table name:** `OneTimeSecrets`
**Billing:** PAY_PER_REQUEST

| Field | Type | Description |
|-------|------|-------------|
| `pk` | String (partition key) | Random UUID |
| `encryptedText` | String (base64) | AES-256-GCM ciphertext |
| `iv` | String (base64) | Initialization vector |
| `salt` | String (base64) | PBKDF2 salt |
| `viewed` | Boolean | Whether secret has been opened |
| `createdAt` | Number | Unix timestamp |
| `ttl` | Number | DynamoDB TTL attribute — `createdAt + 172800` (2 days) initially, updated to `now + 300` (5 min) on first view |

DynamoDB TTL deletes are eventually consistent (up to 48h lag). The Lambda checks `ttl < now` at read time and treats expired items as not found.

## Client-Side HTML Page

The GET endpoint returns an HTML page containing:

1. **Encrypted payload** — embedded as `data-` attributes (ciphertext, IV, salt)
2. **TTL timestamp** — embedded as `data-` attribute for countdown calculation
3. **Password input** — user enters the password received during creation
4. **Decrypt button** — triggers Web Crypto API decryption in browser
5. **Countdown timer** — shows time remaining, theme-appropriate self-destruct messaging
6. **Theme switcher** — toggle between 3 themes, preference saved to `localStorage`

### Browser Decryption Flow

1. User enters password
2. PBKDF2 derives AES-256 key from password + salt (100,000 iterations, SHA-256)
3. AES-256-GCM decrypts ciphertext using derived key + IV
4. Plaintext displayed on screen
5. Auth tag mismatch → "Invalid decryption key" error

### Themes

Three switchable themes. Default: **Retro**.

**Retro (default):** CRT scanlines, green-on-black (`#33ff33`), `Courier New` monospace, terminal cursor blink, typewriter animation. Messages: "INCOMING TRANSMISSION", "SELF-DESTRUCT COUNTDOWN", "PRESS ENTER TO DECODE".

**Tactical:** Dark navy background (`#1a1a2e`), monospace fonts, red/amber accents (`#ff4444`, `#ff6b35`), classified document aesthetic. Messages: "⚠ CLASSIFIED", "UNTIL DESTRUCTION", "THIS MESSAGE WILL SELF-DESTRUCT".

**Modern:** Gradient background (`#0f0f23` → `#1a1a3e`), system sans-serif, purple/blue accents (`#6366f1`, `#8b5cf6`), smooth card-based UI. Messages: "One-Time Secret", "This message will destruct itself in...".

When countdown reaches zero: disable decrypt button, show "DESTROYED" / "TRANSMISSION TERMINATED" / "Message expired".

## Error Handling

- Secret not found / expired → themed HTML page: "This transmission has expired or was already destroyed"
- Wrong password → inline browser message: "Invalid decryption key" (AES-GCM auth tag fails)
- Empty text on POST → `400 { "error": "text is required" }`
- DynamoDB errors → `500 { "error": "Internal server error" }`
- Countdown reaches zero while page open → disable decrypt, show destruction message

## Project Structure

```
one-time-password/
├── README.md
├── package.json
├── tsconfig.json
├── cdk.json
├── bin/
│   └── app.ts                    # CDK app entry point
├── lib/
│   └── stack.ts                  # CDK stack (DynamoDB + Lambda + Function URL)
├── lambda/
│   ├── index.ts                  # Lambda handler (POST + GET routing)
│   ├── crypto.ts                 # Encryption helpers
│   ├── db.ts                     # DynamoDB read/write operations
│   └── html/
│       ├── viewer.ts             # HTML page generator
│       ├── themes/
│       │   ├── retro.ts          # CRT/green terminal theme (default)
│       │   ├── tactical.ts       # Military/classified theme
│       │   └── modern.ts         # Clean dark theme
│       └── expired.ts            # "Secret expired" page
├── local/
│   └── server.ts                 # Express wrapper for local dev
├── test/
│   ├── handler.test.ts           # Lambda handler unit tests
│   ├── crypto.test.ts            # Encryption round-trip tests
│   └── stack.test.ts             # CDK snapshot/synth tests
└── .gitignore
```

## CDK Infrastructure

**Stack:** `OneTimeSecretStack`

Resources:
- **DynamoDB Table** — `OneTimeSecrets`, PAY_PER_REQUEST, TTL enabled on `ttl` field, `RemovalPolicy.DESTROY`
- **Lambda Function** — Node.js 20.x, bundled with esbuild, environment variable `TABLE_NAME` pointing to the table
- **Lambda Function URL** — auth type `NONE` (public)
- Lambda gets read/write permissions on the DynamoDB table

CloudFormation manages the full lifecycle. `cdk deploy` creates everything, `cdk destroy` removes everything cleanly.

## Local Development

`npm run local` starts an Express server on `localhost:3000` that:
- Wraps the same Lambda handler logic
- Uses an in-memory `Map` instead of DynamoDB (with TTL simulation via `setTimeout`)
- Supports both POST and GET endpoints
- Enables fast iteration without AWS credentials

## Testing

`npm test` runs Jest:
- **handler.test.ts** — Lambda handler: POST creates secret, GET returns viewer, GET with expired key returns expired page, GET with viewed key doesn't update TTL again, POST with empty text returns 400
- **crypto.test.ts** — Encrypt/decrypt round-trip, wrong password fails, various text lengths
- **stack.test.ts** — CDK stack synthesizes, snapshot test

## Deployment

```bash
# Deploy to playground
AWS_PROFILE=playground npx cdk deploy

# Destroy all resources
AWS_PROFILE=playground npx cdk destroy
```

## Public Repo Safety

This repo is public. No AWS account IDs, secrets, or credentials in code. CDK uses runtime lookups. `.gitignore` excludes `cdk.out/`, `node_modules/`, `.env`, and `cdk.context.json`.

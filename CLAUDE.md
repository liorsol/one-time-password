# One-Time Secret Sharing Tool

Serverless one-time secret sharing via self-destructing links. AES-256-GCM encryption with client-side decryption in the browser.

## Commands

```bash
npm test              # Run all tests (Jest)
npm run local         # Start local Express server on :3000
npm run build         # TypeScript compile
npx cdk synth         # Synthesize CloudFormation template
npx cdk deploy        # Deploy (needs AWS credentials)
npx cdk destroy       # Tear down all resources
```

Deploy/destroy use `AWS_PROFILE=playground` for the playground account.

## Architecture

Single Lambda Function URL + DynamoDB table. No API Gateway, no VPC.

- **POST /** — Generates random password (8-14 chars), encrypts text server-side with AES-256-GCM (PBKDF2 key derivation, 100k iterations, SHA-256), stores ciphertext in DynamoDB (2-day TTL), returns `{ url, password }`
- **GET /?key=<id>** — Looks up secret, returns HTML page with encrypted payload as data attributes. First view sets `viewed=true` and shortens TTL to 5 minutes. Subsequent views within that window don't update TTL again.

The server never stores plaintext or the password. Decryption happens entirely in the browser via Web Crypto API.

## Code Layout

```
lambda/index.ts          # Lambda handler — POST/GET routing
lambda/crypto.ts         # AES-256-GCM encrypt/decrypt, password generator
lambda/db.ts             # DynamoDB operations (putSecret, getSecret, markViewed)
lambda/html/viewer.ts    # HTML page generator with all 3 themes + decryption JS
lambda/html/expired.ts   # Expired/not-found page
lambda/html/themes/      # retro.ts (default), tactical.ts, modern.ts
lib/stack.ts             # CDK stack (DynamoDB + Lambda + Function URL)
bin/app.ts               # CDK app entry point
local/server.ts          # Express dev server with in-memory Map store
test/                    # Jest tests (crypto, handler, CDK stack)
```

## Key Patterns

- **Encryption format**: ciphertext + 16-byte GCM auth tag concatenated, then base64 encoded. This format is consumed directly by both Node.js `crypto` (server) and Web Crypto API (browser).
- **TTL logic**: DynamoDB TTL deletes are eventually consistent (up to 48h lag). The Lambda checks `ttl < now` at read time and treats expired items as not found.
- **Theme system**: Three themes (retro/tactical/modern) with CSS scoped via `body.theme-<name>`. Theme preference stored in `localStorage`. Retro is the default.
- **Handler tests**: Mock `lambda/db` module, real crypto. Use `jest.clearAllMocks()` in beforeEach.
- **CDK tests**: Use `Template.fromStack` assertions. `Match.anyValue()` for CDK-generated refs (not Jest's `expect.anything()`).

## Gotchas

- `uuid` package is ESM — Jest config has `transformIgnorePatterns` to handle it
- Public repo — never commit AWS account IDs, secrets, or credentials
- Local server uses in-memory Map with setTimeout for TTL simulation — not a real DynamoDB substitute

# One-Time Secret

A serverless tool for sharing secrets via self-destructing links. Text is encrypted with AES-256-GCM — decryption happens entirely in your browser.

## How It Works

1. **Create:** POST text to the endpoint. Get back a URL and a password.
2. **Share:** Send the URL and password to the recipient (via separate channels for security).
3. **View:** Recipient opens the URL, enters the password. The secret is decrypted in the browser.
4. **Self-destruct:** After first view, the secret is deleted in 5 minutes. Unviewed secrets expire after 2 days.

The server never stores plaintext — only AES-256-GCM encrypted ciphertext. The password is generated once and never stored.

## Quick Start (Local)

```bash
npm install
npm run local
```

Create a secret:
```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"text":"my secret message"}'
```

Open the returned URL in your browser and enter the password.

## Deploy

Requires AWS CDK and an AWS account.

```bash
npm install
npx cdk bootstrap   # first time only
npx cdk deploy
```

The function URL is printed as a CloudFormation output.

### Destroy

```bash
npx cdk destroy
```

Removes all resources (Lambda, DynamoDB table, Function URL).

## Themes

Three built-in themes, switchable via dropdown:

- **Retro** (default) — CRT terminal, green-on-black, scanlines
- **Tactical** — classified document, red/amber accents
- **Modern** — clean dark gradient, purple/blue

Theme preference is saved to `localStorage`.

## Testing

```bash
npm test
```

## Tech Stack

- TypeScript
- AWS Lambda (Node.js 20.x) + Function URL
- DynamoDB (with TTL)
- AWS CDK
- AES-256-GCM encryption (Node.js `crypto` + Web Crypto API)

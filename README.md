# One-Time Secret

A tool for sharing secrets via self-destructing links. Text is encrypted with AES-256-GCM — decryption happens entirely in your browser.

Two deployment options:
- **AWS Lambda + DynamoDB** — serverless, auto-scaling
- **Google Apps Script + Google Sheets** — free, no AWS account needed

## How It Works

1. **Create:** Enter text (or POST it via API). Get back a URL and a password.
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

## Deploy to AWS

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

## Deploy to Google Apps Script

Requires Node.js 22+, a Google account, and [clasp](https://github.com/google/clasp).

### One-Command Setup

```bash
npm install -g @google/clasp
clasp login                    # one-time: opens browser for Google auth
cd gas && npm run setup
```

This single command will:
1. Create a new Apps Script project
2. Build and push the code
3. Deploy as a web app
4. Print the web app URL

On first visit, the app automatically creates a Google Sheet for storing secrets — no manual spreadsheet setup needed.

**Prerequisites:** Enable the Apps Script API at https://script.google.com/home/usersettings before first run.

An hourly cleanup trigger for expired secrets is also created automatically on first visit.

### GAS Commands

```bash
cd gas
npm run build     # Bundle TypeScript → gas/dist/Code.js
npm run push      # Build + push to Apps Script
npm run deploy    # Build + deploy new version
npm run open      # Open web app in browser
npm run logs      # View Stackdriver logs
```

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

Runs all tests: shared code, Lambda handler, CDK stack, GAS code (with mocked globals), and sanity integration test.

## Tech Stack

- TypeScript
- AWS Lambda (Node.js 22.x) + Function URL + DynamoDB (with TTL)
- Google Apps Script + Google Sheets
- AWS CDK
- AES-256-GCM encryption (Node.js `crypto` + Web Crypto API)
- clasp + esbuild (GAS build toolchain)

# One-Time Secret Sharing Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a serverless one-time secret sharing tool — Lambda + DynamoDB + browser-side AES-256-GCM decryption with 3 switchable themes.

**Architecture:** Single Lambda behind a Function URL. POST encrypts text with a random password, stores ciphertext in DynamoDB (2-day TTL). GET returns an HTML page with the encrypted payload; first view shortens TTL to 5 minutes. Decryption happens entirely in the browser via Web Crypto API.

**Tech Stack:** TypeScript, AWS CDK, Lambda (Node.js 20.x), DynamoDB, Jest, Express (local dev)

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `cdk.json`
- Create: `jest.config.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize package.json**

```bash
cd /Users/liors/dev/one-time-password
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install aws-cdk-lib constructs @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb uuid
npm install -D typescript @types/node @types/uuid jest ts-jest @types/jest ts-node aws-cdk esbuild express @types/express
```

- [ ] **Step 3: Create tsconfig.json**

Write to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "cdk.out"]
}
```

- [ ] **Step 4: Create cdk.json**

Write to `cdk.json`:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": ["node_modules", "cdk.out", "dist", "**/*.js", "**/*.d.ts"]
  }
}
```

- [ ] **Step 5: Create jest.config.ts**

Write to `jest.config.ts`:

```typescript
import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

export default config;
```

- [ ] **Step 6: Update .gitignore**

Replace `.gitignore` with:

```
node_modules/
dist/
cdk.out/
cdk.context.json
.env
*.js
*.d.ts
*.js.map
!jest.config.ts
.superpowers/
```

- [ ] **Step 7: Add npm scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "cdk": "cdk",
    "local": "ts-node local/server.ts"
  }
}
```

- [ ] **Step 8: Create directory structure**

```bash
mkdir -p bin lib lambda/html/themes local test
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold project with CDK, Jest, and TypeScript config"
```

---

### Task 2: Crypto Module

**Files:**
- Create: `lambda/crypto.ts`
- Create: `test/crypto.test.ts`

- [ ] **Step 1: Write the failing test**

Write to `test/crypto.test.ts`:

```typescript
import { encrypt, decrypt, generatePassword } from "../lambda/crypto";

describe("generatePassword", () => {
  it("returns a password between 8 and 14 characters", () => {
    for (let i = 0; i < 100; i++) {
      const pw = generatePassword();
      expect(pw.length).toBeGreaterThanOrEqual(8);
      expect(pw.length).toBeLessThanOrEqual(14);
    }
  });

  it("uses only allowed characters", () => {
    const allowed = /^[A-Za-z0-9!@#$%^&*]+$/;
    for (let i = 0; i < 100; i++) {
      expect(generatePassword()).toMatch(allowed);
    }
  });
});

describe("encrypt / decrypt", () => {
  it("round-trips a simple string", () => {
    const password = "testpass123";
    const plaintext = "hello world";
    const { encryptedText, iv, salt } = encrypt(plaintext, password);
    const result = decrypt(encryptedText, iv, salt, password);
    expect(result).toBe(plaintext);
  });

  it("round-trips unicode text", () => {
    const password = "p@ss!";
    const plaintext = "こんにちは 🌍 émojis & symbols™";
    const { encryptedText, iv, salt } = encrypt(plaintext, password);
    const result = decrypt(encryptedText, iv, salt, password);
    expect(result).toBe(plaintext);
  });

  it("round-trips a large string", () => {
    const password = "bigpassword";
    const plaintext = "A".repeat(10000);
    const { encryptedText, iv, salt } = encrypt(plaintext, password);
    const result = decrypt(encryptedText, iv, salt, password);
    expect(result).toBe(plaintext);
  });

  it("fails with wrong password", () => {
    const { encryptedText, iv, salt } = encrypt("secret", "correct");
    expect(() => decrypt(encryptedText, iv, salt, "wrong")).toThrow();
  });

  it("returns base64 strings", () => {
    const base64 = /^[A-Za-z0-9+/]+=*$/;
    const { encryptedText, iv, salt } = encrypt("test", "pass");
    expect(encryptedText).toMatch(base64);
    expect(iv).toMatch(base64);
    expect(salt).toMatch(base64);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest test/crypto.test.ts --verbose
```

Expected: FAIL — cannot find module `../lambda/crypto`

- [ ] **Step 3: Write the implementation**

Write to `lambda/crypto.ts`:

```typescript
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const DIGEST = "sha256";

const PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export function generatePassword(): string {
  const length = crypto.randomInt(8, 15); // 8-14 inclusive
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  }
  return password;
}

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
}

export interface EncryptResult {
  encryptedText: string; // base64
  iv: string;            // base64
  salt: string;          // base64
}

export function encrypt(plaintext: string, password: string): EncryptResult {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(password, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedText: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
  };
}

export function decrypt(
  encryptedText: string,
  iv: string,
  salt: string,
  password: string
): string {
  const encryptedBuffer = Buffer.from(encryptedText, "base64");
  const authTag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
  const ciphertext = encryptedBuffer.subarray(0, encryptedBuffer.length - 16);

  const key = deriveKey(password, Buffer.from(salt, "base64"));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest test/crypto.test.ts --verbose
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lambda/crypto.ts test/crypto.test.ts
git commit -m "feat: add crypto module with AES-256-GCM encrypt/decrypt and password generator"
```

---

### Task 3: DynamoDB Access Module

**Files:**
- Create: `lambda/db.ts`

- [ ] **Step 1: Write the module**

Write to `lambda/db.ts`:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export interface SecretRecord {
  pk: string;
  encryptedText: string;
  iv: string;
  salt: string;
  viewed: boolean;
  createdAt: number;
  ttl: number;
}

export async function putSecret(record: SecretRecord): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    })
  );
}

export async function getSecret(pk: string): Promise<SecretRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk },
    })
  );
  if (!result.Item) return null;
  const record = result.Item as SecretRecord;
  // Check if expired (DynamoDB TTL deletes are eventually consistent)
  if (record.ttl < Math.floor(Date.now() / 1000)) return null;
  return record;
}

export async function markViewed(pk: string, newTtl: number): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk },
      UpdateExpression: "SET viewed = :v, #t = :ttl",
      ExpressionAttributeNames: { "#t": "ttl" },
      ExpressionAttributeValues: { ":v": true, ":ttl": newTtl },
    })
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add lambda/db.ts
git commit -m "feat: add DynamoDB access module for secret storage"
```

---

### Task 4: HTML Themes

**Files:**
- Create: `lambda/html/themes/retro.ts`
- Create: `lambda/html/themes/tactical.ts`
- Create: `lambda/html/themes/modern.ts`

- [ ] **Step 1: Write the retro theme (default)**

Write to `lambda/html/themes/retro.ts`:

```typescript
export const retroTheme = {
  name: "retro",
  label: "RETRO",
  css: `
    body {
      background: #0a0a0a;
      color: #33ff33;
      font-family: 'Courier New', monospace;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px
      );
      pointer-events: none;
      z-index: 1000;
    }
    .container {
      max-width: 500px;
      width: 90%;
      padding: 40px 30px;
      text-align: center;
    }
    .header-border { color: #1a8a1a; font-size: 12px; }
    .title {
      font-size: 18px;
      text-shadow: 0 0 10px #33ff33;
      margin: 8px 0;
      letter-spacing: 2px;
    }
    .timer {
      font-size: 48px;
      text-shadow: 0 0 20px #33ff33;
      letter-spacing: 6px;
      margin: 24px 0;
    }
    .timer-label {
      font-size: 11px;
      color: #1a8a1a;
      letter-spacing: 3px;
    }
    .input-label {
      font-size: 11px;
      color: #1a8a1a;
      letter-spacing: 2px;
      text-align: left;
      margin-bottom: 6px;
    }
    input[type="password"] {
      width: 100%;
      box-sizing: border-box;
      background: rgba(0,255,0,0.05);
      border: 1px solid #1a8a1a;
      color: #33ff33;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      padding: 10px 14px;
      outline: none;
    }
    input[type="password"]:focus { border-color: #33ff33; }
    .btn {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      background: transparent;
      border: 1px solid #1a8a1a;
      color: #33ff33;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 3px;
      cursor: pointer;
      text-transform: uppercase;
    }
    .btn:hover { background: rgba(0,255,0,0.1); border-color: #33ff33; }
    .btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .error { color: #ff3333; margin-top: 12px; font-size: 12px; }
    .decrypted-text {
      background: rgba(0,255,0,0.05);
      border: 1px solid #1a8a1a;
      padding: 20px;
      margin-top: 20px;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
    }
    .destroyed { color: #ff3333; text-shadow: 0 0 10px #ff3333; }
    .theme-switcher {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 1001;
    }
    .theme-switcher select {
      background: #0a0a0a;
      color: #1a8a1a;
      border: 1px solid #1a8a1a;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 4px 8px;
      cursor: pointer;
    }
  `,
  headerBorder: "╔══════════════════════════════╗",
  footerBorder: "╚══════════════════════════════╝",
  titleText: "INCOMING TRANSMISSION",
  timerLabel: "SELF-DESTRUCT COUNTDOWN",
  inputLabel: "> ENTER PASSKEY_",
  buttonText: "[ DECODE ]",
  destroyedText: "TRANSMISSION TERMINATED",
  expiredTitle: "NO SIGNAL",
  expiredMessage: "This transmission has expired or was already destroyed.",
};
```

- [ ] **Step 2: Write the tactical theme**

Write to `lambda/html/themes/tactical.ts`:

```typescript
export const tacticalTheme = {
  name: "tactical",
  label: "TACTICAL",
  css: `
    body {
      background: #1a1a2e;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 500px;
      width: 90%;
      padding: 40px 30px;
      text-align: center;
    }
    .header-border {
      display: inline-block;
      color: #ff4444;
      font-size: 11px;
      letter-spacing: 4px;
      text-transform: uppercase;
      border: 1px solid #ff4444;
      padding: 4px 16px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 14px;
      color: #888;
      letter-spacing: 3px;
      margin: 12px 0;
    }
    .timer {
      font-size: 48px;
      color: #ff6b35;
      font-weight: bold;
      letter-spacing: 4px;
      margin: 24px 0 4px;
    }
    .timer-label {
      font-size: 11px;
      color: #888;
      letter-spacing: 3px;
    }
    .input-section {
      background: #0d0d1a;
      border: 1px solid #333;
      border-radius: 4px;
      padding: 16px;
      margin-top: 24px;
    }
    .input-label {
      font-size: 10px;
      color: #ff4444;
      letter-spacing: 2px;
      text-align: left;
      margin-bottom: 8px;
    }
    input[type="password"] {
      width: 100%;
      box-sizing: border-box;
      background: #111;
      border: 1px solid #444;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      padding: 10px 14px;
      border-radius: 2px;
      outline: none;
    }
    input[type="password"]:focus { border-color: #ff6b35; }
    .btn {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      background: #ff4444;
      border: none;
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 2px;
      cursor: pointer;
      text-transform: uppercase;
      border-radius: 2px;
    }
    .btn:hover { background: #ff6b35; }
    .btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .error { color: #ff4444; margin-top: 12px; font-size: 12px; }
    .decrypted-text {
      background: #0d0d1a;
      border: 1px solid #333;
      padding: 20px;
      margin-top: 20px;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      border-radius: 4px;
    }
    .destroyed { color: #ff4444; }
    .theme-switcher {
      position: fixed;
      top: 12px;
      right: 12px;
    }
    .theme-switcher select {
      background: #1a1a2e;
      color: #888;
      border: 1px solid #333;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 4px 8px;
      cursor: pointer;
    }
  `,
  headerBorder: "⚠ CLASSIFIED",
  footerBorder: "",
  titleText: "THIS MESSAGE WILL SELF-DESTRUCT",
  timerLabel: "UNTIL DESTRUCTION",
  inputLabel: "ENTER DECRYPTION KEY",
  buttonText: "DECRYPT",
  destroyedText: "DESTROYED",
  expiredTitle: "ACCESS DENIED",
  expiredMessage: "This transmission has expired or was already destroyed.",
};
```

- [ ] **Step 3: Write the modern theme**

Write to `lambda/html/themes/modern.ts`:

```typescript
export const modernTheme = {
  name: "modern",
  label: "MODERN",
  css: `
    body {
      background: linear-gradient(135deg, #0f0f23, #1a1a3e);
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 460px;
      width: 90%;
      padding: 40px 30px;
      text-align: center;
    }
    .header-border {
      font-size: 14px;
      color: #8888ff;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .title {
      font-size: 13px;
      color: #666;
      margin: 8px 0 20px;
    }
    .timer {
      display: inline-flex;
      gap: 10px;
      margin: 20px 0;
    }
    .timer-block {
      background: rgba(100,100,255,0.12);
      border-radius: 10px;
      padding: 12px 18px;
      text-align: center;
    }
    .timer-block .digits {
      font-size: 32px;
      font-weight: 300;
      color: #aaf;
    }
    .timer-block .unit {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }
    .timer-separator {
      font-size: 28px;
      color: #444;
      padding-top: 10px;
    }
    .timer-label { display: none; }
    .input-label {
      font-size: 13px;
      color: #888;
      text-align: left;
      margin-bottom: 8px;
    }
    input[type="password"] {
      width: 100%;
      box-sizing: border-box;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #e0e0e0;
      font-size: 15px;
      padding: 12px 16px;
      border-radius: 10px;
      outline: none;
      font-family: inherit;
    }
    input[type="password"]:focus {
      border-color: rgba(99,102,241,0.5);
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    }
    .btn {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 14px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border: none;
      color: white;
      font-size: 15px;
      font-family: inherit;
      cursor: pointer;
      border-radius: 10px;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .error { color: #f87171; margin-top: 12px; font-size: 13px; }
    .decrypted-text {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 20px;
      margin-top: 20px;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      border-radius: 10px;
    }
    .destroyed { color: #f87171; }
    .theme-switcher {
      position: fixed;
      top: 12px;
      right: 12px;
    }
    .theme-switcher select {
      background: rgba(255,255,255,0.05);
      color: #888;
      border: 1px solid rgba(255,255,255,0.1);
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
    }
  `,
  headerBorder: "One-Time Secret",
  footerBorder: "",
  titleText: "This message will destruct itself in",
  timerLabel: "",
  inputLabel: "Enter password to decrypt",
  buttonText: "Decrypt Message",
  destroyedText: "Message expired",
  expiredTitle: "Link Expired",
  expiredMessage: "This secret has expired or was already viewed.",
};
```

- [ ] **Step 4: Commit**

```bash
git add lambda/html/themes/retro.ts lambda/html/themes/tactical.ts lambda/html/themes/modern.ts
git commit -m "feat: add retro, tactical, and modern themes for viewer page"
```

---

### Task 5: HTML Page Generators

**Files:**
- Create: `lambda/html/viewer.ts`
- Create: `lambda/html/expired.ts`

- [ ] **Step 1: Write the viewer page generator**

Write to `lambda/html/viewer.ts`:

```typescript
import { retroTheme } from "./themes/retro";
import { tacticalTheme } from "./themes/tactical";
import { modernTheme } from "./themes/modern";

const themes = [retroTheme, tacticalTheme, modernTheme];

interface ViewerParams {
  encryptedText: string;
  iv: string;
  salt: string;
  ttl: number;
}

export function renderViewer(params: ViewerParams): string {
  const themeCssMap = themes
    .map(
      (t) => `
    body.theme-${t.name} { }
    body.theme-${t.name} { ${t.css.replace(/body\s*\{/g, "&{")} }
  `
    )
    // Actually, embed each theme's CSS scoped under body.theme-<name>
    // Simpler: embed all CSS and swap via body class
    .join("\n");

  // Build theme CSS where each theme's body styles are scoped
  const allCss = themes
    .map((t) => t.css.replace(/body\b/g, `body.theme-${t.name}`))
    .join("\n");

  const themeOptions = themes
    .map((t) => `<option value="${t.name}">${t.label}</option>`)
    .join("");

  const themeDataJson = JSON.stringify(
    Object.fromEntries(
      themes.map((t) => [
        t.name,
        {
          headerBorder: t.headerBorder,
          footerBorder: t.footerBorder,
          titleText: t.titleText,
          timerLabel: t.timerLabel,
          inputLabel: t.inputLabel,
          buttonText: t.buttonText,
          destroyedText: t.destroyedText,
        },
      ])
    )
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One-Time Secret</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    ${allCss}
  </style>
</head>
<body class="theme-retro"
  data-encrypted="${escapeAttr(params.encryptedText)}"
  data-iv="${escapeAttr(params.iv)}"
  data-salt="${escapeAttr(params.salt)}"
  data-ttl="${params.ttl}">

  <div class="theme-switcher">
    <select id="themeSwitcher" onchange="switchTheme(this.value)">
      ${themeOptions}
    </select>
  </div>

  <div class="container">
    <div class="header-border" id="headerBorder"></div>
    <div class="title" id="titleText"></div>
    <div class="timer" id="timer"></div>
    <div class="timer-label" id="timerLabel"></div>

    <div class="input-section" id="inputSection">
      <div class="input-label" id="inputLabel"></div>
      <input type="password" id="passwordInput" placeholder="Enter password..." autocomplete="off">
      <button class="btn" id="decryptBtn" onclick="decryptSecret()"></button>
    </div>

    <div class="error" id="error" style="display:none"></div>
    <div class="decrypted-text" id="decryptedText" style="display:none"></div>
  </div>

  <script>
    const THEMES = ${themeDataJson};
    let currentTheme = localStorage.getItem('otp-theme') || 'retro';
    let timerInterval;
    let isDestroyed = false;

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    function switchTheme(name) {
      currentTheme = name;
      localStorage.setItem('otp-theme', name);
      document.body.className = 'theme-' + name;
      document.getElementById('themeSwitcher').value = name;
      applyThemeText();
      updateTimerDisplay();
    }

    function applyThemeText() {
      const t = THEMES[currentTheme];
      document.getElementById('headerBorder').textContent = t.headerBorder;
      document.getElementById('titleText').textContent = t.titleText;
      document.getElementById('timerLabel').textContent = t.timerLabel;
      document.getElementById('inputLabel').textContent = t.inputLabel;
      document.getElementById('decryptBtn').textContent = t.buttonText;
    }

    function updateTimerDisplay() {
      const ttl = parseInt(document.body.dataset.ttl);
      const now = Math.floor(Date.now() / 1000);
      const remaining = ttl - now;

      if (remaining <= 0) {
        destroyMessage();
        return;
      }

      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      const pad = (n) => String(n).padStart(2, '0');
      const timerEl = document.getElementById('timer');

      if (currentTheme === 'modern') {
        timerEl.innerHTML =
          '<div class="timer-block"><div class="digits">' + pad(min) + '</div><div class="unit">MIN</div></div>' +
          '<div class="timer-separator">:</div>' +
          '<div class="timer-block"><div class="digits">' + pad(sec) + '</div><div class="unit">SEC</div></div>';
      } else {
        timerEl.textContent = pad(min) + ':' + pad(sec);
      }
    }

    function destroyMessage() {
      if (isDestroyed) return;
      isDestroyed = true;
      clearInterval(timerInterval);
      const t = THEMES[currentTheme];
      const timerEl = document.getElementById('timer');
      timerEl.innerHTML = '<span class="destroyed">' + escapeHtml(t.destroyedText) + '</span>';
      document.getElementById('timerLabel').textContent = '';
      document.getElementById('decryptBtn').disabled = true;
      document.getElementById('inputSection').style.opacity = '0.3';
    }

    async function decryptSecret() {
      const password = document.getElementById('passwordInput').value;
      if (!password) return;

      const errorEl = document.getElementById('error');
      const resultEl = document.getElementById('decryptedText');
      errorEl.style.display = 'none';
      resultEl.style.display = 'none';

      try {
        const encryptedB64 = document.body.dataset.encrypted;
        const ivB64 = document.body.dataset.iv;
        const saltB64 = document.body.dataset.salt;

        const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
        const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));

        // Separate ciphertext and auth tag (last 16 bytes)
        const ciphertext = encrypted.slice(0, encrypted.length - 16);
        const authTag = encrypted.slice(encrypted.length - 16);

        // Recombine as ciphertext + authTag for WebCrypto (it expects them concatenated)
        const combined = new Uint8Array(ciphertext.length + authTag.length);
        combined.set(ciphertext);
        combined.set(authTag, ciphertext.length);

        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(password),
          'PBKDF2',
          false,
          ['deriveKey']
        );

        const key = await crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
          keyMaterial,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          combined
        );

        const plaintext = new TextDecoder().decode(decrypted);
        resultEl.textContent = plaintext;
        resultEl.style.display = 'block';
        document.getElementById('inputSection').style.display = 'none';
      } catch (e) {
        errorEl.textContent = 'Invalid decryption key';
        errorEl.style.display = 'block';
      }
    }

    // Init
    switchTheme(currentTheme);
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);

    document.getElementById('passwordInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') decryptSecret();
    });
  </script>
</body>
</html>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
```

- [ ] **Step 2: Write the expired page generator**

Write to `lambda/html/expired.ts`:

```typescript
import { retroTheme } from "./themes/retro";
import { tacticalTheme } from "./themes/tactical";
import { modernTheme } from "./themes/modern";

const themes = [retroTheme, tacticalTheme, modernTheme];

export function renderExpired(): string {
  const allCss = themes
    .map((t) => t.css.replace(/body\b/g, `body.theme-${t.name}`))
    .join("\n");

  const themeOptions = themes
    .map((t) => `<option value="${t.name}">${t.label}</option>`)
    .join("");

  const themeDataJson = JSON.stringify(
    Object.fromEntries(
      themes.map((t) => [
        t.name,
        { expiredTitle: t.expiredTitle, expiredMessage: t.expiredMessage },
      ])
    )
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Secret Expired</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    ${allCss}
  </style>
</head>
<body class="theme-retro">
  <div class="theme-switcher">
    <select id="themeSwitcher" onchange="switchTheme(this.value)">
      ${themeOptions}
    </select>
  </div>
  <div class="container">
    <div class="title destroyed" id="expiredTitle"></div>
    <p style="margin-top:16px;opacity:0.7;" id="expiredMessage"></p>
  </div>
  <script>
    const THEMES = ${themeDataJson};
    let currentTheme = localStorage.getItem('otp-theme') || 'retro';
    function switchTheme(name) {
      currentTheme = name;
      localStorage.setItem('otp-theme', name);
      document.body.className = 'theme-' + name;
      document.getElementById('themeSwitcher').value = name;
      const t = THEMES[name];
      document.getElementById('expiredTitle').textContent = t.expiredTitle;
      document.getElementById('expiredMessage').textContent = t.expiredMessage;
    }
    switchTheme(currentTheme);
  </script>
</body>
</html>`;
}
```

- [ ] **Step 3: Commit**

```bash
git add lambda/html/viewer.ts lambda/html/expired.ts
git commit -m "feat: add HTML viewer and expired page generators with theme support"
```

---

### Task 6: Lambda Handler

**Files:**
- Create: `lambda/index.ts`
- Create: `test/handler.test.ts`

- [ ] **Step 1: Write the failing tests**

Write to `test/handler.test.ts`:

```typescript
import { handler } from "../lambda/index";
import * as db from "../lambda/db";
import * as cryptoModule from "../lambda/crypto";

jest.mock("../lambda/db");

const mockedDb = db as jest.Mocked<typeof db>;

function makeEvent(overrides: Record<string, any> = {}) {
  return {
    requestContext: {
      http: { method: overrides.method || "GET", path: "/" },
    },
    queryStringParameters: overrides.query || null,
    body: overrides.body || null,
    headers: overrides.headers || {},
    ...overrides,
  } as any;
}

describe("POST /", () => {
  it("creates a secret and returns url + password", async () => {
    mockedDb.putSecret.mockResolvedValue(undefined);
    const event = makeEvent({
      method: "POST",
      body: JSON.stringify({ text: "my secret" }),
    });

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.url).toContain("?key=");
    expect(body.password).toBeDefined();
    expect(body.password.length).toBeGreaterThanOrEqual(8);
    expect(body.password.length).toBeLessThanOrEqual(14);
    expect(mockedDb.putSecret).toHaveBeenCalledTimes(1);

    const storedRecord = mockedDb.putSecret.mock.calls[0][0];
    expect(storedRecord.viewed).toBe(false);
    expect(storedRecord.encryptedText).toBeDefined();
    expect(storedRecord.iv).toBeDefined();
    expect(storedRecord.salt).toBeDefined();
  });

  it("returns 400 for empty text", async () => {
    const event = makeEvent({
      method: "POST",
      body: JSON.stringify({ text: "" }),
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("text is required");
  });

  it("returns 400 for missing body", async () => {
    const event = makeEvent({ method: "POST", body: null });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });
});

describe("GET /?key=...", () => {
  it("returns viewer HTML for an unviewed secret", async () => {
    const futureTs = Math.floor(Date.now() / 1000) + 172800;
    mockedDb.getSecret.mockResolvedValue({
      pk: "test-id",
      encryptedText: "abc",
      iv: "def",
      salt: "ghi",
      viewed: false,
      createdAt: Math.floor(Date.now() / 1000),
      ttl: futureTs,
    });
    mockedDb.markViewed.mockResolvedValue(undefined);

    const event = makeEvent({ method: "GET", query: { key: "test-id" } });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers["content-type"]).toBe("text/html");
    expect(result.body).toContain("data-encrypted");
    expect(mockedDb.markViewed).toHaveBeenCalledTimes(1);
  });

  it("returns viewer HTML but does NOT update TTL for already-viewed secret", async () => {
    const futureTs = Math.floor(Date.now() / 1000) + 300;
    mockedDb.getSecret.mockResolvedValue({
      pk: "test-id",
      encryptedText: "abc",
      iv: "def",
      salt: "ghi",
      viewed: true,
      createdAt: Math.floor(Date.now() / 1000),
      ttl: futureTs,
    });

    const event = makeEvent({ method: "GET", query: { key: "test-id" } });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("data-encrypted");
    expect(mockedDb.markViewed).not.toHaveBeenCalled();
  });

  it("returns expired page for missing secret", async () => {
    mockedDb.getSecret.mockResolvedValue(null);

    const event = makeEvent({ method: "GET", query: { key: "nope" } });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("expired");
  });

  it("returns expired page when no key param", async () => {
    const event = makeEvent({ method: "GET", query: {} });
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toContain("expired");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest test/handler.test.ts --verbose
```

Expected: FAIL — cannot find module `../lambda/index`

- [ ] **Step 3: Write the Lambda handler**

Write to `lambda/index.ts`:

```typescript
import { v4 as uuidv4 } from "uuid";
import { encrypt, generatePassword } from "./crypto";
import { putSecret, getSecret, markViewed } from "./db";
import { renderViewer } from "./html/viewer";
import { renderExpired } from "./html/expired";

interface LambdaEvent {
  requestContext: {
    http: { method: string; path: string };
  };
  queryStringParameters?: Record<string, string> | null;
  body?: string | null;
  headers: Record<string, string>;
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export async function handler(event: LambdaEvent): Promise<LambdaResponse> {
  const method = event.requestContext.http.method;

  if (method === "POST") {
    return handlePost(event);
  }
  return handleGet(event);
}

async function handlePost(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    if (!event.body) {
      return jsonResponse(400, { error: "text is required" });
    }

    const { text } = JSON.parse(event.body);
    if (!text) {
      return jsonResponse(400, { error: "text is required" });
    }

    const password = generatePassword();
    const pk = uuidv4();
    const { encryptedText, iv, salt } = encrypt(text, password);
    const now = Math.floor(Date.now() / 1000);

    await putSecret({
      pk,
      encryptedText,
      iv,
      salt,
      viewed: false,
      createdAt: now,
      ttl: now + 172800, // 2 days
    });

    // Build URL from the function URL header or fall back to a placeholder
    const host = event.headers["host"] || event.headers["Host"] || "localhost";
    const proto = event.headers["x-forwarded-proto"] || "https";
    const url = `${proto}://${host}/?key=${pk}`;

    return jsonResponse(200, { url, password });
  } catch (err) {
    console.error("POST error:", err);
    return jsonResponse(500, { error: "Internal server error" });
  }
}

async function handleGet(event: LambdaEvent): Promise<LambdaResponse> {
  try {
    const key = event.queryStringParameters?.key;
    if (!key) {
      return htmlResponse(renderExpired());
    }

    const record = await getSecret(key);
    if (!record) {
      return htmlResponse(renderExpired());
    }

    if (!record.viewed) {
      const newTtl = Math.floor(Date.now() / 1000) + 300; // 5 minutes
      await markViewed(record.pk, newTtl);
      record.ttl = newTtl;
      record.viewed = true;
    }

    return htmlResponse(
      renderViewer({
        encryptedText: record.encryptedText,
        iv: record.iv,
        salt: record.salt,
        ttl: record.ttl,
      })
    );
  } catch (err) {
    console.error("GET error:", err);
    return jsonResponse(500, { error: "Internal server error" });
  }
}

function jsonResponse(statusCode: number, body: Record<string, any>): LambdaResponse {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

function htmlResponse(body: string): LambdaResponse {
  return {
    statusCode: 200,
    headers: { "content-type": "text/html" },
    body,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest test/handler.test.ts --verbose
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lambda/index.ts test/handler.test.ts
git commit -m "feat: add Lambda handler with POST/GET routing and handler tests"
```

---

### Task 7: CDK Stack

**Files:**
- Create: `bin/app.ts`
- Create: `lib/stack.ts`
- Create: `test/stack.test.ts`

- [ ] **Step 1: Write the failing CDK test**

Write to `test/stack.test.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { OneTimeSecretStack } from "../lib/stack";

describe("OneTimeSecretStack", () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new OneTimeSecretStack(app, "TestStack");
    template = Template.fromStack(stack);
  });

  it("creates a DynamoDB table with TTL", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
      TimeToLiveSpecification: {
        AttributeName: "ttl",
        Enabled: true,
      },
    });
  });

  it("creates a Lambda function with Node.js 20.x", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs20.x",
      Handler: "index.handler",
    });
  });

  it("creates a Lambda function URL with no auth", () => {
    template.hasResourceProperties("AWS::Lambda::Url", {
      AuthType: "NONE",
    });
  });

  it("passes TABLE_NAME env var to Lambda", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          TABLE_NAME: expect.anything(),
        },
      },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest test/stack.test.ts --verbose
```

Expected: FAIL — cannot find module `../lib/stack`

- [ ] **Step 3: Write the CDK stack**

Write to `lib/stack.ts`:

```typescript
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";

export class OneTimeSecretStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "OneTimeSecrets", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const fn = new NodejsFunction(this, "Handler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler",
      entry: path.join(__dirname, "..", "lambda", "index.ts"),
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    table.grantReadWriteData(fn);

    const fnUrl = fn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, "FunctionUrl", {
      value: fnUrl.url,
      description: "One-Time Secret Function URL",
    });
  }
}
```

- [ ] **Step 4: Write the CDK app entry point**

Write to `bin/app.ts`:

```typescript
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { OneTimeSecretStack } from "../lib/stack";

const app = new cdk.App();
new OneTimeSecretStack(app, "OneTimeSecretStack");
```

- [ ] **Step 5: Run CDK test to verify it passes**

```bash
npx jest test/stack.test.ts --verbose
```

Expected: all 4 tests PASS. Note: the `TABLE_NAME` test may need adjustment — CDK generates logical IDs. If the `Ref` matcher fails, update to match the actual logical ID from the template (e.g., `template.hasResourceProperties("AWS::Lambda::Function", { Environment: { Variables: { TABLE_NAME: expect.anything() } } })`).

- [ ] **Step 6: Commit**

```bash
git add bin/app.ts lib/stack.ts test/stack.test.ts
git commit -m "feat: add CDK stack with DynamoDB, Lambda, and Function URL"
```

---

### Task 8: Local Development Server

**Files:**
- Create: `local/server.ts`

- [ ] **Step 1: Write the local server**

Write to `local/server.ts`:

```typescript
import express from "express";
import { handler } from "../lambda/index";

import { encrypt, generatePassword } from "../lambda/crypto";
import { renderViewer } from "../lambda/html/viewer";
import { renderExpired } from "../lambda/html/expired";
import { v4 as uuidv4 } from "uuid";

interface StoredSecret {
  pk: string;
  encryptedText: string;
  iv: string;
  salt: string;
  viewed: boolean;
  createdAt: number;
  ttl: number;
}

const secrets = new Map<string, StoredSecret>();

const app = express();
app.use(express.json());

app.post("/", (req, res) => {
  const { text } = req.body || {};
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const password = generatePassword();
  const pk = uuidv4();
  const { encryptedText, iv, salt } = encrypt(text, password);
  const now = Math.floor(Date.now() / 1000);
  const ttl = now + 172800;

  secrets.set(pk, { pk, encryptedText, iv, salt, viewed: false, createdAt: now, ttl });

  // Auto-delete after TTL
  setTimeout(() => secrets.delete(pk), 172800 * 1000);

  const url = `http://localhost:3000/?key=${pk}`;
  console.log(`\nSecret created!\n  URL: ${url}\n  Password: ${password}\n`);
  res.json({ url, password });
});

app.get("/", (req, res) => {
  const key = req.query.key as string;
  if (!key) {
    res.send(renderExpired());
    return;
  }

  const record = secrets.get(key);
  const now = Math.floor(Date.now() / 1000);

  if (!record || record.ttl < now) {
    res.send(renderExpired());
    return;
  }

  if (!record.viewed) {
    record.viewed = true;
    record.ttl = now + 300;
    // Reset the auto-delete timer
    setTimeout(() => secrets.delete(key), 300 * 1000);
    console.log(`Secret ${key} viewed. Will be deleted in 5 minutes.`);
  }

  res.send(
    renderViewer({
      encryptedText: record.encryptedText,
      iv: record.iv,
      salt: record.salt,
      ttl: record.ttl,
    })
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nOne-Time Secret local server running at http://localhost:${PORT}\n`);
  console.log("Usage:");
  console.log(`  Create: curl -X POST http://localhost:${PORT}/ -H "Content-Type: application/json" -d '{"text":"my secret"}'`);
  console.log(`  View:   Open the returned URL in your browser\n`);
});
```

- [ ] **Step 2: Test locally by running the server**

```bash
npx ts-node local/server.ts &
sleep 2
# Create a secret
curl -s -X POST http://localhost:3000/ -H "Content-Type: application/json" -d '{"text":"hello from local test"}' | jq .
# Kill the server
kill %1
```

Expected: JSON with `url` and `password` fields. Open the URL in a browser and enter the password to verify decryption works.

- [ ] **Step 3: Commit**

```bash
git add local/server.ts
git commit -m "feat: add local Express development server with in-memory store"
```

---

### Task 9: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the README**

Write to `README.md`:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with usage, deployment, and theme docs"
```

---

### Task 10: Run All Tests and Validate

- [ ] **Step 1: Run full test suite**

```bash
npm test -- --verbose
```

Expected: all tests pass (crypto: 5, handler: 6, stack: 4 = 15 total)

- [ ] **Step 2: Verify local server works end-to-end**

```bash
npx ts-node local/server.ts &
sleep 2
RESULT=$(curl -s -X POST http://localhost:3000/ -H "Content-Type: application/json" -d '{"text":"end to end test"}')
echo $RESULT | jq .
URL=$(echo $RESULT | jq -r .url)
# Fetch the viewer page
curl -s "$URL" | grep -c "data-encrypted"
kill %1
```

Expected: `1` (confirms the encrypted data attribute is present in the HTML)

- [ ] **Step 3: Verify CDK synthesizes**

```bash
npx cdk synth --quiet
```

Expected: no errors, `cdk.out/` created

- [ ] **Step 4: Commit any fixes if needed**

---

### Task 11: Deploy to Playground and Test

- [ ] **Step 1: Bootstrap CDK (if not already done)**

```bash
AWS_PROFILE=playground npx cdk bootstrap
```

- [ ] **Step 2: Deploy**

```bash
AWS_PROFILE=playground npx cdk deploy --require-approval never
```

Expected: stack deploys, function URL output printed

- [ ] **Step 3: Test the deployed function**

```bash
FUNCTION_URL="<paste function URL from output>"
RESULT=$(curl -s -X POST "$FUNCTION_URL" -H "Content-Type: application/json" -d '{"text":"deployed test secret"}')
echo $RESULT | jq .
```

Open the returned URL in a browser. Enter the password. Verify:
- Decryption works
- Timer counts down from ~5 minutes
- Theme switcher works (all 3 themes)
- Refreshing the page still shows the secret (no TTL re-update)
- After 5 minutes, the secret is gone (expired page)

- [ ] **Step 4: Verify destroy removes everything**

```bash
AWS_PROFILE=playground npx cdk destroy --force
```

Check the AWS console — confirm the DynamoDB table and Lambda are gone.

- [ ] **Step 5: Re-deploy to leave it running (optional)**

```bash
AWS_PROFILE=playground npx cdk deploy --require-approval never
```

- [ ] **Step 6: Commit any deployment fixes**

```bash
git add -A
git commit -m "fix: deployment adjustments from playground testing"
```

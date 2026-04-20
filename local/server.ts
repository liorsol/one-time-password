import express from "express";
import { encrypt, generatePassword } from "../lambda/crypto";
import { renderViewer } from "../shared/html/viewer";
import { renderExpired } from "../shared/html/expired";
import { renderCreator } from "../shared/html/creator";
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
  const body = req.body || {};

  // Pre-encrypted payload from creator page
  if (body.encryptedText) {
    const { encryptedText, iv, salt } = body;
    if (!iv || !salt) {
      res.status(400).json({ error: "encryptedText, iv, and salt are required" });
      return;
    }

    const pk = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const ttl = now + 172800;

    secrets.set(pk, { pk, encryptedText, iv, salt, viewed: false, createdAt: now, ttl });
    setTimeout(() => secrets.delete(pk), 172800 * 1000);

    const url = `http://localhost:3000/?key=${pk}`;
    console.log(`\nSecret created (client-encrypted)!\n  URL: ${url}\n`);
    res.json({ url });
    return;
  }

  // Server-side encryption (API usage)
  const { text } = body;
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
  setTimeout(() => secrets.delete(pk), 172800 * 1000);

  const url = `http://localhost:3000/?key=${pk}`;
  console.log(`\nSecret created!\n  URL: ${url}\n  Password: ${password}\n`);
  res.json({ url, password });
});

app.get("/", (req, res) => {
  const key = req.query.key as string;
  if (!key) {
    res.send(renderCreator({
      submitHandler: `
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encryptedText: encrypted.encryptedText, iv: encrypted.iv, salt: encrypted.salt })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) { if (data.error) onFailure(data.error); else onSuccess(data); })
        .catch(function(err) { onFailure(err.message || err); });
      `,
    }));
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

export { app };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\nOne-Time Secret local server running at http://localhost:${PORT}\n`);
    console.log("Usage:");
    console.log(`  Create: curl -X POST http://localhost:${PORT}/ -H "Content-Type: application/json" -d '{"text":"my secret"}'`);
    console.log(`  View:   Open the returned URL in your browser\n`);
  });
}

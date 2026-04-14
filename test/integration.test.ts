/**
 * Remote integration tests — run against a deployed Lambda endpoint.
 *
 * Usage:
 *   TARGET_URL=https://<your-function-url> npm run test:integration
 *
 * Skipped when TARGET_URL is not set (e.g. during regular `npm test`).
 */

const TARGET_URL = process.env.TARGET_URL;

const describeIfTarget = TARGET_URL ? describe : describe.skip;

describeIfTarget("Remote integration", () => {
  describe("GET /", () => {
    it("returns creator page with textarea and create button", async () => {
      const res = await fetch(TARGET_URL!);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("<textarea");
      expect(html).toContain("Create Secret Link");
    });
  });

  describe("POST / with {text} (server-side encryption)", () => {
    let secretUrl: string;

    it("creates a secret and returns url + password", async () => {
      const res = await fetch(TARGET_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "integration test secret" }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { url: string; password: string };
      expect(body.url).toContain("?key=");
      expect(body.password.length).toBeGreaterThanOrEqual(8);
      expect(body.password.length).toBeLessThanOrEqual(14);
      secretUrl = body.url;
    });

    it("viewing the secret returns encrypted data attributes", async () => {
      const res = await fetch(secretUrl);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("data-encrypted");
      expect(html).toContain("data-iv");
      expect(html).toContain("data-salt");
    });
  });

  describe("POST / with {encryptedText, iv, salt} (pre-encrypted)", () => {
    it("stores payload and returns url without password", async () => {
      const res = await fetch(TARGET_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedText: "dGVzdA==",
          iv: "dGVzdGl2",
          salt: "dGVzdHNhbHQ=",
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { url: string; password?: string };
      expect(body.url).toContain("?key=");
      expect(body.password).toBeUndefined();
    });
  });

  describe("POST / validation errors", () => {
    it("returns 400 for invalid JSON", async () => {
      const res = await fetch(TARGET_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Invalid JSON");
    });

    it("returns 400 for missing text", async () => {
      const res = await fetch(TARGET_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 for pre-encrypted payload missing iv/salt", async () => {
      const res = await fetch(TARGET_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedText: "abc" }),
      });

      expect(res.status).toBe(400);
    });

    it("returns 400 for non-string encryptedText", async () => {
      const res = await fetch(TARGET_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encryptedText: 123, iv: "a", salt: "b" }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET / with missing key", () => {
    it("returns expired page for nonexistent key", async () => {
      const res = await fetch(`${TARGET_URL}?key=nonexistent`);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html.toLowerCase()).toContain("expired");
    });
  });
});

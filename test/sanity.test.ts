import { app } from "../local/server";
import { decrypt } from "../lambda/crypto";
import http from "http";

let server: http.Server;
let baseUrl: string;

beforeAll((done) => {
  server = app.listen(0, () => {
    const addr = server.address() as any;
    baseUrl = `http://localhost:${addr.port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

let sharedUrl: string;
let sharedPassword: string;

test("POST creates a secret", async () => {
  const res = await fetch(baseUrl + "/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "hello sanity test" }),
  });

  expect(res.status).toBe(200);
  const body = (await res.json()) as { url: string; password: string };
  expect(body).toHaveProperty("url");
  expect(body).toHaveProperty("password");
  expect(body.password.length).toBeGreaterThanOrEqual(8);
  expect(body.password.length).toBeLessThanOrEqual(14);

  sharedUrl = body.url;
  sharedPassword = body.password;
});

test("GET returns viewer HTML with encrypted data attributes", async () => {
  const key = new URL(sharedUrl).searchParams.get("key");
  const res = await fetch(`${baseUrl}/?key=${key}`);

  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("data-encrypted");
  expect(html).toContain("data-iv");
  expect(html).toContain("data-salt");
  expect(html).toContain("data-ttl");
});

test("encrypted data can be decrypted with returned password", async () => {
  const key = new URL(sharedUrl).searchParams.get("key");
  const res = await fetch(`${baseUrl}/?key=${key}`);
  const html = await res.text();

  const encryptedMatch = html.match(/data-encrypted="([^"]+)"/);
  const ivMatch = html.match(/data-iv="([^"]+)"/);
  const saltMatch = html.match(/data-salt="([^"]+)"/);

  expect(encryptedMatch).not.toBeNull();
  expect(ivMatch).not.toBeNull();
  expect(saltMatch).not.toBeNull();

  const plaintext = decrypt(
    encryptedMatch![1],
    ivMatch![1],
    saltMatch![1],
    sharedPassword
  );
  expect(plaintext).toBe("hello sanity test");
});

test("second GET still works (viewed)", async () => {
  const key = new URL(sharedUrl).searchParams.get("key");
  const res = await fetch(`${baseUrl}/?key=${key}`);

  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html).toContain("data-encrypted");
});

test("missing key returns expired page", async () => {
  const res = await fetch(`${baseUrl}/?key=nonexistent`);

  expect(res.status).toBe(200);
  const html = await res.text();
  expect(html.toLowerCase()).toContain("expired");
});

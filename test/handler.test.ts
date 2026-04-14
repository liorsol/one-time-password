import { handler } from "../lambda/index";
import * as db from "../lambda/db";
import * as cryptoModule from "../lambda/crypto";

jest.mock("../lambda/db");

const mockedDb = db as jest.Mocked<typeof db>;

beforeEach(() => {
  jest.clearAllMocks();
});

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

  it("stores pre-encrypted payload and returns url without password", async () => {
    mockedDb.putSecret.mockResolvedValue(undefined);
    const event = makeEvent({
      method: "POST",
      body: JSON.stringify({
        encryptedText: "encrypted-base64",
        iv: "iv-base64",
        salt: "salt-base64",
      }),
    });

    const result = await handler(event);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body.url).toContain("?key=");
    expect(body.password).toBeUndefined();
    expect(mockedDb.putSecret).toHaveBeenCalledTimes(1);

    const storedRecord = mockedDb.putSecret.mock.calls[0][0];
    expect(storedRecord.encryptedText).toBe("encrypted-base64");
    expect(storedRecord.iv).toBe("iv-base64");
    expect(storedRecord.salt).toBe("salt-base64");
    expect(storedRecord.viewed).toBe(false);
  });

  it("returns 400 for pre-encrypted payload missing iv or salt", async () => {
    const event = makeEvent({
      method: "POST",
      body: JSON.stringify({ encryptedText: "abc" }),
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for pre-encrypted payload missing only salt", async () => {
    const event = makeEvent({
      method: "POST",
      body: JSON.stringify({ encryptedText: "abc", iv: "def" }),
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for pre-encrypted payload with non-string encryptedText", async () => {
    const event = makeEvent({
      method: "POST",
      body: JSON.stringify({ encryptedText: 123, iv: "iv", salt: "salt" }),
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const event = makeEvent({
      method: "POST",
      body: "not json",
    });
    const result = await handler(event);
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("Invalid JSON");
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

  it("returns creator page when no key param", async () => {
    const event = makeEvent({ method: "GET", query: {} });
    const result = await handler(event);
    expect(result.statusCode).toBe(200);
    expect(result.headers["content-type"]).toBe("text/html");
    expect(result.body).toContain("<textarea");
    expect(result.body).toContain("Create Secret Link");
  });
});

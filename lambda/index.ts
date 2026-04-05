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
      const newTtl = Math.floor(Date.now() / 1000) + 300;
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

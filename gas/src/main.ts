import { renderViewer } from "../../shared/html/viewer";
import { renderExpired } from "../../shared/html/expired";
import { renderCreator } from "./html/creator";
import { getSecret, putSecret, markViewed, cleanupExpired as dbCleanup, ensureSpreadsheet } from "./db";

export function doGet(
  e: GoogleAppsScript.Events.DoGet
): GoogleAppsScript.HTML.HtmlOutput {
  ensureSpreadsheet();
  const key = e?.parameter?.key;

  if (key) {
    const record = getSecret(key);
    if (!record) return html(renderExpired());

    if (!record.viewed) {
      const newTtl = Math.floor(Date.now() / 1000) + 300;
      markViewed(record.pk, newTtl);
      record.ttl = newTtl;
      record.viewed = true;
    }

    return html(
      renderViewer({
        encryptedText: record.encryptedText,
        iv: record.iv,
        salt: record.salt,
        ttl: record.ttl,
      })
    );
  }

  return html(renderCreator());
}

export function createSecret(payload: {
  encryptedText: string;
  iv: string;
  salt: string;
}): { url: string } {
  const pk = Utilities.getUuid();
  const now = Math.floor(Date.now() / 1000);

  putSecret({
    pk,
    encryptedText: payload.encryptedText,
    iv: payload.iv,
    salt: payload.salt,
    viewed: false,
    createdAt: now,
    ttl: now + 172800, // 2 days
  });

  const url = ScriptApp.getService().getUrl() + "?key=" + pk;
  return { url };
}

export function cleanupExpired(): void {
  dbCleanup();
}

function html(content: string): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutput(content).setXFrameOptionsMode(
    HtmlService.XFrameOptionsMode.ALLOWALL
  );
}

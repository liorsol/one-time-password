import { SecretRecord } from "../../shared/types";

const HEADERS = ["pk", "encryptedText", "iv", "salt", "viewed", "createdAt", "ttl"];

export function ensureSpreadsheet(): void {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("SPREADSHEET_ID")) return;

  const ss = SpreadsheetApp.create("One-Time Secret — Data");
  let sheet = ss.getSheets()[0];
  sheet.setName("Secrets");
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);

  props.setProperty("SPREADSHEET_ID", ss.getId());
}

function getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("SPREADSHEET_ID not set — visit the app once to auto-create");
  const sheet = SpreadsheetApp.openById(id).getSheetByName("Secrets");
  if (!sheet) throw new Error('Sheet "Secrets" not found');
  return sheet;
}

function findRow(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  pk: string
): number | null {
  const finder = sheet.getRange("A:A").createTextFinder(pk).matchEntireCell(true);
  const cell = finder.findNext();
  return cell ? cell.getRow() : null;
}

export function putSecret(record: SecretRecord): void {
  const sheet = getSheet();
  sheet.appendRow([
    record.pk,
    record.encryptedText,
    record.iv,
    record.salt,
    record.viewed,
    record.createdAt,
    record.ttl,
  ]);
}

export function getSecret(pk: string): SecretRecord | null {
  const sheet = getSheet();
  const row = findRow(sheet, pk);
  if (!row) return null;

  const values = sheet.getRange(row, 1, 1, 7).getValues()[0];
  const now = Math.floor(Date.now() / 1000);

  // Check TTL expiry
  if (Number(values[6]) < now) return null;

  return {
    pk: String(values[0]),
    encryptedText: String(values[1]),
    iv: String(values[2]),
    salt: String(values[3]),
    viewed: values[4] === true || values[4] === "true",
    createdAt: Number(values[5]),
    ttl: Number(values[6]),
  };
}

export function markViewed(pk: string, newTtl: number): void {
  const sheet = getSheet();
  const row = findRow(sheet, pk);
  if (!row) return;

  sheet.getRange(row, 5).setValue(true); // viewed column
  sheet.getRange(row, 7).setValue(newTtl); // ttl column
}

export function cleanupExpired(): void {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const now = Math.floor(Date.now() / 1000);

  // Delete from bottom up to avoid row index shifting
  for (let i = data.length - 1; i >= 1; i--) {
    if (Number(data[i][6]) < now) {
      sheet.deleteRow(i + 1); // +1 because rows are 1-indexed
    }
  }
}

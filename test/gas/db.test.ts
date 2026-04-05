import "./setup";
import { mockSheet, mockTextFinder } from "./setup";
import { putSecret, getSecret, markViewed, cleanupExpired } from "../../gas/src/db";

beforeEach(() => {
  jest.clearAllMocks();

  // Re-wire default mock chain after clearAllMocks
  mockSheet.getRange.mockReturnValue({
    createTextFinder: jest.fn(() => mockTextFinder),
    getValues: jest.fn(() => [[]]),
    setValue: jest.fn(),
  });
  mockSheet.getDataRange.mockReturnValue({
    getValues: jest.fn(() => [
      ["pk", "encryptedText", "iv", "salt", "viewed", "createdAt", "ttl"],
    ]),
  });
  mockTextFinder.matchEntireCell.mockReturnThis();
  mockTextFinder.findNext.mockReturnValue(null);
});

describe("putSecret", () => {
  it("calls sheet.appendRow with correct values in correct order", () => {
    const record = {
      pk: "pk-1",
      encryptedText: "enc",
      iv: "iv1",
      salt: "salt1",
      viewed: false,
      createdAt: 1000,
      ttl: 2000,
    };

    putSecret(record);

    expect(mockSheet.appendRow).toHaveBeenCalledWith([
      "pk-1",
      "enc",
      "iv1",
      "salt1",
      false,
      1000,
      2000,
    ]);
  });
});

describe("getSecret", () => {
  it("returns record when found and not expired", () => {
    const futureTs = Math.floor(Date.now() / 1000) + 9999;
    const mockCell = { getRow: jest.fn(() => 2) };
    mockTextFinder.findNext.mockReturnValue(mockCell);

    mockSheet.getRange.mockImplementation(
      (row: number, col: number, _rows?: number, cols?: number) => {
        if (cols === 7) {
          return {
            getValues: jest.fn(() => [
              ["pk-1", "enc", "iv1", "salt1", false, 1000, futureTs],
            ]),
          };
        }
        return {
          createTextFinder: jest.fn(() => mockTextFinder),
          setValue: jest.fn(),
        };
      }
    );

    const result = getSecret("pk-1");

    expect(result).toEqual({
      pk: "pk-1",
      encryptedText: "enc",
      iv: "iv1",
      salt: "salt1",
      viewed: false,
      createdAt: 1000,
      ttl: futureTs,
    });
  });

  it("returns null when pk not found", () => {
    mockTextFinder.findNext.mockReturnValue(null);

    const result = getSecret("nonexistent");

    expect(result).toBeNull();
  });

  it("returns null when record is expired", () => {
    const pastTs = Math.floor(Date.now() / 1000) - 100;
    const mockCell = { getRow: jest.fn(() => 2) };
    mockTextFinder.findNext.mockReturnValue(mockCell);

    mockSheet.getRange.mockImplementation(
      (row: number, col: number, _rows?: number, cols?: number) => {
        if (cols === 7) {
          return {
            getValues: jest.fn(() => [
              ["pk-1", "enc", "iv1", "salt1", false, 1000, pastTs],
            ]),
          };
        }
        return {
          createTextFinder: jest.fn(() => mockTextFinder),
          setValue: jest.fn(),
        };
      }
    );

    const result = getSecret("pk-1");

    expect(result).toBeNull();
  });
});

describe("markViewed", () => {
  it("updates the correct row viewed and ttl columns", () => {
    const mockCell = { getRow: jest.fn(() => 3) };
    mockTextFinder.findNext.mockReturnValue(mockCell);

    const mockSetValue = jest.fn();
    mockSheet.getRange.mockImplementation(
      (row: number, col: number, _rows?: number, cols?: number) => {
        if (row === 3 && (col === 5 || col === 7)) {
          return { setValue: mockSetValue };
        }
        return {
          createTextFinder: jest.fn(() => mockTextFinder),
          setValue: jest.fn(),
        };
      }
    );

    markViewed("pk-1", 5000);

    expect(mockSheet.getRange).toHaveBeenCalledWith(3, 5);
    expect(mockSheet.getRange).toHaveBeenCalledWith(3, 7);
    expect(mockSetValue).toHaveBeenCalledWith(true);
    expect(mockSetValue).toHaveBeenCalledWith(5000);
  });
});

describe("cleanupExpired", () => {
  it("deletes rows with expired TTL from bottom to top", () => {
    const now = Math.floor(Date.now() / 1000);
    const pastTs = now - 100;
    const futureTs = now + 9999;

    mockSheet.getDataRange.mockReturnValue({
      getValues: jest.fn(() => [
        ["pk", "encryptedText", "iv", "salt", "viewed", "createdAt", "ttl"], // header
        ["pk-1", "enc", "iv1", "salt1", false, 1000, pastTs], // row 2 - expired
        ["pk-2", "enc", "iv2", "salt2", false, 1000, futureTs], // row 3 - valid
        ["pk-3", "enc", "iv3", "salt3", false, 1000, pastTs], // row 4 - expired
      ]),
    });

    cleanupExpired();

    // Should delete from bottom to top: row 4 first, then row 2
    expect(mockSheet.deleteRow).toHaveBeenCalledTimes(2);
    expect(mockSheet.deleteRow).toHaveBeenNthCalledWith(1, 4); // row index 3 + 1
    expect(mockSheet.deleteRow).toHaveBeenNthCalledWith(2, 2); // row index 1 + 1
  });
});

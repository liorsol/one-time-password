// Mock Google Apps Script globals for Jest

const mockSheet = {
  appendRow: jest.fn(),
  getRange: jest.fn(),
  getDataRange: jest.fn(),
  deleteRow: jest.fn(),
  getSheetByName: jest.fn(),
};

const mockSpreadsheet = {
  getSheetByName: jest.fn(() => mockSheet),
};

const mockTextFinder = {
  matchEntireCell: jest.fn().mockReturnThis(),
  findNext: jest.fn(),
};

// Wire up the chain
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

(global as any).SpreadsheetApp = {
  openById: jest.fn(() => mockSpreadsheet),
};

(global as any).PropertiesService = {
  getScriptProperties: jest.fn(() => ({
    getProperty: jest.fn((key: string) =>
      key === "SPREADSHEET_ID" ? "test-sheet-id" : null
    ),
  })),
};

(global as any).HtmlService = {
  createHtmlOutput: jest.fn((content: string) => ({
    setXFrameOptionsMode: jest.fn().mockReturnThis(),
    getContent: jest.fn(() => content),
  })),
  XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
};

(global as any).ScriptApp = {
  getService: jest.fn(() => ({
    getUrl: jest.fn(() => "https://script.google.com/macros/s/test/exec"),
  })),
};

(global as any).Utilities = {
  getUuid: jest.fn(() => "test-uuid-1234"),
};

export { mockSheet, mockSpreadsheet, mockTextFinder };

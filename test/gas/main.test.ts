import "./setup";

jest.mock("../../gas/src/db");

import { doGet, createSecret } from "../../gas/src/main";
import * as db from "../../gas/src/db";

const mockedDb = db as jest.Mocked<typeof db>;

function makeEvent(params: Record<string, string> = {}): any {
  return { parameter: params };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("doGet", () => {
  it("returns creator HTML when no key parameter", () => {
    const result = doGet(makeEvent());
    const content = (result as any).getContent();

    expect(content).toContain("textarea");
    expect(content).toContain("Create Secret Link");
  });

  it("returns viewer HTML with data-encrypted when key is valid", () => {
    const futureTs = Math.floor(Date.now() / 1000) + 9999;
    mockedDb.getSecret.mockReturnValue({
      pk: "pk-1",
      encryptedText: "enc-data",
      iv: "iv-data",
      salt: "salt-data",
      viewed: true,
      createdAt: 1000,
      ttl: futureTs,
    });

    const result = doGet(makeEvent({ key: "pk-1" }));
    const content = (result as any).getContent();

    expect(mockedDb.getSecret).toHaveBeenCalledWith("pk-1");
    expect(content).toContain("data-encrypted");
    expect(content).toContain("enc-data");
  });

  it("calls markViewed on unviewed secret", () => {
    const futureTs = Math.floor(Date.now() / 1000) + 9999;
    mockedDb.getSecret.mockReturnValue({
      pk: "pk-1",
      encryptedText: "enc",
      iv: "iv1",
      salt: "salt1",
      viewed: false,
      createdAt: 1000,
      ttl: futureTs,
    });

    doGet(makeEvent({ key: "pk-1" }));

    expect(mockedDb.markViewed).toHaveBeenCalledWith("pk-1", expect.any(Number));
  });

  it("does NOT call markViewed on already-viewed secret", () => {
    const futureTs = Math.floor(Date.now() / 1000) + 9999;
    mockedDb.getSecret.mockReturnValue({
      pk: "pk-1",
      encryptedText: "enc",
      iv: "iv1",
      salt: "salt1",
      viewed: true,
      createdAt: 1000,
      ttl: futureTs,
    });

    doGet(makeEvent({ key: "pk-1" }));

    expect(mockedDb.markViewed).not.toHaveBeenCalled();
  });

  it("returns expired page when key not found", () => {
    mockedDb.getSecret.mockReturnValue(null);

    const result = doGet(makeEvent({ key: "missing-key" }));
    const content = (result as any).getContent();

    expect(mockedDb.getSecret).toHaveBeenCalledWith("missing-key");
    // Expired page should not contain the creator textarea or data-encrypted
    expect(content).not.toContain("data-encrypted");
    expect(content).not.toContain("<textarea");
  });
});

describe("createSecret", () => {
  it("calls putSecret and returns url with key", () => {
    const payload = {
      encryptedText: "enc",
      iv: "iv1",
      salt: "salt1",
    };

    const result = createSecret(payload);

    expect(mockedDb.putSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        pk: "test-uuid-1234",
        encryptedText: "enc",
        iv: "iv1",
        salt: "salt1",
        viewed: false,
      })
    );

    expect(result.url).toContain("test-uuid-1234");
    expect(result.url).toContain("?key=");
  });
});

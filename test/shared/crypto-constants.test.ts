import {
  PBKDF2_ITERATIONS,
  KEY_LENGTH,
  IV_LENGTH,
  SALT_LENGTH,
  PASSWORD_CHARS,
  ALGORITHM,
  DIGEST,
} from "../../shared/crypto-constants";

describe("crypto-constants", () => {
  it("PBKDF2_ITERATIONS is 100000", () => {
    expect(PBKDF2_ITERATIONS).toBe(100_000);
  });

  it("KEY_LENGTH is 32", () => {
    expect(KEY_LENGTH).toBe(32);
  });

  it("IV_LENGTH is 12", () => {
    expect(IV_LENGTH).toBe(12);
  });

  it("SALT_LENGTH is 16", () => {
    expect(SALT_LENGTH).toBe(16);
  });

  it("ALGORITHM is aes-256-gcm", () => {
    expect(ALGORITHM).toBe("aes-256-gcm");
  });

  it("DIGEST is sha256", () => {
    expect(DIGEST).toBe("sha256");
  });

  it("PASSWORD_CHARS includes uppercase, lowercase, digits, and special chars", () => {
    expect(PASSWORD_CHARS).toMatch(/[A-Z]/);
    expect(PASSWORD_CHARS).toMatch(/[a-z]/);
    expect(PASSWORD_CHARS).toMatch(/[0-9]/);
    expect(PASSWORD_CHARS).toContain("!");
    expect(PASSWORD_CHARS).toContain("@");
    expect(PASSWORD_CHARS).toContain("#");
    expect(PASSWORD_CHARS).toContain("$");
    expect(PASSWORD_CHARS).toContain("%");
    expect(PASSWORD_CHARS).toContain("^");
    expect(PASSWORD_CHARS).toContain("&");
    expect(PASSWORD_CHARS).toContain("*");
  });
});

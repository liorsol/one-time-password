import { encrypt, decrypt, generatePassword } from "../lambda/crypto";

describe("generatePassword", () => {
  it("returns a password between 8 and 14 characters", () => {
    for (let i = 0; i < 100; i++) {
      const pw = generatePassword();
      expect(pw.length).toBeGreaterThanOrEqual(8);
      expect(pw.length).toBeLessThanOrEqual(14);
    }
  });

  it("uses only allowed characters", () => {
    const allowed = /^[A-Za-z0-9!@#$%^&*]+$/;
    for (let i = 0; i < 100; i++) {
      expect(generatePassword()).toMatch(allowed);
    }
  });
});

describe("encrypt / decrypt", () => {
  it("round-trips a simple string", () => {
    const password = "testpass123";
    const plaintext = "hello world";
    const { encryptedText, iv, salt } = encrypt(plaintext, password);
    const result = decrypt(encryptedText, iv, salt, password);
    expect(result).toBe(plaintext);
  });

  it("round-trips unicode text", () => {
    const password = "p@ss!";
    const plaintext = "こんにちは 🌍 émojis & symbols™";
    const { encryptedText, iv, salt } = encrypt(plaintext, password);
    const result = decrypt(encryptedText, iv, salt, password);
    expect(result).toBe(plaintext);
  });

  it("round-trips a large string", () => {
    const password = "bigpassword";
    const plaintext = "A".repeat(10000);
    const { encryptedText, iv, salt } = encrypt(plaintext, password);
    const result = decrypt(encryptedText, iv, salt, password);
    expect(result).toBe(plaintext);
  });

  it("fails with wrong password", () => {
    const { encryptedText, iv, salt } = encrypt("secret", "correct");
    expect(() => decrypt(encryptedText, iv, salt, "wrong")).toThrow();
  });

  it("returns base64 strings", () => {
    const base64 = /^[A-Za-z0-9+/]+=*$/;
    const { encryptedText, iv, salt } = encrypt("test", "pass");
    expect(encryptedText).toMatch(base64);
    expect(iv).toMatch(base64);
    expect(salt).toMatch(base64);
  });
});

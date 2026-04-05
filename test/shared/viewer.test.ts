import { renderViewer } from "../../shared/html/viewer";

describe("renderViewer", () => {
  const html = renderViewer({
    encryptedText: "abc123",
    iv: "iv456",
    salt: "salt789",
    ttl: 300,
  });

  it("contains data-encrypted, data-iv, data-salt, data-ttl attributes", () => {
    expect(html).toContain('data-encrypted="abc123"');
    expect(html).toContain('data-iv="iv456"');
    expect(html).toContain('data-salt="salt789"');
    expect(html).toContain('data-ttl="300"');
  });

  it("includes all three theme CSS blocks", () => {
    expect(html).toContain("theme-retro");
    expect(html).toContain("theme-tactical");
    expect(html).toContain("theme-modern");
  });

  it("includes theme switcher select with 3 options", () => {
    expect(html).toContain("<select");
    const optionMatches = html.match(/<option /g);
    expect(optionMatches).toHaveLength(3);
  });

  it("includes the decryption script", () => {
    expect(html).toContain("crypto.subtle.decrypt");
  });

  it("escapes special characters in data attributes", () => {
    const escaped = renderViewer({
      encryptedText: 'a&b"c<d>e',
      iv: "iv",
      salt: "salt",
      ttl: 60,
    });
    expect(escaped).toContain('data-encrypted="a&amp;b&quot;c&lt;d&gt;e"');
  });
});

import { renderExpired } from "../../shared/html/expired";

describe("renderExpired", () => {
  const html = renderExpired();

  it("contains theme CSS", () => {
    expect(html).toContain("theme-retro");
    expect(html).toContain("theme-tactical");
    expect(html).toContain("theme-modern");
  });

  it("includes theme switcher", () => {
    expect(html).toContain("<select");
    expect(html).toContain("themeSwitcher");
  });

  it("does not contain data-encrypted or passwordInput", () => {
    expect(html).not.toContain("data-encrypted");
    expect(html).not.toContain("passwordInput");
  });

  it("contains expired-related elements", () => {
    expect(html).toContain("expiredTitle");
    expect(html).toContain("expiredMessage");
  });
});

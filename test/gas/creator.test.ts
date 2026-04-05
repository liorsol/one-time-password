import { renderCreator } from "../../gas/src/html/creator";

describe("renderCreator", () => {
  let html: string;

  beforeAll(() => {
    html = renderCreator();
  });

  it("returns HTML containing a textarea element", () => {
    expect(html).toContain("<textarea");
  });

  it("returns HTML containing Create Secret Link button text", () => {
    expect(html).toContain("Create Secret Link");
  });

  it("includes theme CSS with theme-retro class", () => {
    expect(html).toContain("theme-retro");
  });

  it("includes theme switcher select element", () => {
    expect(html).toContain("<select");
    expect(html).toContain("themeSwitcher");
  });

  it("includes Web Crypto encryption code", () => {
    expect(html).toContain("crypto.subtle.encrypt");
  });

  it("includes google.script.run call", () => {
    expect(html).toContain("google.script.run");
  });
});

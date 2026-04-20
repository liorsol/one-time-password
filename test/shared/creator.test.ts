import { renderCreator } from "../../shared/html/creator";

describe("renderCreator", () => {
  const submitHandler = 'testSubmitHandler(encrypted, password);';
  let html: string;

  beforeAll(() => {
    html = renderCreator({ submitHandler });
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

  it("injects the provided submitHandler", () => {
    expect(html).toContain("testSubmitHandler(encrypted, password)");
  });

  it("does not contain google.script.run", () => {
    expect(html).not.toContain("google.script.run");
  });

  it("includes all three theme options", () => {
    const optionMatches = html.match(/<option/g);
    expect(optionMatches).toHaveLength(3);
  });
});

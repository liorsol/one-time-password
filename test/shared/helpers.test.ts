import {
  escapeAttr,
  scopeThemeCss,
  buildCombinedCss,
  buildThemeData,
  buildThemeOptions,
} from "../../shared/html/helpers";
import { Theme } from "../../shared/types";

const testThemes: Theme[] = [
  {
    name: "retro",
    label: "Retro",
    css: "body { color: green; }",
    headerBorder: "H",
    footerBorder: "F",
    titleText: "T",
    timerLabel: "TL",
    inputLabel: "IL",
    buttonText: "BT",
    destroyedText: "DT",
    expiredTitle: "ET",
    expiredMessage: "EM",
  },
  {
    name: "modern",
    label: "Modern",
    css: "body { color: blue; }",
    headerBorder: "H2",
    footerBorder: "F2",
    titleText: "T2",
    timerLabel: "TL2",
    inputLabel: "IL2",
    buttonText: "BT2",
    destroyedText: "DT2",
    expiredTitle: "ET2",
    expiredMessage: "EM2",
  },
];

describe("escapeAttr", () => {
  it("escapes &, \", <, >", () => {
    expect(escapeAttr('a&b"c<d>e')).toBe("a&amp;b&quot;c&lt;d&gt;e");
  });

  it("returns unmodified string when no special chars", () => {
    expect(escapeAttr("hello world")).toBe("hello world");
  });
});

describe("scopeThemeCss", () => {
  it("replaces standalone body with body.theme-<name>", () => {
    expect(scopeThemeCss("body { }", "retro")).toBe("body.theme-retro { }");
  });

  it("handles body::before", () => {
    expect(scopeThemeCss("body::before { content: ''; }", "tactical")).toBe(
      "body.theme-tactical::before { content: ''; }"
    );
  });

  it("does not replace body inside words like somebody", () => {
    expect(scopeThemeCss("somebody { }", "retro")).toBe("somebody { }");
  });
});

describe("buildCombinedCss", () => {
  it("combines CSS from multiple themes, each scoped", () => {
    const result = buildCombinedCss(testThemes);
    expect(result).toContain("body.theme-retro { color: green; }");
    expect(result).toContain("body.theme-modern { color: blue; }");
  });
});

describe("buildThemeData", () => {
  it("generates valid JSON with specified fields", () => {
    const json = buildThemeData(testThemes, ["headerBorder", "footerBorder"]);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual({
      retro: { headerBorder: "H", footerBorder: "F" },
      modern: { headerBorder: "H2", footerBorder: "F2" },
    });
  });
});

describe("buildThemeOptions", () => {
  it("generates option tags with retro selected", () => {
    const result = buildThemeOptions(testThemes);
    expect(result).toContain('<option value="retro" selected>Retro</option>');
    expect(result).toContain('<option value="modern">Modern</option>');
    expect(result).not.toContain('value="modern" selected');
  });
});

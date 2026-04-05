import { Theme } from "../types";

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function scopeThemeCss(css: string, themeName: string): string {
  return css.replace(/\bbody\b/g, `body.theme-${themeName}`);
}

export function buildCombinedCss(themes: Theme[]): string {
  return themes.map((t) => scopeThemeCss(t.css, t.name)).join("\n");
}

export function buildThemeData(
  themes: Theme[],
  fields: (keyof Theme)[]
): string {
  return JSON.stringify(
    Object.fromEntries(
      themes.map((t) => [
        t.name,
        Object.fromEntries(fields.map((f) => [f, t[f]])),
      ])
    )
  );
}

export function buildThemeOptions(themes: Theme[]): string {
  return themes
    .map(
      (t) =>
        `<option value="${t.name}"${t.name === "retro" ? " selected" : ""}>${t.label}</option>`
    )
    .join("\n        ");
}

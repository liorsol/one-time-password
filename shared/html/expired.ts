import { retroTheme } from "./themes/retro";
import { tacticalTheme } from "./themes/tactical";
import { modernTheme } from "./themes/modern";
import { buildCombinedCss, buildThemeData, buildThemeOptions } from "./helpers";

const themes = [retroTheme, tacticalTheme, modernTheme];

const expiredThemeFields = [
  "headerBorder",
  "footerBorder",
  "expiredTitle",
  "expiredMessage",
] as const;

export function renderExpired(): string {
  const combinedCss = buildCombinedCss(themes);
  const themeData = buildThemeData(themes, [...expiredThemeFields]);
  const themeOptions = buildThemeOptions(themes);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One-Time Secret — Expired</title>
  <style>
${combinedCss}
  </style>
</head>
<body class="theme-retro">

  <div class="theme-switcher">
    <select id="themeSwitcher" aria-label="Choose theme">
        ${themeOptions}
    </select>
  </div>

  <div class="container">
    <div class="header-border" id="headerBorder"></div>
    <div class="title" id="expiredTitle"></div>
    <div class="destroyed" id="expiredMessage"></div>
    <div class="header-border" id="footerBorder"></div>
  </div>

  <script>
    (function () {
      var THEME_DATA = ${themeData};

      var body = document.body;
      var headerBorderEl = document.getElementById('headerBorder');
      var footerBorderEl = document.getElementById('footerBorder');
      var expiredTitleEl = document.getElementById('expiredTitle');
      var expiredMessageEl = document.getElementById('expiredMessage');
      var themeSwitcher = document.getElementById('themeSwitcher');

      function applyTheme(themeName) {
        var data = THEME_DATA[themeName];
        if (!data) return;

        var classes = body.className.split(' ').filter(function(c) { return !c.startsWith('theme-'); });
        classes.push('theme-' + themeName);
        body.className = classes.join(' ');

        localStorage.setItem('otp-theme', themeName);

        headerBorderEl.textContent = data.headerBorder;
        footerBorderEl.textContent = data.footerBorder;
        expiredTitleEl.textContent = data.expiredTitle;
        expiredMessageEl.textContent = data.expiredMessage;
      }

      function getSavedTheme() {
        try { return localStorage.getItem('otp-theme'); } catch(e) { return null; }
      }

      themeSwitcher.addEventListener('change', function() {
        applyTheme(themeSwitcher.value);
      });

      var savedTheme = getSavedTheme();
      var initialTheme = (savedTheme && THEME_DATA[savedTheme]) ? savedTheme : 'retro';
      themeSwitcher.value = initialTheme;
      applyTheme(initialTheme);
    })();
  </script>
</body>
</html>`;
}

import { retroTheme } from "./themes/retro";
import { tacticalTheme } from "./themes/tactical";
import { modernTheme } from "./themes/modern";

const themes = [retroTheme, tacticalTheme, modernTheme];

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function scopeThemeCss(css: string, themeName: string): string {
  // Replace `body` selector (not inside words) with `body.theme-<name>`
  // Handles: body { ... }, body::before { ... }, body::after { ... }
  return css.replace(/\bbody\b/g, `body.theme-${themeName}`);
}

export interface ViewerOptions {
  encryptedText: string;
  iv: string;
  salt: string;
  ttl: number;
}

export function renderViewer({ encryptedText, iv, salt, ttl }: ViewerOptions): string {
  const combinedCss = themes
    .map((t) => scopeThemeCss(t.css, t.name))
    .join("\n");

  const themeData = JSON.stringify(
    Object.fromEntries(
      themes.map((t) => [
        t.name,
        {
          headerBorder: t.headerBorder,
          footerBorder: t.footerBorder,
          titleText: t.titleText,
          timerLabel: t.timerLabel,
          inputLabel: t.inputLabel,
          buttonText: t.buttonText,
          destroyedText: t.destroyedText,
          expiredTitle: t.expiredTitle,
          expiredMessage: t.expiredMessage,
        },
      ])
    )
  );

  const themeOptions = themes
    .map(
      (t) =>
        `<option value="${t.name}"${t.name === "retro" ? ' selected' : ""}>${t.label}</option>`
    )
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One-Time Secret</title>
  <style>
${combinedCss}

    .input-section.dimmed {
      opacity: 0.4;
      pointer-events: none;
    }
  </style>
</head>
<body class="theme-retro"
  data-encrypted="${escapeAttr(encryptedText)}"
  data-iv="${escapeAttr(iv)}"
  data-salt="${escapeAttr(salt)}"
  data-ttl="${escapeAttr(String(ttl))}">

  <div class="theme-switcher">
    <select id="themeSwitcher" aria-label="Choose theme">
        ${themeOptions}
    </select>
  </div>

  <div class="container">
    <div class="header-border" id="headerBorder"></div>
    <div class="title" id="titleText"></div>

    <div class="timer" id="timer" aria-live="polite"></div>
    <div class="timer-label" id="timerLabel"></div>

    <div class="input-section" id="inputSection">
      <label class="input-label" id="inputLabel" for="passwordInput"></label>
      <input type="password" id="passwordInput" autocomplete="current-password" />
      <button class="btn" id="decryptBtn" type="button"></button>
    </div>

    <div class="error" id="errorMsg" style="display:none"></div>
    <div class="decrypted-text" id="decryptedText" style="display:none"></div>
    <div class="destroyed" id="destroyedMsg" style="display:none"></div>

    <div class="header-border" id="footerBorder"></div>
  </div>

  <script>
    (function () {
      var THEME_DATA = ${themeData};

      var body = document.body;
      var timerEl = document.getElementById('timer');
      var timerLabelEl = document.getElementById('timerLabel');
      var headerBorderEl = document.getElementById('headerBorder');
      var footerBorderEl = document.getElementById('footerBorder');
      var titleEl = document.getElementById('titleText');
      var inputLabelEl = document.getElementById('inputLabel');
      var decryptBtn = document.getElementById('decryptBtn');
      var passwordInput = document.getElementById('passwordInput');
      var errorMsg = document.getElementById('errorMsg');
      var decryptedText = document.getElementById('decryptedText');
      var destroyedMsg = document.getElementById('destroyedMsg');
      var inputSection = document.getElementById('inputSection');
      var themeSwitcher = document.getElementById('themeSwitcher');

      var encryptedData = body.getAttribute('data-encrypted');
      var ivData = body.getAttribute('data-iv');
      var saltData = body.getAttribute('data-salt');
      var ttlSeconds = parseInt(body.getAttribute('data-ttl'), 10);

      var currentTheme = 'retro';
      var destroyed = false;
      var endTime = Date.now() + ttlSeconds * 1000;
      var timerInterval = null;

      // --- Theme management ---
      function applyTheme(themeName) {
        var data = THEME_DATA[themeName];
        if (!data) return;

        // Swap body class
        var classes = body.className.split(' ').filter(function(c) { return !c.startsWith('theme-'); });
        classes.push('theme-' + themeName);
        body.className = classes.join(' ');

        currentTheme = themeName;
        localStorage.setItem('otp-theme', themeName);

        headerBorderEl.textContent = data.headerBorder;
        footerBorderEl.textContent = data.footerBorder;
        titleEl.textContent = data.titleText;
        timerLabelEl.textContent = data.timerLabel;
        inputLabelEl.textContent = data.inputLabel;
        decryptBtn.textContent = data.buttonText;

        if (destroyed) {
          destroyedMsg.textContent = data.destroyedText;
        }

        // Re-render timer with new theme format
        renderTimer();
      }

      function getSavedTheme() {
        try { return localStorage.getItem('otp-theme'); } catch(e) { return null; }
      }

      // --- Timer ---
      function pad2(n) {
        return n < 10 ? '0' + n : String(n);
      }

      function renderTimer() {
        var remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        var mins = Math.floor(remaining / 60);
        var secs = remaining % 60;

        if (currentTheme === 'modern') {
          timerEl.innerHTML =
            '<div class="timer-block"><span class="digits">' + pad2(mins) + '</span><span class="unit">min</span></div>' +
            '<span class="timer-separator">:</span>' +
            '<div class="timer-block"><span class="digits">' + pad2(secs) + '</span><span class="unit">sec</span></div>';
        } else {
          timerEl.textContent = pad2(mins) + ':' + pad2(secs);
        }

        if (remaining <= 0 && !destroyed) {
          onDestroyed();
        }
      }

      function onDestroyed() {
        destroyed = true;
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        var data = THEME_DATA[currentTheme];
        destroyedMsg.textContent = data.destroyedText;
        destroyedMsg.style.display = '';
        decryptBtn.disabled = true;
        inputSection.classList.add('dimmed');
      }

      // --- Base64 helpers ---
      function base64ToUint8Array(b64) {
        var binary = atob(b64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }

      // --- Decryption ---
      async function decryptMessage() {
        if (destroyed) return;

        var password = passwordInput.value;
        if (!password) {
          showError('Please enter a password.');
          return;
        }

        errorMsg.style.display = 'none';
        decryptBtn.disabled = true;
        decryptBtn.textContent = '...';

        try {
          var encryptedBytes = base64ToUint8Array(encryptedData);
          var ivBytes = base64ToUint8Array(ivData);
          var saltBytes = base64ToUint8Array(saltData);

          // Import password as PBKDF2 key material
          var passwordKey = await window.crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
          );

          // Derive AES-256-GCM key
          var aesKey = await window.crypto.subtle.deriveKey(
            {
              name: 'PBKDF2',
              salt: saltBytes,
              iterations: 100000,
              hash: 'SHA-256',
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
          );

          // encryptedBytes = ciphertext + 16-byte authTag (concatenated by Node crypto)
          // WebCrypto AES-GCM expects ciphertext+authTag concatenated — which is exactly what we have.
          var plainBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes },
            aesKey,
            encryptedBytes
          );

          var plaintext = new TextDecoder().decode(plainBuffer);
          decryptedText.textContent = plaintext;
          decryptedText.style.display = '';
          inputSection.style.display = 'none';
          errorMsg.style.display = 'none';
        } catch (err) {
          showError('Invalid decryption key.');
          decryptBtn.disabled = false;
          decryptBtn.textContent = THEME_DATA[currentTheme].buttonText;
        }
      }

      function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = '';
      }

      // --- Event listeners ---
      decryptBtn.addEventListener('click', decryptMessage);

      passwordInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          decryptMessage();
        }
      });

      themeSwitcher.addEventListener('change', function() {
        applyTheme(themeSwitcher.value);
      });

      // --- Init ---
      var savedTheme = getSavedTheme();
      var initialTheme = (savedTheme && THEME_DATA[savedTheme]) ? savedTheme : 'retro';
      themeSwitcher.value = initialTheme;
      applyTheme(initialTheme);

      // Start timer
      renderTimer();
      timerInterval = setInterval(renderTimer, 1000);
    })();
  </script>
</body>
</html>`;
}

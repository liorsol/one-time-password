import { retroTheme } from "./themes/retro";
import { tacticalTheme } from "./themes/tactical";
import { modernTheme } from "./themes/modern";
import { PASSWORD_CHARS, PBKDF2_ITERATIONS } from "../crypto-constants";
import {
  buildCombinedCss,
  buildThemeData,
  buildThemeOptions,
} from "./helpers";

const themes = [retroTheme, tacticalTheme, modernTheme];

const creatorThemeFields = [
  "headerBorder",
  "footerBorder",
  "titleText",
] as const;

export interface CreatorOptions {
  submitHandler: string;
}

export function renderCreator(options: CreatorOptions): string {
  const combinedCss = buildCombinedCss(themes);
  const themeData = buildThemeData(themes, [...creatorThemeFields]);
  const themeOptions = buildThemeOptions(themes);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One-Time Secret — Create</title>
  <style>
${combinedCss}

    textarea {
      width: 100%;
      min-height: 120px;
      box-sizing: border-box;
      resize: vertical;
      font-size: 1rem;
      line-height: 1.6;
    }
    /* Retro textarea */
    body.theme-retro textarea {
      background: #0a0a0a;
      border: 1px solid #33ff33;
      color: #33ff33;
      font-family: 'Courier New', Courier, monospace;
      padding: 10px;
      outline: none;
      box-shadow: 0 0 6px rgba(51, 255, 51, 0.3);
    }
    body.theme-retro textarea:focus {
      box-shadow: 0 0 10px rgba(51, 255, 51, 0.6);
    }
    /* Tactical textarea */
    body.theme-tactical textarea {
      background: rgba(255, 68, 68, 0.05);
      border: 1px solid #ff4444;
      color: #e0e0e0;
      font-family: 'Courier New', Courier, monospace;
      padding: 10px 12px;
      outline: none;
    }
    body.theme-tactical textarea:focus {
      border-color: #ff6b35;
      box-shadow: 0 0 8px rgba(255, 107, 53, 0.3);
    }
    /* Modern textarea */
    body.theme-modern textarea {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #e2e8f0;
      font-family: inherit;
      padding: 12px 14px;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    body.theme-modern textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .result-section {
      margin-top: 20px;
      text-align: left;
    }
    .result-field {
      margin: 12px 0;
    }
    .result-label {
      font-size: 0.8rem;
      letter-spacing: 1px;
      margin-bottom: 4px;
      opacity: 0.7;
    }
    .result-value {
      padding: 10px;
      word-break: break-all;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    body.theme-retro .result-value {
      background: rgba(51, 255, 51, 0.05);
      border: 1px solid #33ff33;
      color: #33ff33;
      font-family: 'Courier New', Courier, monospace;
    }
    body.theme-tactical .result-value {
      background: rgba(255, 107, 53, 0.05);
      border: 1px solid rgba(255, 107, 53, 0.4);
      color: #e0e0e0;
    }
    body.theme-modern .result-value {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 8px;
      color: #e2e8f0;
    }
    .result-value span { flex: 1; }
    .copy-btn {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
      color: inherit;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
    }
    .copy-btn:hover { background: rgba(255,255,255,0.15); }
    body.theme-retro .copy-btn { background: rgba(0,255,0,0.08); border-color: #1a8a1a; color: #33ff33; }
    body.theme-tactical .copy-btn { background: rgba(255,68,68,0.08); border-color: #ff4444; color: #ff4444; }
    body.theme-modern .copy-btn { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); color: #aaf; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .input-label { margin-bottom: 8px; }
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
    <div class="title" id="titleText"></div>

    <div id="createSection">
      <label class="input-label" id="inputLabel" for="secretText">Enter your secret</label>
      <textarea id="secretText" placeholder="Type or paste your secret here..."></textarea>
      <br><br>
      <button class="btn" id="createBtn" type="button">Create Secret Link</button>
    </div>

    <div class="error" id="errorMsg" style="display:none"></div>

    <div id="resultSection" class="result-section" style="display:none">
      <div class="result-field">
        <div class="result-label">Share this link:</div>
        <div class="result-value">
          <span id="resultUrl"></span>
          <button class="copy-btn" id="copyUrl" type="button" title="Copy URL">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="result-field">
        <div class="result-label">Password (send separately):</div>
        <div class="result-value">
          <span id="resultPassword"></span>
          <button class="copy-btn" id="copyPassword" type="button" title="Copy password">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="header-border" id="footerBorder"></div>
  </div>

  <script>
    (function () {
      var THEME_DATA = ${themeData};
      var PASSWORD_CHARS = ${JSON.stringify(PASSWORD_CHARS)};
      var PBKDF2_ITERATIONS = ${PBKDF2_ITERATIONS};

      var body = document.body;
      var headerBorderEl = document.getElementById('headerBorder');
      var footerBorderEl = document.getElementById('footerBorder');
      var titleEl = document.getElementById('titleText');
      var themeSwitcher = document.getElementById('themeSwitcher');
      var secretText = document.getElementById('secretText');
      var createBtn = document.getElementById('createBtn');
      var errorMsg = document.getElementById('errorMsg');
      var createSection = document.getElementById('createSection');
      var resultSection = document.getElementById('resultSection');
      var resultUrl = document.getElementById('resultUrl');
      var resultPassword = document.getElementById('resultPassword');
      var copyUrl = document.getElementById('copyUrl');
      var copyPassword = document.getElementById('copyPassword');

      // --- Theme management ---
      function applyTheme(themeName) {
        var data = THEME_DATA[themeName];
        if (!data) return;
        var classes = body.className.split(' ').filter(function(c) { return !c.startsWith('theme-'); });
        classes.push('theme-' + themeName);
        body.className = classes.join(' ');
        localStorage.setItem('otp-theme', themeName);
        headerBorderEl.textContent = data.headerBorder;
        footerBorderEl.textContent = data.footerBorder;
        titleEl.textContent = data.titleText;
      }

      function getSavedTheme() {
        try { return localStorage.getItem('otp-theme'); } catch(e) { return null; }
      }

      // --- Crypto helpers ---
      function generatePassword() {
        var arr = new Uint8Array(1);
        window.crypto.getRandomValues(arr);
        var len = 8 + (arr[0] % 7); // 8-14
        var result = '';
        var randBytes = new Uint8Array(len);
        window.crypto.getRandomValues(randBytes);
        for (var i = 0; i < len; i++) {
          result += PASSWORD_CHARS[randBytes[i] % PASSWORD_CHARS.length];
        }
        return result;
      }

      function uint8ArrayToBase64(bytes) {
        var binary = '';
        for (var i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }

      async function encryptText(plaintext, password) {
        var enc = new TextEncoder();
        var salt = window.crypto.getRandomValues(new Uint8Array(16));
        var iv = window.crypto.getRandomValues(new Uint8Array(12));

        var passwordKey = await window.crypto.subtle.importKey(
          'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
        );

        var aesKey = await window.crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
          passwordKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );

        var cipherBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv: iv },
          aesKey,
          enc.encode(plaintext)
        );

        return {
          encryptedText: uint8ArrayToBase64(new Uint8Array(cipherBuffer)),
          iv: uint8ArrayToBase64(iv),
          salt: uint8ArrayToBase64(salt)
        };
      }

      // --- Copy helper ---
      function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(function() {
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
          setTimeout(function() {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
          }, 1500);
        });
      }

      // --- Result handlers ---
      function onSuccess(result) {
        resultUrl.textContent = result.url;
        resultPassword.textContent = password;
        createSection.style.display = 'none';
        resultSection.style.display = '';
      }

      function onFailure(msg) {
        errorMsg.textContent = 'Failed to save: ' + msg;
        errorMsg.style.display = '';
        createBtn.disabled = false;
        createBtn.textContent = 'Create Secret Link';
      }

      var password;

      // --- Create flow ---
      createBtn.addEventListener('click', async function() {
        var text = secretText.value.trim();
        if (!text) {
          errorMsg.textContent = 'Please enter a secret.';
          errorMsg.style.display = '';
          return;
        }

        errorMsg.style.display = 'none';
        createBtn.disabled = true;
        createBtn.innerHTML = '<span class="spinner"></span>Encrypting...';

        try {
          password = generatePassword();
          var encrypted = await encryptText(text, password);

          ${options.submitHandler}
        } catch (err) {
          errorMsg.textContent = 'Encryption failed: ' + (err.message || err);
          errorMsg.style.display = '';
          createBtn.disabled = false;
          createBtn.textContent = 'Create Secret Link';
        }
      });

      copyUrl.addEventListener('click', function() { copyToClipboard(resultUrl.textContent, copyUrl); });
      copyPassword.addEventListener('click', function() { copyToClipboard(resultPassword.textContent, copyPassword); });

      themeSwitcher.addEventListener('change', function() {
        applyTheme(themeSwitcher.value);
      });

      // --- Init ---
      var savedTheme = getSavedTheme();
      var initialTheme = (savedTheme && THEME_DATA[savedTheme]) ? savedTheme : 'retro';
      themeSwitcher.value = initialTheme;
      applyTheme(initialTheme);
    })();
  </script>
</body>
</html>`;
}

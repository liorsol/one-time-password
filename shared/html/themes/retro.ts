import { Theme } from "../../types";

export const retroTheme: Theme = {
  name: "retro",
  label: "Retro",
  css: `
body {
  background: #0a0a0a;
  color: #33ff33;
  font-family: 'Courier New', Courier, monospace;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15) 0px,
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 9999;
}

.container {
  max-width: 600px;
  width: 90%;
  padding: 30px 20px;
  text-align: center;
}

.header-border {
  color: #33ff33;
  text-shadow: 0 0 8px #33ff33;
  font-size: 1rem;
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
}

.title {
  color: #33ff33;
  text-shadow: 0 0 10px #33ff33, 0 0 20px #33ff33;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 10px 0;
}

.timer {
  color: #33ff33;
  text-shadow: 0 0 8px #33ff33;
  font-size: 2rem;
  font-weight: bold;
  margin: 15px 0 5px;
  letter-spacing: 4px;
}

.timer-label {
  color: #33ff33;
  text-shadow: 0 0 6px #33ff33;
  font-size: 0.75rem;
  letter-spacing: 2px;
  margin-bottom: 20px;
}

.input-label {
  color: #33ff33;
  text-shadow: 0 0 6px #33ff33;
  font-size: 0.9rem;
  margin-bottom: 8px;
  display: block;
  text-align: left;
}

input[type="password"] {
  background: #0a0a0a;
  border: 1px solid #33ff33;
  color: #33ff33;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  margin-bottom: 10px;
  box-shadow: 0 0 6px rgba(51, 255, 51, 0.3);
}

input[type="password"]:focus {
  box-shadow: 0 0 10px rgba(51, 255, 51, 0.6);
}

.btn {
  background: transparent;
  border: 2px solid #33ff33;
  color: #33ff33;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  padding: 10px 30px;
  cursor: pointer;
  letter-spacing: 2px;
  text-shadow: 0 0 6px #33ff33;
  box-shadow: 0 0 8px rgba(51, 255, 51, 0.3);
  transition: all 0.2s;
}

.btn:hover {
  background: rgba(51, 255, 51, 0.1);
  box-shadow: 0 0 16px rgba(51, 255, 51, 0.6);
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  box-shadow: none;
}

.error {
  color: #ff4444;
  text-shadow: 0 0 6px #ff4444;
  font-size: 0.85rem;
  margin-top: 10px;
}

.decrypted-text {
  color: #33ff33;
  text-shadow: 0 0 4px #33ff33;
  background: rgba(51, 255, 51, 0.05);
  border: 1px solid #33ff33;
  padding: 20px;
  margin-top: 20px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 1rem;
  line-height: 1.6;
}

.destroyed {
  color: #ff4444;
  text-shadow: 0 0 10px #ff4444;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 3px;
  margin: 20px 0;
}

.theme-switcher {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 10000;
}

.theme-switcher select {
  background: #0a0a0a;
  color: #33ff33;
  border: 1px solid #33ff33;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.75rem;
  padding: 4px 8px;
  cursor: pointer;
  outline: none;
}
`,
  headerBorder: "╔══════════════════════════════╗",
  footerBorder: "╚══════════════════════════════╝",
  titleText: "INCOMING TRANSMISSION",
  timerLabel: "SELF-DESTRUCT COUNTDOWN",
  inputLabel: "> ENTER PASSKEY_",
  buttonText: "[ DECODE ]",
  destroyedText: "TRANSMISSION TERMINATED",
  expiredTitle: "NO SIGNAL",
  expiredMessage: "This transmission has expired or was already destroyed.",
};

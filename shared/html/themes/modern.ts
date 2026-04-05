import { Theme } from "../../types";

export const modernTheme: Theme = {
  name: "modern",
  label: "Modern",
  css: `
body {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 560px;
  width: 90%;
  padding: 40px 35px;
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}

.header-border {
  color: #8b5cf6;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.title {
  color: #e2e8f0;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0 0 25px;
  line-height: 1.5;
}

.timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 30px;
  flex-wrap: wrap;
}

.timer-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  min-width: 64px;
}

.timer-block .digits {
  color: #6366f1;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.timer-block .unit {
  color: #8b5cf6;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
}

.timer-separator {
  color: #6366f1;
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1;
  align-self: flex-start;
  padding-top: 10px;
}

.timer-label {
  display: none;
}

.input-label {
  color: #94a3b8;
  font-size: 0.875rem;
  margin-bottom: 8px;
  display: block;
  text-align: left;
}

input[type="password"] {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #e2e8f0;
  font-family: inherit;
  font-size: 1rem;
  padding: 12px 14px;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  outline: none;
  margin-bottom: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input[type="password"]:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: #ffffff;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 32px;
  cursor: pointer;
  border-radius: 8px;
  letter-spacing: 0.5px;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  color: #f87171;
  font-size: 0.875rem;
  margin-top: 10px;
}

.decrypted-text {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.95rem;
  line-height: 1.7;
}

.destroyed {
  color: #f87171;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 20px 0;
}

.theme-switcher {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 10000;
}

.theme-switcher select {
  background: rgba(15, 15, 35, 0.9);
  color: #8b5cf6;
  border: 1px solid rgba(99, 102, 241, 0.4);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 4px 8px;
  cursor: pointer;
  outline: none;
  border-radius: 6px;
}
`,
  headerBorder: "One-Time Secret",
  footerBorder: "",
  titleText: "This message will destruct itself in",
  timerLabel: "",
  inputLabel: "Enter password to decrypt",
  buttonText: "Decrypt Message",
  destroyedText: "Message expired",
  expiredTitle: "Link Expired",
  expiredMessage: "This secret has expired or was already viewed.",
};

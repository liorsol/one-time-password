import { Theme } from "../../types";

export const tacticalTheme: Theme = {
  name: "tactical",
  label: "Tactical",
  css: `
body {
  background: #1a1a2e;
  color: #e0e0e0;
  font-family: 'Courier New', Courier, monospace;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 620px;
  width: 90%;
  padding: 30px 25px;
  text-align: center;
  border: 2px solid #ff4444;
  box-shadow: 0 0 20px rgba(255, 68, 68, 0.2), inset 0 0 20px rgba(255, 68, 68, 0.05);
  position: relative;
}

.container::before {
  content: 'CLASSIFIED';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4444;
  color: #1a1a2e;
  font-size: 0.65rem;
  font-weight: bold;
  letter-spacing: 3px;
  padding: 2px 12px;
}

.header-border {
  color: #ff4444;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 3px;
  margin-bottom: 15px;
  margin-top: 10px;
}

.title {
  color: #ff6b35;
  font-size: 1.1rem;
  font-weight: bold;
  letter-spacing: 2px;
  margin: 10px 0;
  text-transform: uppercase;
}

.timer {
  color: #ff4444;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 15px 0 5px;
  letter-spacing: 6px;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  color: #ff6b35;
  font-size: 0.7rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 25px;
}

.input-section {
  border: 1px solid rgba(255, 68, 68, 0.3);
  padding: 15px;
  margin: 20px 0;
  background: rgba(255, 68, 68, 0.03);
}

.input-label {
  color: #ff6b35;
  font-size: 0.8rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: block;
  text-align: left;
}

input[type="password"] {
  background: rgba(255, 68, 68, 0.05);
  border: 1px solid #ff4444;
  color: #e0e0e0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  padding: 10px 12px;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  margin-bottom: 12px;
}

input[type="password"]:focus {
  border-color: #ff6b35;
  box-shadow: 0 0 8px rgba(255, 107, 53, 0.3);
}

.btn {
  background: #ff4444;
  border: none;
  color: #1a1a2e;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
  font-weight: bold;
  padding: 12px 35px;
  cursor: pointer;
  letter-spacing: 3px;
  text-transform: uppercase;
  transition: all 0.2s;
}

.btn:hover {
  background: #ff6b35;
}

.btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.error {
  color: #ff4444;
  font-size: 0.85rem;
  margin-top: 10px;
  letter-spacing: 1px;
}

.decrypted-text {
  color: #e0e0e0;
  background: rgba(255, 107, 53, 0.05);
  border: 1px solid rgba(255, 107, 53, 0.4);
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
  font-size: 1.3rem;
  font-weight: bold;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 20px 0;
}

.theme-switcher {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 10000;
}

.theme-switcher select {
  background: #1a1a2e;
  color: #ff4444;
  border: 1px solid #ff4444;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.75rem;
  padding: 4px 8px;
  cursor: pointer;
  outline: none;
}
`,
  headerBorder: "\u26A0 CLASSIFIED",
  footerBorder: "",
  titleText: "THIS MESSAGE WILL SELF-DESTRUCT",
  timerLabel: "UNTIL DESTRUCTION",
  inputLabel: "ENTER DECRYPTION KEY",
  buttonText: "DECRYPT",
  destroyedText: "DESTROYED",
  expiredTitle: "ACCESS DENIED",
  expiredMessage: "This transmission has expired or was already destroyed.",
};

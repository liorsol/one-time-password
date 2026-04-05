export interface Theme {
  name: string;
  label: string;
  css: string;
  headerBorder: string;
  footerBorder: string;
  titleText: string;
  timerLabel: string;
  inputLabel: string;
  buttonText: string;
  destroyedText: string;
  expiredTitle: string;
  expiredMessage: string;
}

export interface ViewerOptions {
  encryptedText: string;
  iv: string;
  salt: string;
  ttl: number;
}

export interface EncryptResult {
  encryptedText: string; // base64
  iv: string; // base64
  salt: string; // base64
}

export interface SecretRecord {
  pk: string;
  encryptedText: string;
  iv: string;
  salt: string;
  viewed: boolean;
  createdAt: number;
  ttl: number;
}

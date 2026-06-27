import CryptoJS from "crypto-js";

export function encryptMessage(plainText: string, password: string): string {
  return CryptoJS.AES.encrypt(plainText, password).toString();
}

export function decryptMessage(cipherText: string, password: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, password);
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    return plainText.length > 0 ? plainText : null;
  } catch {
    return null;
  }
}

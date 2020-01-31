import * as crypto from "crypto";

import config from "../config";
import { User } from "../entity/User";

export function generateQr(user: User) {
  const iv = crypto.randomBytes(8).toString("hex");
  const cipher = crypto.createCipheriv("aes256", config.qrKey, iv);
  const userString = JSON.stringify({
    id: user.id,
    username: user.username,
  });
  let cipherText = cipher.update(userString, "utf8", "hex");
  cipherText += cipher.final("hex");

  return `${iv}${cipherText}`;
}

export function decodeQr(encryptedText: string) {
  try {
    const iv = encryptedText.substring(0, 16);
    const code = encryptedText.substring(16);
    const decipher = crypto.createDecipheriv("aes256", config.qrKey, iv);
    let plain = decipher.update(code, "hex", "utf8");
    plain += decipher.final("utf8");

    return plain;
  } catch (error) {
    return "error";
  }
}

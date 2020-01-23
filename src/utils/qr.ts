import * as crypto from "crypto";

import config from "../config";
import { User } from "../entity/User";

export function generateQr(user: User) {
  const cipher = crypto.createCipheriv("aes-256-cbc", config.secret, null);
  const userString = JSON.stringify({
    id: user.id,
    username: user.username,
  });
  let cipherText = cipher.update(userString, "utf8", "hex");
  cipherText += cipher.final("hex");

  return cipherText;
}

export function decodeQr(code: string) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", config.secret, null);
  let plain = decipher.update(code, "hex", "utf8");
  plain += decipher.final("utf8");

  return plain;
}

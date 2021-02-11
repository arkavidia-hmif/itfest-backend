import { createTransport } from "nodemailer";

export const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: !!process.env.SMTP_SECURE,
  pool: true,
  name: process.env.SMTP_NAME,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

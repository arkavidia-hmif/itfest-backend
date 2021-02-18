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


export async function sendEmail(target: string, subject: string, body: string, text: string): Promise<void> {
  const html = `
    <html>
    <head>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
        </style>
    </head>
    <body style="font-family: Roboto,sans-serif; line-height: 2; background-color: #eee; width: 100%; padding: 20px; margin: 0;">
        ${body}
    </body>
  `;


  const mailOptions = {
    from: "\"Arkavidia\" <no-reply@arkavidia.id>", // sender address
    to: target, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html // html body
  };

  await transporter.sendMail(mailOptions);
}
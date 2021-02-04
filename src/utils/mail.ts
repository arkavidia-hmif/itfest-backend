import { createTransport, createTestAccount, getTestMessageUrl } from "nodemailer";

export const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: !!process.env.SMTP_SECURE,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const transporterTest = async () => {
  const testAccount = await createTestAccount();

  return createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

export const sendEmail = (target: string, subject: string, body: string, text: string) => {
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
    from: '"Arkavidia" <no-reply@arkavidia.com>', // sender address
    to: target, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html // html body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      throw error;
    }

    console.log('Message sent: %s', info.messageId);   
    console.log('Preview URL: %s', getTestMessageUrl(info));
  });
};

export const resetPasswordBodyGenerator = (name: string, token: string) => {
  return `
    <table style="margin: auto; width: 100%; background-color: #FFF; padding: 20px; max-width: 500px;">
      <tr><td style="text-align: center"><img src="https://arkavidia.nyc3.digitaloceanspaces.com/logo-arkavidia.png" height="100"></td></tr>
      <tr><td style="text-align: center">Halo, ${name}! </td></tr>
      <tr><td style="text-align: center">Untuk mereset password Anda, masukkan token [ <strong> ${token} </strong> ] ke halaman yang memintanya.</td></tr>

      <tr><td style="text-align: center">Jika Anda tidak ingin mengganti password, tidak ada yang perlu Anda lakukan.</td></tr>
      <tr><td style="text-align: center">Password Anda tidak akan berubah sampai Anda menggunakan token di atas dan mengganti dengan password yang baru.</td></tr>
    </table>
  `;
};

export const verifyAccountBodyGenerator = (name: string, token: string) => {
  return `
  <table style="margin: auto; width: 100%; background-color: #FFF; padding: 20px; max-width: 500px;">
    <tr><td style="text-align: center"><img src="https://arkavidia.nyc3.digitaloceanspaces.com/logo-arkavidia.png" height="100"></td></tr>
    <tr><td style="text-align: center">Halo, ${name}! </td></tr>
    <tr><td style="text-align: center">Untuk menkonfirmasi akun anda, masukkan token [ <strong> ${token} </strong> ] ke halaman yang memintanya.</td></tr>

    <tr><td style="text-align: center">Jika Anda tidak meminta email ini, tidak ada yang perlu Anda lakukan.</td></tr>
    <tr><td style="text-align: center">Terimakasih sudah mendaftarkan diri ke event ITFest dari Arkavidia!</td></tr>
  </table>
  `;
};

export const sendResetPasswordEmail = (name: string, email: string, token: string) => {
  const htmlBody = resetPasswordBodyGenerator(name, token);
        
  const textBody = `TOKEN: ${token}`;

  sendEmail(email, "Reset Password - ITFest Arkavidia", htmlBody, textBody);

};

export const sendVerifyAccountEmail = async (name: string, email: string, token: string) => {
  const htmlBody = verifyAccountBodyGenerator(name, token);
  
  const textBody = `TOKEN: ${token}`;

  sendEmail(email, "Confirm Email - ITFest Arkavidia", htmlBody, textBody);

};

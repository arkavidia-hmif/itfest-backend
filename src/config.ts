export default {
  password: {
    checkRegex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{0,}$/,
    saltRounds: 10,
  },
  secret: "secret-key",
  qrKey: "ini_secret_untuk_enkripsi_qrcode",
  tenantInitial: 100000,
};

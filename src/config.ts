export default {
  password: {
    // checkRegex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{0,}$/,
    checkRegex: /.*/,
    checkMessage: "must contain something",
    minLength: 8,
    saltRounds: 10,
  },
  secret: process.env.SECRET || "secret-key",
  qrKey: process.env.QRKEY || "ini_secret_untuk_enkripsi_qrcode",
  tenantInitial: 100000,
  gamePoint: {
    1: 50,
    2: 100,
    3: 200,
  },
  userFillBonus: 20
};

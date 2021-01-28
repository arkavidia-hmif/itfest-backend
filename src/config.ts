export default {
  password: {
    // checkRegex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{0,}$/,
    checkRegex: /.*/,
    checkMessage: "must contain something",
    minLength: 8,
    saltRounds: 10,
  },
  useVoucher: false,
  secret: process.env.SECRET || "secret-key",
  qrKey: process.env.QRKEY || "ini_secret_untuk_enkripsi_qrcode",
  scoreboardSecret: process.env.SCOREBOARD_SECRET || "secret-key",
  tenantInitial: 100000,
  gamePoint: {
    1: 25,
    2: 50,
    3: 75,
  },
  maxScore: 20,
  userFillBonusField: ["dob", "gender", "institute"],
  userFillBonus: 15
};

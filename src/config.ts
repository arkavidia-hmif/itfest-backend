export default {
  password: {
    checkRegex: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{0,}$/,
    saltRounds: 10,
  },
  secret: "secret-key",
  tenantInitial: 100000,
};

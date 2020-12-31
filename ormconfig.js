function getConfig() {
  let config = {
    "synchronize": true,
    "logging": false,
    "entities": [
      "src/entity/**/*.ts"
    ],
    "migrations": [
      "src/migration/**/*.ts"
    ],
    "subscribers": [
      "src/subscriber/**/*.ts"
    ],
    "seeds": [
      'src/seed/**/*{.ts,.js}'
    ],
    "factories": [
      'src/factory/**/*{.ts,.js}'
    ],
    "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
    }
  }

  // if (process.env.DB_URL) {
  //   return {
  //     "type": process.env.DB_TYPE,
  //     "database": process.env.DB_NAME,
  //     "url": process.env.DB_URL,
  //     ...config
  //   }
  // } else {
  //   console.error("Please specify database (check Readme)");
  //   process.exit(1);
  // }

  return {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    // "username": "debian-sys-maint",
    // "password": "DAoicYZ8uK582Zjg",
    "username": "root",
    "password": "root",
    "database": "itfest2",
    "insecureAuth" : true,
    ...config
  }
}

module.exports = getConfig();


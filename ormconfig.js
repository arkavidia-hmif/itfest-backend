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
    "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
    }
  }
  return {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "root",
    "database": "itfest",
    "insecureAuth" : true,
    ...config
  }
  if (process.env.DB_URL) {
    return {
      "type": process.env.DB_TYPE,
      "database": process.env.DB_NAME,
      "url": process.env.DB_URL,
      ...config
    }
  } else {
    console.error("Please specify database (check Readme)");
    process.exit(1);
  }
}

module.exports = getConfig();


/* eslint-disable no-console */
function getConfig() {
  let config = {
    "synchronize": false,
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
  };

  return {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "password": "root",
    "database": "itfest",
    ...config
  };

  if (process.env.DB_URL) {
    return {
      "type": "postgres",
      "database": process.env.DB_NAME,
      "url": process.env.DB_URL,
      ...config
    };
  } else {
    console.error("Please specify database (check Readme)");
    process.exit(1);
  }
}

module.exports = getConfig();


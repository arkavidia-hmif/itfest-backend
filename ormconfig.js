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
  if (process.env.DB_URL) {
    return {
      "type": process.env.DB_TYPE,
      "database": process.env.DB_NAME,
      "url": process.env.DB_URL,
      ...config
    }
  } else {
    return {
      "type": "sqlite",
      "database": "database.sqlite",
      ...config
    }
  }
}

module.exports = getConfig();


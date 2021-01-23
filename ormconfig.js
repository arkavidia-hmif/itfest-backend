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
      "src/seed/**/*{.ts,.js}"
    ],
    "factories": [
      "src/factory/**/*{.ts,.js}"
    ],
    "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
    }
  };

  if (process.env.DB_URL) {
    return {
      "type": "postgres",
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


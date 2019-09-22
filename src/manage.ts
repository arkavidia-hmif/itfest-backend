import { createConnection } from "typeorm";
import { UserRole } from "./entity/User";
import { UserController } from "./controller/UserController";

const argv = process.argv;
const argc = argv.length;
const readline = require('readline-sync');

// console.log(argv);

async function printHelp() {
  console.log('Avaiable command');
  console.log('createadmin   - Create admin');
}

async function createAdmin() {
  const name = readline.question('Name : ');
  const username = readline.question('Username : ');
  const password = readline.questionNewPassword('Password : ');

  const connection = await createConnection();

  try {
    const controller = new UserController();

    await controller.createUser(name, username, null, UserRole.ADMIN, password);

    console.log(`Successfully created ${username}(${name})`);
  } catch (error) {
    console.error(error);
  }

  connection.close();
}

if (argc > 2) {
  switch (argv[2]) {
    case 'createadmin':
      createAdmin();
      break;
    case 'help':
      printHelp();
      break;
  }
} else {
  console.log('Invalid param');
}
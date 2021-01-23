/* eslint-disable no-console */
import { createConnection } from "typeorm";
import { UserRole } from "./entity/User";
import { UserController } from "./controller/UserController";
import * as readline from "readline-sync";

const argv = process.argv;
const argc = argv.length;

// console.log(argv);

async function printHelp() {
  console.log("Avaiable command");
  console.log("createadmin   - Create admin");
  console.log("voucher - Generate voucher");
}

async function createAdmin() {
  const name = readline.question("Name : ");
  const username = readline.question("Username : ");
  const password = readline.questionNewPassword("Password : ");

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

async function generateVoucher() {
  const qty = readline.questionInt("Qty : ");

  if (qty < 0) {
    console.error("Please enter positive qty");
    process.exit(1);
  }

  const connection = await createConnection();

  try {
    const controller = new UserController();

    const codeResult = await controller.generateVoucher(qty);

    console.log(`Successfully created ${qty} vouchers`);
    console.log("Generated voucher codes: ");

    codeResult.map((data) => {
      console.log(data);
    });
  } catch (error) {
    console.error(error);
  }

  connection.close();
}

if (argc > 2) {
  switch (argv[2]) {
    case "createadmin":
      createAdmin();
      break;
    case "voucher":
      generateVoucher();
      break;
    case "help":
      printHelp();
      break;
  }
} else {
  console.log("Invalid param, run help for avaiable commands");
}
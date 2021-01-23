import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

import { UserRole, User } from "../entity/User";
import config from "../config";

const aSalt = bcrypt.genSaltSync(config.password.saltRounds);
const password = "12345678";
const aEncryptedHash = bcrypt.hashSync(password, aSalt);

export const UserSeed = [
  {
    role: UserRole.TENANT,
    salt: aSalt,
    password: aEncryptedHash,
    username: "tenant2",
    name: "tenant2",
    email: "t2@g.com",
    id: 1
  },
  {
    role: UserRole.TENANT,
    salt: aSalt,
    password: aEncryptedHash,
    username: "tenant",
    name: "tenant",
    email: "t@g.com",
    id: 2
  },
  {
    role: UserRole.VISITOR,
    salt: aSalt,
    password: aEncryptedHash,
    username: "visitor",
    name: "visitor",
    email: "v@g.com",
    id: 3
  },
  {
    role: UserRole.VISITOR,
    salt: aSalt,
    password: aEncryptedHash,
    username: "visitor2",
    name: "visitor2",
    email: "v2@g.com",
    id: 4
  },
  {
    role: UserRole.VISITOR,
    salt: aSalt,
    password: aEncryptedHash,
    username: "visitor3",
    name: "visitor3",
    email: "v3@g.com",
    id: 5
  },
  {
    role: UserRole.ADMIN,
    salt: aSalt,
    password: aEncryptedHash,
    username: "admin",
    name: "admin",
    email: "a@g.com",
    id: 6
  }
];
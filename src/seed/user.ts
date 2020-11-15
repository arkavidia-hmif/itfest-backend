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
        username: "tenant",
        name: "tenant",
        email: "t@g.com",
    },
    {
        role: UserRole.VISITOR,
        salt: aSalt,
        password: aEncryptedHash,
        username: "visitor",
        name: "visitor",
        email: "v@g.com",
    },
    {
        role: UserRole.ADMIN,
        salt: aSalt,
        password: aEncryptedHash,
        username: "admin",
        name: "admin",
        email: "a@g.com",
    }
];
import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { User, UserRole } from "../entity/User";
import * as  bcrypt from "bcrypt";

import config from "../config";

export class UserController {

  private userRepository = getRepository(User);

  async createUser(name: string, username: string, email: string, role: UserRole, password: string) {
    const salt = bcrypt.genSaltSync(config.password.saltRounds);

    const encryptedHash = bcrypt.hashSync(password, salt);

    await this.userRepository.save({
      name,
      username,
      role,
      email,
      salt,
      password: encryptedHash,
    });
  }

  async login(request: Request, response: Response, next: NextFunction) {
    const { username, email, password, pin } = request.body;

    const userByUsername = await this.userRepository.findOne({
      username
    });

    const userByEmail = await this.userRepository.findOne({
      email
    });

    const user = userByEmail || userByUsername;

    if (!user) {
      return response.status(404).json({
        status: 404,
        code: "user-not-found"
      });
    }

    if (bcrypt.compareSync(password, user.password)) {
      return response.status(200).json({
        status: 200,
        code: "ok",
        data: {
          jwt: ""
        }
      });
    } else {
      return response.status(401).json({
        status: 401,
        code: "invalid-auth"
      });
    }
  }
}
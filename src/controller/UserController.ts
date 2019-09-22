import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { User, UserRole } from "../entity/User";
import * as  bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

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

  async getUser(request: Request, response: Response) {
    const user = await this.userRepository.findOne(request.params.id)
    if (user) {
      return response.json({
        status: 200,
        code: "ok",
        data: user
      });
    } else {
      return response.status(404).json({
        status: 404,
        code: "user-not-found"
      });
    }
  }

  async getMe(request: Request, response: Response) {
    const user = await this.userRepository.findOne(response.locals.auth.id)
    if (user) {
      return response.json({
        status: 200,
        code: "ok",
        data: user
      });
    } else {
      return response.status(404).json({
        status: 404,
        code: "user-not-found"
      });
    }
  }

  async login(request: Request, response: Response) {
    const { username, email, password } = request.body;

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
      const token = jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }, config.jwt.secret)
      return response.status(200).json({
        status: 200,
        code: "ok",
        data: {
          jwt: token
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
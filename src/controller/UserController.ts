import * as  bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

import { NextFunction, Request, Response } from "express";
import { Tenant, User, UserRole, Visitor } from "../entity/User";

import { TransactionController } from "./TransactionController";
import config from "../config";
import { getRepository } from "typeorm";
import { responseGenerator } from "../utils/responseGenerator";

export class UserController {

  private userRepository = getRepository(User);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private tc = new TransactionController();

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
    const user = await this.userRepository.findOne(request.params.id);

    if (user) {
      let additionalData = {};
      if (user.role === UserRole.VISITOR) {
        additionalData = await this.visitorRepository.findOne(user.id);
      } else if (user.role === UserRole.TENANT) {
        additionalData = await this.tenantRepository.findOne(user.id);
      }

      return responseGenerator(response, 200, "ok", { ...user, ...additionalData });
    } else {
      return responseGenerator(response, 404, "user-not-found");
    }
  }

  async getMe(request: Request, response: Response) {
    request.params.id = response.locals.auth.id;
    return this.getUser(request, response);
  }

  async getTransaction(request: Request, response: Response) {
    const userId = request.params.id;
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 10;

    const [transactions, totalItem] = await this.tc.getTransaction([{ from: userId }, { to: userId }])

    return responseGenerator(response, 200, "ok", {
      array: transactions,
      page,
      itemPerPage,
      totalItem
    });
  }

  async getMeTransaction(request: Request, response: Response) {
    request.params.id = response.locals.auth.id;
    return this.getTransaction(request, response);
  }


  async login(request: Request, response: Response) {
    const { username, email, password } = request.body;

    const userByUsername = await this.userRepository.findOne({
      username
    }, { select: ["id", "username", "email", "role", "password"] });

    const userByEmail = await this.userRepository.findOne({
      email
    }, { select: ["id", "username", "email", "role", "password"] });

    const user = userByEmail || userByUsername;

    if (!user) {
      return responseGenerator(response, 404, "user-not-found");
    }

    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      }, config.jwt.secret)

      return responseGenerator(response, 200, "ok", {
        jwt: token
      });
    } else {
      return responseGenerator(response, 401, "invalid-auth");
    }
  }

  async register(request: Request, response: Response) {

  }

  async registerVisitor(request: Request, response: Response) {
    const password: string = request.body.password;
    const email: string = request.body.email;
    const username: string = email.substring(0, email.indexOf('@'));

    delete request.body.password;

    let name = request.body.name;

    if (!name) {
      name = email;
    } else {
      delete request.body.name;
    }

    const salt = bcrypt.genSaltSync(config.password.saltRounds);

    const encryptedHash = bcrypt.hashSync(password, salt);

    try {
      await this.userRepository.save({
        role: UserRole.VISITOR,
        salt,
        password: encryptedHash,
        username,
        name,
        ...request.body
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return responseGenerator(response, 400, "user-exists");
      } else {
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }

    return responseGenerator(response, 200, "ok");
  }
}
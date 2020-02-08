import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import * as Mustache from "mustache";
import { getConnection, getRepository } from "typeorm";

import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Voucher } from "../entity/Voucher";
import { transporter } from "../utils/mail";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { decodeQr, generateQr } from "../utils/qr";
import { responseGenerator } from "../utils/responseGenerator";
import { TransactionController } from "./TransactionController";
import { readFileSync } from "fs";
import { join } from "path";

export class UserController {

  private userRepository = getRepository(User);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private voucherRepository = getRepository(Voucher);
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

  async generateVoucher(qty: number) {

    const promiseArr = [];
    const codeList = [];

    for (let i = 0; i < qty; i++) {
      const code = crypto.randomBytes(3).toString("hex");
      promiseArr.push(this.voucherRepository.save({
        code
      }));
      codeList.push(code);
    }

    await Promise.all(promiseArr);

    return codeList;
  }

  async listUser(request: Request, response: Response) {
    const page = parseInt(request.query.page, 10) || 1;
    const itemPerPage = parseInt(request.query.itemPerPage, 10) || 100;

    const type = request.params.type;

    let array = null;
    let total = null;

    if (type === UserRole.TENANT) {
      [array, total] = await this.tenantRepository.findAndCount({
        take: itemPerPage,
        skip: (page - 1) * itemPerPage,
        relations: ["userId"]
      });
    } else if (type === UserRole.VISITOR) {
      [array, total] = await this.visitorRepository.findAndCount({
        take: itemPerPage,
        skip: (page - 1) * itemPerPage,
        relations: ["userId"]
      });
    } else {
      [array, total] = await this.userRepository.findAndCount({
        take: itemPerPage,
        skip: (page - 1) * itemPerPage
      });
    }

    array = array.map((entry) => {
      if (entry.userId) {
        const userData = entry.userId;
        delete entry.userId;
        return {
          ...userData,
          ...entry
        };
      } else {
        return entry;
      }
    });

    return responseGenerator(response, 200, "ok", {
      array,
      page,
      itemPerPage,
      total
    });
  }

  async getUser(request: Request, response: Response) {
    const user = await this.userRepository.findOne(request.params.id);

    if (user) {
      let additionalData = {};
      if (user.role === UserRole.VISITOR) {
        additionalData = await this.visitorRepository.findOne({ where: { userId: user.id } });
      } else if (user.role === UserRole.TENANT) {
        additionalData = await this.tenantRepository.findOne({ where: { userId: user.id } });
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

    const [transactions, totalItem] = await this.tc.getTransaction([{ from: userId }, { to: userId }], page, itemPerPage);

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
      }, config.secret)

      return responseGenerator(response, 200, "ok", {
        jwt: token
      });
    } else {
      return responseGenerator(response, 401, "invalid-auth");
    }
  }

  async registerTenant(request: Request, response: Response) {
    const { email, username, password, point } = request.body;
    // const username: string = request.body.uemail.substring(0, email.indexOf("@"));

    const name = request.body.name || username;

    delete request.body.password;

    const salt = bcrypt.genSaltSync(config.password.saltRounds);

    const encryptedHash = bcrypt.hashSync(password, salt);

    let token = "";

    try {
      await getConnection().transaction(async transactionManager => {
        const tmUserRepository = transactionManager.getRepository(User);
        const tmTenantRepository = transactionManager.getRepository(Tenant);

        if (await tmUserRepository.findOne({
          where: {
            username: username
          }
        })) {
          throw "user-exists";
        };

        const savedUser = await tmUserRepository.save({
          role: UserRole.TENANT,
          salt,
          password: encryptedHash,
          username,
          name,
          email,
        });

        await tmTenantRepository.save({
          userId: savedUser,
          point: point || config.tenantInitial
        });

        token = jwt.sign({
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
        }, config.secret)
      })
    } catch (err) {
      if (err === "user-exists" || err.code === "ER_DUP_ENTRY") {
        return responseGenerator(response, 400, "user-exists");
      } else if (err.code === "ESOCKET") {
        return responseGenerator(response, 500, "email-error");
      } else {
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }


    return responseGenerator(response, 200, "ok", {
      jwt: token
    });
  }

  async registerVisitor(request: Request, response: Response) {
    const password: string = request.body.password;
    const email: string = request.body.email;
    const emailFrontPart: string = email.substring(0, email.indexOf("@"))
    const username: string = request.body.username || emailFrontPart;

    delete request.body.password;

    let name = request.body.name || email;

    const salt = bcrypt.genSaltSync(config.password.saltRounds);

    const encryptedHash = bcrypt.hashSync(password, salt);

    const voucher = request.body.voucher;

    const voucherItem = await this.voucherRepository.findOne({ where: { code: voucher } })

    if (!voucherItem) {
      return responseGenerator(response, 400, "invalid-voucher");
    }

    let token = "";

    try {
      await getConnection().transaction(async transactionManager => {
        const tmUserRepository = transactionManager.getRepository(User);
        const savedUser = await tmUserRepository.save({
          role: UserRole.VISITOR,
          salt,
          password: encryptedHash,
          username,
          name,
          email,
        });

        let filled = false;
        let point = 0;

        if (request.body.dob &&
          request.body.gender &&
          (request.body.interest && request.body.interest.length > 0) &&
          request.body.name) {
          filled = true;
          point += config.userFillBonus;
        }

        const changes: any = partialUpdate({}, request.body, ["dob", "gender", "interest"]);

        if (changes.interest && changes.interest.length == 0) {
          delete changes.interest;
        }

        await transactionManager.save(Visitor, {
          userId: savedUser,
          ...changes,
          point,
          filled,
        });
        await transactionManager.delete(Voucher, voucherItem);

        token = jwt.sign({
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
        }, config.secret)
      })
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return responseGenerator(response, 400, "user-exists");
      } else {
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }

    return responseGenerator(response, 200, "ok", {
      jwt: token
    });
  }

  checkFilled(visitorObj: any, userObj: any): boolean {
    return (visitorObj.dob &&
      visitorObj.gender &&
      (visitorObj.interest && visitorObj.interest.length > 0) &&
      (userObj.name !== userObj.email) &&
      !visitorObj.filled);
  }

  async editUserMe(request: Request, response: Response) {
    request.params.id = response.locals.auth.id;
    return this.editUser(request, response);
  }

  async editUser(request: Request, response: Response) {
    const id = request.params.id;
    try {

      const user = await this.userRepository.findOne(id);

      if (!user) {
        return responseGenerator(response, 404, "user-not-found");
      }

      const updatedUser = partialUpdate(user, request.body, ["name", "username"]);

      if (user.role === UserRole.VISITOR) {
        const visitor = await this.visitorRepository.findOne({
          where: {
            userId: user
          },
          relations: ["userId"]
        });

        const updatedVisitor: any = partialUpdate(visitor, request.body, ["dob", "gender", "interest"]);

        if (updatedVisitor.interest && updatedVisitor.interest.length == 0) {
          delete updatedVisitor.interest;
        }

        if (this.checkFilled(updatedVisitor, updatedUser)) {
          updatedVisitor.point += config.userFillBonus;
          updatedVisitor.filled = true;
        }

        await this.visitorRepository.save(updatedVisitor);
      }

      await this.userRepository.save(updatedUser);
    } catch (err) {
      console.error(err);
      return responseGenerator(response, 500, "unknown-error");
    }

    return responseGenerator(response, 200, "ok");
  }

  async getQrMe(request: Request, response: Response) {
    const id = response.locals.auth.id;

    const user = await this.userRepository.findOne(id);

    const qrHash = generateQr(user);

    return responseGenerator(response, 200, "ok", {
      qrid: qrHash
    });
  }

  async getQrData(request: Request, response: Response) {
    const userString = decodeQr(request.params.qrid);

    let userData: any = {};

    try {
      userData = JSON.parse(userString);

    } catch (error) {
      console.error(error);
      return responseGenerator(response, 400, "invalid-qrid");
    }

    const user = await this.userRepository.findOne(userData.id);

    if (!user) {
      return responseGenerator(response, 404, "user-not-found");
    }

    return responseGenerator(response, 200, "ok", {
      username: user.username,
      name: user.name,
      role: user.role,
    });
  }
}
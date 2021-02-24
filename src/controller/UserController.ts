import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getConnection, getRepository, MoreThan, Repository } from "typeorm";
import * as TokenGenerator from "uuid-token-generator";

import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Verification, VerificationType } from "../entity/Verification";
import { Voucher } from "../entity/Voucher";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { decodeQr, generateQr } from "../utils/qr";
import { responseGenerator } from "../utils/responseGenerator";
import { TransactionController } from "./TransactionController";
import { sendEmail } from "../utils/mail";
import { GlobalScoreboard } from "../entity/GlobalScoreboard";

export class UserController {
  private userRepository = getRepository(User);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private voucherRepository = getRepository(Voucher);
  private verificationRepository = getRepository(Verification);
  private globalScoreboardRepository = getRepository(GlobalScoreboard);

  private tc = new TransactionController();

  generateToken(): string {
    return (Math.random() + 1).toString(36).substr(2, 6);
  }

  async createUser(name: string, username: string, email: string, role: UserRole, password: string): Promise<void> {
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

  async generateVoucher(qty: number): Promise<Array<string>> {

    const promiseArr: Array<Promise<Voucher>> = [];
    const codeList: Array<string> = [];

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

  async resetPassword(request: Request, response: Response) {
    try {
      const { username, email } = request.body;
      const token = this.generateToken();

      const userByUsername = await this.userRepository.findOne({
        username
      });

      const userByEmail = await this.userRepository.findOne({
        email
      });

      const user = userByEmail || userByUsername;

      if (user) {
        await this.verificationRepository.save({
          userId: user,
          token,
          type: VerificationType.RESET_PASS
        });

        const htmlBody = `
          <table style="margin: auto; width: 100%; background-color: #FFF; padding: 20px; max-width: 500px;">
            <tr><td style="text-align: center"><img src="https://arkavidia.nyc3.digitaloceanspaces.com/logo-arkavidia.png" height="100"></td></tr>
            <tr><td style="text-align: center">Halo, ${user.name}! </td></tr>
            <tr><td style="text-align: center">Untuk mereset password Anda, masukkan token [ <strong> ${token} </strong> ] ke halaman yang memintanya.</td></tr>

            <tr><td style="text-align: center">Jika Anda tidak ingin mengganti password, tidak ada yang perlu Anda lakukan.</td></tr>
            <tr><td style="text-align: center">Password Anda tidak akan berubah sampai Anda menggunakan token di atas dan mengganti dengan password yang baru.</td></tr>
          </table>
        `;

        const textBody = `TOKEN: ${token}`;

        await sendEmail(user.email, "Reset Password - ITFest Arkavidia", htmlBody, textBody);
      }

      return responseGenerator(response, 200, "ok");

    } catch (err) {
      return responseGenerator(response, 500, "server-error");

    }
  }

  async verifyToken(request: Request, response: Response): Promise<void> {
    try {
      const { email, password = "", token } = request.body;

      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        return responseGenerator(response, 400, "invalid-token");
      }

      const verification = await this.verificationRepository.findOne({
        where: {
          userId: user.id
        }
      });

      if (!verification || verification.token !== token) {
        return responseGenerator(response, 400, "invalid-token");
      }

      if (verification.type === VerificationType.CONFIRM_EMAIL) {
        user.isVerified = true;

        await getConnection().transaction(async transactionManager => {
          const tmUserRepository = transactionManager.getRepository(User);
          const tmVerificationRepository = transactionManager.getRepository(Verification);

          await tmUserRepository.save(user);

          await tmVerificationRepository.delete(verification);
        });

        return responseGenerator(response, 200, "ok");

      } else if (password !== "") {
        const salt = bcrypt.genSaltSync(config.password.saltRounds);

        const encryptedHash = bcrypt.hashSync(password, salt);

        user.password = encryptedHash;

        await getConnection().transaction(async transactionManager => {
          const tmUserRepository = transactionManager.getRepository(User);
          const tmVerificationRepository = transactionManager.getRepository(Verification);

          await tmUserRepository.save(user);

          await tmVerificationRepository.delete(verification);

        });

        return responseGenerator(response, 200, "ok");

      }

      return responseGenerator(response, 400, "password-cant-be-empty");

    } catch (error) {
      if (typeof error === "string") {
        return responseGenerator(response, 400, error);
      } else {
        console.error(error);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }

  async listUser(request: Request, response: Response): Promise<void> {
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

  async getUser(request: Request, response: Response): Promise<void> {
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

  async getMe(request: Request, response: Response): Promise<void> {
    request.params.id = response.locals.auth.id;
    return this.getUser(request, response);
  }

  async getTransaction(request: Request, response: Response): Promise<void> {
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

  async getMeTransaction(request: Request, response: Response): Promise<void> {
    request.params.id = response.locals.auth.id;
    return this.getTransaction(request, response);
  }

  async login(request: Request, response: Response): Promise<void> {
    const { username, email, password } = request.body;

    const userByUsername = await this.userRepository.findOne({
      username
    }, { select: ["id", "username", "email", "role", "password", "isVerified"] });

    const userByEmail = await this.userRepository.findOne({
      email
    }, { select: ["id", "username", "email", "role", "password", "isVerified"] });

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
      }, config.secret);

      if (!user.isVerified) {
        return responseGenerator(response, 403, "not-verified");
      }

      delete user.password;

      return responseGenerator(response, 200, "ok", {
        jwt: token,
        user
      });
    } else {
      return responseGenerator(response, 401, "invalid-auth");
    }
  }

  async sendVerificationEmail(verificationRepository: Repository<Verification>, user: User): Promise<void> {
    const token = this.generateToken();

    await verificationRepository.save({
      userId: user,
      token,
      type: VerificationType.CONFIRM_EMAIL
    });

    const htmlBody = `
      <table style="margin: auto; width: 100%; background-color: #FFF; padding: 20px; max-width: 500px;">
        <tr><td style="text-align: center"><img src="https://arkavidia.nyc3.digitaloceanspaces.com/logo-arkavidia.png" height="100"></td></tr>
        <tr><td style="text-align: center">Halo, ${user.name}! </td></tr>
        <tr><td style="text-align: center">Untuk menkonfirmasi akun anda, masukkan token [ <strong> ${token} </strong> ] ke halaman yang memintanya.</td></tr>

        <tr><td style="text-align: center">Jika Anda tidak meminta email ini, tidak ada yang perlu Anda lakukan.</td></tr>
        <tr><td style="text-align: center">Terimakasih sudah mendaftarkan diri ke event ITFest dari Arkavidia!</td></tr>
      </table>
    `;

    const textBody = `TOKEN: ${token}`;

    await sendEmail(user.email, "Confirm Email - ITFest Arkavidia", htmlBody, textBody);

  }

  async registerTenant(request: Request, response: Response): Promise<void> {
    const { email, username, password, point } = request.body;

    const name = request.body.name || username;

    delete request.body.password;

    const salt = bcrypt.genSaltSync(config.password.saltRounds);
    const encryptedHash = await bcrypt.hash(password, salt);

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
        }

        const savedUser = await tmUserRepository.save({
          role: UserRole.TENANT,
          salt,
          password: encryptedHash,
          username,
          name,
          email,
          isVerified: true
        } as User);

        await tmTenantRepository.save({
          userId: savedUser,
          point: point || config.tenantInitial
        });

        return responseGenerator(response, 200, "ok", { id: savedUser.id });
      });
    } catch (err) {
      if (err === "user-exists" || err.code === "23505") {
        return responseGenerator(response, 400, "user-exists");
      } else {
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }
  }

  async registerVisitor(request: Request, response: Response): Promise<void> {
    const password: string = request.body.password;
    const email: string = request.body.email;
    const username: string = request.body.username || request.body.email;

    delete request.body.password;

    const name = request.body.name || email;

    const salt = bcrypt.genSaltSync(config.password.saltRounds);

    const encryptedHash = bcrypt.hashSync(password, salt);

    const voucher = request.body.voucher;

    let voucherItem: Voucher;

    if (config.useVoucher) {
      voucherItem = await this.voucherRepository.findOne({ where: { code: voucher } });

      if (!voucherItem) {
        return responseGenerator(response, 400, "invalid-voucher");
      }
    }

    try {
      await getConnection().transaction(async transactionManager => {
        const tmUserRepository = transactionManager.getRepository(User);
        const tmVerificationRepository = transactionManager.getRepository(Verification);

        const savedUser = await tmUserRepository.save({
          role: UserRole.VISITOR,
          salt,
          password: encryptedHash,
          username,
          name,
          email,
          isVerified: false
        });

        await this.sendVerificationEmail(tmVerificationRepository, savedUser);

        let filled = false;
        let point = 0;

        if (this.checkFilled(request.body as Visitor) && request.body.name) {
          filled = true;
          point += config.userFillBonus;
        }

        const changes: Partial<Visitor> = partialUpdate({}, request.body, ["dob", "gender", "interest", "telp", "institute"]);

        if (changes.interest && changes.interest.length === 0) {
          delete changes.interest;
        }

        await transactionManager.save(Visitor, {
          userId: savedUser,
          ...changes,
          point,
          filled,
        });

        if (config.useVoucher) {
          await transactionManager.delete(Voucher, voucherItem);
        }
      });
    } catch (err) {
      if (err.code === "23505") {
        return responseGenerator(response, 400, "user-exists");
      } else {
        // eslint-disable-next-line no-console
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }

    return responseGenerator(response, 200, "ok");
  }

  async countVisitor(req: Request, res: Response) {
    try {
      const visCount = await this.visitorRepository.count();

      return responseGenerator(res, 200, "ok", { count: visCount } as any);
    } catch (err) {

      console.error(err);
      return responseGenerator(res, 500, "unknown-error");
    }
  }

  async getRankAndPoint(request: Request, response: Response): Promise<void> {
    try {
      const id = +response.locals.auth.id;

      const userScoreBoard = await this.globalScoreboardRepository.findOne({
        where: {
          user: { id } as User
        }
      });

      let score = 0, rank = -1;
      if (userScoreBoard) {
        rank = 1;
        score = userScoreBoard.score;

        const scoreboardData = await this.globalScoreboardRepository.find({
          where: {
            score: MoreThan(score)
          }
        });


        if (scoreboardData) {
          rank = scoreboardData.length + 1;
        }
      }

      const totalCount = await this.globalScoreboardRepository
        .createQueryBuilder("leaderboard")
        .select("COUNT(DISTINCT(score)) AS total")
        .getRawOne();

      return responseGenerator(response, 200, "ok", { score, rank, total: totalCount.total });

    } catch (err) {
      console.error(err);
      return responseGenerator(response, 500, "unknown-error");
    }
  }

  async getLiveTenant(request: Request, response: Response): Promise<void> {
    try {
      const tenantList = await this.tenantRepository.find({
        where: {
          isLive: true
        },
        relations: ["userId"]
      });

      const result = tenantList.map(el => {
        return {
          id: el.userId.id,
          slug: el.userId.username,
          liveURL: el.liveURL
        };
      });

      return responseGenerator(response, 200, "ok", result);

    } catch (err) {

      console.error(err);
      return responseGenerator(response, 500, "unknown-error");
    }
  }

  checkFilled(visitorObj: Visitor, userObj?: User): boolean {
    return !visitorObj.filled &&
      (!userObj || userObj.name !== userObj.email) &&
      config.userFillBonusField.every((field) => {
        if (field === "interest") {
          return visitorObj.interest && visitorObj.interest.length > 0;
        } else {
          return visitorObj[field];
        }
      });
  }

  async editUserMe(request: Request, response: Response): Promise<void> {
    request.params.id = response.locals.auth.id;
    return this.editUser(request, response);
  }

  async editUser(request: Request, response: Response): Promise<void> {
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

        const updatedVisitor = partialUpdate(visitor, request.body, ["dob", "gender", "interest", "telp", "institute"]);

        if (updatedVisitor.interest && updatedVisitor.interest.length === 0) {
          delete updatedVisitor.interest;
        }

        if (this.checkFilled(updatedVisitor, updatedUser)) {
          updatedVisitor.point += config.userFillBonus;
          updatedVisitor.filled = true;
        }

        await this.visitorRepository.save(updatedVisitor);
      } else if (user.role === UserRole.TENANT) {
        const tenant = await this.tenantRepository.findOne({
          where: {
            userId: user
          },
          relations: ["userId"]
        });

        const updatedTenant = partialUpdate(tenant, request.body, ["isLive", "liveURL"]);

        await this.tenantRepository.save(updatedTenant);

      }

      await this.userRepository.save(updatedUser);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      return responseGenerator(response, 500, "unknown-error");
    }

    return responseGenerator(response, 200, "ok");
  }

  async getQrMe(request: Request, response: Response): Promise<void> {
    const id = response.locals.auth.id;

    const user = await this.userRepository.findOne(id);

    const qrHash = generateQr(user);

    return responseGenerator(response, 200, "ok", {
      qrid: qrHash
    });
  }

  async getQrData(request: Request, response: Response): Promise<void> {
    const userString = decodeQr(request.params.qrid);

    let userData: Partial<User>;

    try {
      userData = JSON.parse(userString);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return responseGenerator(response, 400, "invalid-qrid");
    }

    if (!userData.id) {
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

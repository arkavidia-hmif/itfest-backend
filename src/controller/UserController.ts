import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { AdvancedConsoleLogger, getConnection, getRepository } from "typeorm";
import { getTestMessageUrl, createTestAccount, createTransport } from 'nodemailer';
import * as TokenGenerator from 'uuid-token-generator';
import config from "../config";
import { Tenant, User, UserRole, Visitor } from "../entity/User";
import { Voucher } from "../entity/Voucher";
import { partialUpdate } from "../utils/partialUpdateEntity";
import { decodeQr, generateQr } from "../utils/qr";
import { responseGenerator } from "../utils/responseGenerator";
import { TransactionController } from "./TransactionController";
import { transporter } from "../utils/mail"

export class UserController {

  private userRepository = getRepository(User);
  private visitorRepository = getRepository(Visitor);
  private tenantRepository = getRepository(Tenant);
  private voucherRepository = getRepository(Voucher);
  private tc = new TransactionController();
  private tokenGenerator = new TokenGenerator(128, TokenGenerator.BASE62);

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

  async sendEmail(target: string, subject: string, body: string, text: string){
    const html = `
      <html>
      <head>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
          </style>
      </head>
      <body style="font-family: Roboto,sans-serif; line-height: 2; background-color: #eee; width: 100%; padding: 20px; margin: 0;">
          ${body}
      </body>
    `;
    
    /********************************************/
    /* FOR TESTING */
    let testAccount = await createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    /********************************************/

    let mailOptions = {
      from: '"Arkavidia" <no-reply@arkavidia.com>', // sender address
      to: target, // list of receivers
      subject: subject, // Subject line
      text: text, // plain text body
      html: html // html body
    };

    // console.log(html);   

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          throw error;
      }
        console.log('Message sent: %s', info.messageId);   
        console.log('Preview URL: %s', getTestMessageUrl(info));
    });
  }

  async initResetPassword(request: Request, response: Response){
    try {
      const { username, email } = request.body;
      const token = this.tokenGenerator.generate();
      console.log(token);

      const userByUsername = await this.userRepository.findOne({
        username
      }, { select: ["id", "username", "email", "role", "password", "isVerified"] });
  
      const userByEmail = await this.userRepository.findOne({
        email
      }, { select: ["id", "username", "email", "role", "password", "isVerified"] });
  
      let user = userByEmail || userByUsername;
      
      if(user){
        let htmlBody = `
          <table style="margin: auto; width: 100%; background-color: #FFF; padding: 20px; max-width: 500px;">
            <tr><td style="text-align: center"><img src="https://arkavidia.nyc3.digitaloceanspaces.com/logo-arkavidia.png" height="100"></td></tr>
            <tr><td style="text-align: center">Halo, {{ user.full_name }}! </td></tr>
            <tr><td style="text-align: center">Untuk mereset password Anda, <a href="https://www.arkavidia.id/email/recover/{{ token }}">klik disini</a>.</td></tr>

            <tr><td style="text-align: center">Jika Anda tidak ingin mengganti password, tidak ada yang perlu Anda lakukan.</td></tr>
            <tr><td style="text-align: center">Password Anda tidak akan berubah sampai Anda mengakses link di atas dan memasukkan password yang baru.</td></tr>
          </table>
        `;
        
        const textBody = ``;

        // this.sendEmail(user.email, "Reset Password - Arkavidia", htmlBody, textBody);
      }
      
      return responseGenerator(response, 200, "ok");

    } catch (err) {
      return responseGenerator(response, 500, "server-error");
      
    }
  }

  async resetPassword(request: Request, response: Response){
    const salt = bcrypt.genSaltSync(config.password.saltRounds);
    const id = response.locals.auth.id;
    const { password } = request.body;

    try {
      const encryptedHash = bcrypt.hashSync(password, salt);
      const user = await this.userRepository.findOne(id);

      user.password = encryptedHash;

      await this.userRepository.save(user);

      return responseGenerator(response, 200, "pass-changed");

    } catch (err) {
      return responseGenerator(response, 500, "server-error");
      
    }
  }

  async confirmAccount(request: Request, response: Response){
    const { token } = request.body;

    try {
      // const encryptedHash = bcrypt.hashSync(password, salt);
      // const user = await this.userRepository.findOne(id);

      // user.password = encryptedHash;

      // await this.userRepository.save(user);

      return responseGenerator(response, 200, "pass-changed");

    } catch (err) {
      return responseGenerator(response, 500, "server-error");
      
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

      if(!user.isVerified){
        return responseGenerator(response, 403, "not-verified");
      }

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
        }

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
        }, config.secret);
      });
    } catch (err) {
      if (err === "user-exists" || err.code === "ER_DUP_ENTRY") {
        return responseGenerator(response, 400, "user-exists");
      } else if (err.code === "ESOCKET") {
        return responseGenerator(response, 500, "email-error");
      } else {
        // eslint-disable-next-line no-console
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }


    return responseGenerator(response, 200, "ok", {
      jwt: token
    });
  }

  async registerVisitor(request: Request, response: Response): Promise<void> {
    const password: string = request.body.password;
    const email: string = request.body.email;
    const emailFrontPart: string = email.substring(0, email.indexOf("@"));
    const username: string = request.body.username || emailFrontPart;

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
          request.body.institute &&
          request.body.telp &&
          (request.body.interest && request.body.interest.length > 0) &&
          request.body.name) {
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

        token = jwt.sign({
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
        }, config.secret);
      });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return responseGenerator(response, 400, "user-exists");
      } else {
        // eslint-disable-next-line no-console
        console.error(err);
        return responseGenerator(response, 500, "unknown-error");
      }
    }

    return responseGenerator(response, 200, "ok", {
      jwt: token
    });
  }

  checkFilled(visitorObj: Visitor, userObj: User): boolean {
    return (visitorObj.dob &&
      visitorObj.gender &&
      visitorObj.telp &&
      visitorObj.institute &&
      (visitorObj.interest && visitorObj.interest.length > 0) &&
      (userObj.name !== userObj.email) &&
      !visitorObj.filled);
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


import bcrypt from 'bcrypt';
import generateApiKey from 'generate-api-key';
import md5 from 'md5';
import { query, transaction } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { getMysqlErrorCode, OrNull } from '../utils/helpers';
import { getPermissionCode, getPermissionsFromCode, User } from '../models/user';
import { NextFunction, Request, Response } from 'express';
import { API_EXPIRY_DAYS } from '../config';
import { ClientError, InvalidCredentials } from '../utils/errors';
import { internalServerError } from '../api/utils/errors';
import { LIMIT } from '../utils/constants';

export default class Users {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const offset = (page - 1) * LIMIT;

    const rawUsers = await query("SELECT * FROM `users` LIMIT ? OFFSET ?", [LIMIT, offset]);
    const users: any[] = [];

    for (var i = 0; i < rawUsers.length; ++i) {
      users.push({
        id: rawUsers[i].id,
        username: rawUsers[i].username,
        permissions: getPermissionsFromCode(rawUsers[i].permission_code)
      });
    }

    return users;
  }

  async #get(id: number) : Promise<User> {
    const user = (await query("SELECT * FROM `users` WHERE `id` = ?", [id]))[0];

    if (typeof user === 'undefined') {
      throw new ClientError(`No user with id '${id}' exists.`);
    }

    return {
      username: user.username,
      password: user.password,
      permissions: getPermissionsFromCode(user.permission_code)
    };
  }

  censorUser(user: User) : User {
    user.password = '***';
    return user;
  }

  static async login(username: string, password: string, generateKey = true) {
    const user = (await query("SELECT * FROM `users` WHERE `username` = ?", [username]))[0];

    if (typeof user == 'undefined' || !bcrypt.compareSync(password, user.password)) {
      throw new InvalidCredentials();
    }

    if (!generateKey) {
      return true;
    }
    
    const apiKey = generateApiKey();
    await query("INSERT INTO `api_keys` (`api_key`, `user_id`) VALUES (?, ?)", [md5(apiKey as string), user.id]);

    return { api_key: apiKey };
  }

  static async checkValidApiKey(req: Request) {
    const apiKey = req.header("x-api-key");

    if (typeof apiKey == 'undefined') {
      return false;
    }

    try {
      const user = (await query("SELECT `users`.`id` AS `id`, `username`, `permission_code` FROM `users`, `api_keys` WHERE `api_key` = ? AND `users`.`id` = `api_keys`.`user_id` AND `date_created` > CURRENT_TIMESTAMP - INTERVAL ? DAY", [md5(apiKey), API_EXPIRY_DAYS]))[0];

      if (typeof user == 'undefined') {
        return false;
      }

      return true;
    } catch (_) {
      return false;
    }
  }

  static async checkAuth(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header("x-api-key");

    if (typeof apiKey == 'undefined') {
      return res.status(401).json({
        error: "You are not authorised to access this resource."
      });
    }

    try {
      const user = (await query("SELECT `users`.`id` AS `id`, `username`, `permission_code` FROM `users`, `api_keys` WHERE `api_key` = ? AND `users`.`id` = `api_keys`.`user_id` AND `date_created` > CURRENT_TIMESTAMP - INTERVAL ? DAY", [md5(apiKey), API_EXPIRY_DAYS]))[0];

      if (typeof user == 'undefined') {
        return res.status(401).json({
          error: "API Key has expired, sign in again."
        });
      }

      // Add the user object to the request
      req.user = {
        id: user.id,
        username: user.username,
        permissions: user.permission_code
      };

      return next();
    } catch (_) {
      return internalServerError(res);
    }
  }

  static async logout(req: Request, res: Response) {
    const apiKey = req.header("x-api-key");

    if (typeof apiKey == 'undefined') {
      return res.status(401).json({
        error: "You are not authenticated."
      });
    }

    try {
      await query("DELETE FROM `api_keys` WHERE `api_key` = ?", [md5(apiKey)]);
      return res.status(200).json({});
    } catch (_) {
      return internalServerError(res);
    }
  }

  static async logoutAll(req: Request, res: Response) {
    const apiKey = req.header("x-api-key");

    if (typeof apiKey == 'undefined') {
      return res.status(401).json({
        error: "You are not authenticated."
      });
    }

    try {
      await query("DELETE FROM `api_keys` WHERE `user_id` = (SELECT `user_id` FROM `api_keys` WHERE `api_key` = ?)", [md5(apiKey)]);
      return res.status(200).json({});
    } catch (_) {
      return internalServerError(res);
    }
  }

  async add(user: User) {
    const queries = [
      {
        query: "INSERT INTO `users` (`username`, `password`, `permission_code`) VALUES (?, ?, ?)",
        options: [user.username, bcrypt.hashSync(user.password, 10), getPermissionCode(user.permissions)]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.USER_ADD,
        newValue: this.censorUser(user)
      })
    ];

    try {
      return {
        id: (await transaction(queries))[0].insertId,
        ...user
      };
    } catch (err) {
      switch (getMysqlErrorCode(err)) {
        case 'ER_DUP_ENTRY':
          throw new ClientError(`Username '${user.username}' already exists.`);
        default:
          throw err;
      }
    }
  }

  async edit(id: number, user: OrNull<User>) {
    const old = await this.#get(id);
    user.username = user.username ?? old.username;
    user.password = user.password ? bcrypt.hashSync(user.password, 10) : old.password;
    user.permissions = user.permissions ?? old.permissions;

    const queries = [
      {
        query: "UPDATE `users` SET `username` = ?, `password` = ?, `permission_code` = ? WHERE id = ?",
        options: [user.username, user.password, getPermissionCode(user.permissions), id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.USER_EDIT,
        oldValue: this.censorUser(old),
        newValue: this.censorUser(user as User)
      })
    ];

    // Don't log the activity if the user is the same as the author
    if (id == this.userId) {
      queries.pop();
    }

    try {
      await transaction(queries);
    } catch (err) {
      switch (getMysqlErrorCode(err)) {
        case 'ER_DUP_ENTRY':
          throw new ClientError(`Username '${user.username}' already exists.`);
        default:
          throw err;
      }
    }

    return { id, ...user };
  }

  async delete(id : number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `users` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.USER_DELETE,
        oldValue: this.censorUser(old)
      })
    ];

    await transaction(queries);
  }
}

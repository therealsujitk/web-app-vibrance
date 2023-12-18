import express from 'express';
import { Users } from '../../interfaces';
import { Permission, User } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError } from '../utils/errors';
import { checkPermissions, handleValidationErrors, toNumber } from '../utils/helpers';
import { body, query } from 'express-validator';
import { body_enum_array, body_positive_integer, query_positive_integer } from '../utils/validators';

const usersRouter = express.Router();

/**
 * [GET] /api/v1.0/users
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param page number
 * 
 * @response JSON
 *  {
 *      "users": [
 *          {
 *              "id": 1,
 *              "username": "admin",
 *              "permissions": [
 *                  "ADMIN",
 *                  ...
 *              ]
 *          },
 *          ...
 *      ],
 *      "permissions": [
 *          "ADMIN",
 *          "EVENTS",
 *          ...
 *      ]
 *  }
 */
usersRouter.get(
  '',
  Users.checkAuth,
  query_positive_integer('page').optional(),
  query('page').default(1),
  handleValidationErrors,
  checkPermissions(),
  async (req, res) => {
    const page = toNumber(req.query.page)!;

    try {
      res.status(200).json({
        users: await Users.getAll(page),
        permissions: Object.keys(Permission).filter(p => isNaN(parseInt(p))),
        next_page: page + 1
      });
    } catch (_) {
      internalServerError(res);
    }
  },
);

/**
 * [POST] /api/v1.0/users/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param username string (required)
 * @param password string (required)
 * @param permissions Permission|Permission[] (required)
 * 
 * @response JSON
 *  {
 *      user: {
 *          "id": "1",
 *          "username": "user",
 *          "password": "***",
 *          "permissions": [
 *              "ADMIN",
 *              ...
 *          ]
 *      }
 *  }
 */
usersRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(),
  body('username').isString().trim().toLowerCase().isAlphanumeric().notEmpty().withMessage('\'username\' must be a valid alphanumeric string'),
  body('password').isString().isStrongPassword().withMessage('\'password\' is not strong enough'),
  body_enum_array('permissions', Permission),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const newUser: User = {
      username: req.body.username,
      password: req.body.password,
      permissions: req.body.permissions,
    };

    try {
      res.status(200).json({
        user: await new Users(user.id).add(newUser)
      });
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res);
      } else {
        internalServerError(res);
      }
    }
  },
);

/**
 * [POST] /api/v1.0/users/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param username string
 * @param password string
 * @param permissions Permission|Permission[]
 * 
 * @response JSON
 *  {
 *      user: {
 *          "id": "1",
 *          "username": "user",
 *          "password": "***",
 *          "permissions": [
 *              "ADMIN",
 *              ...
 *          ]
 *      }
 *  }
 */
usersRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(),
  body_positive_integer('id'),
  body('username').isString().trim().toLowerCase().isAlphanumeric().notEmpty().optional().withMessage('\'username\' must be a valid alphanumeric string'),
  body('password').isString().notEmpty().optional().withMessage('\'password\' is not strong enough'),
  body_enum_array('permissions', Permission).optional(),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = toNumber(req.body.id)!;
    const editedUser: OrNull<User> = {
      username: req.body.username,
      password: req.body.password,
      permissions: req.body.permissions,
    };

    try {
      res.status(200).json({
        user: await new Users(user.id).edit(id, editedUser)
      });
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res);
      } else {
        internalServerError(res);
      }
    }
  },
);

/**
 * [POST] /api/v1.0/users/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number
 * 
 * @response JSON
 *  {}
 */
usersRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(),
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = toNumber(req.body.id)!;

    try {
      await new Users(user.id).delete(id);
      res.status(200).json({});
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res);
      } else {
        internalServerError(res);
      }
    }
  },
);

export default usersRouter;

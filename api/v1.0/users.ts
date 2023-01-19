import express from 'express';
import validator from 'validator';
import { Users } from '../../interfaces';
import { Permission, User } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { checkPermissions } from '../utils/helpers';

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
usersRouter.get('', Users.checkAuth, checkPermissions(), async (req, res) => {
  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  try {
    res.status(200).json({
      users: await Users.getAll(page),
      permissions: Object.keys(Permission).filter(p => isNaN(parseInt(p)))
    });
  } catch (_) {
    internalServerError(res);
  }
});

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
usersRouter.put('/add', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!;

  if (!('username' in req.body)) {
    return missingRequiredParameter('username', res);
  }

  if (!('password' in req.body)) {
    return missingRequiredParameter('password', res);
  }

  const username = req.body.username.trim().toLowerCase();
  const password = req.body.password;
  const permissions: Permission[] = [];

  if (!validator.isAlphanumeric(username)) {
    return invalidValueForParameter('username', res);
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({
      error: "Given password is not strong enough."
    });
  }


  if ('permissions' in req.body) {
    if (Array.isArray(req.body.permissions)) {
      const p = req.body.permissions as string[];

      for (var i = 0; i < p.length; ++i) {
        const permission = p[i].toUpperCase() as unknown as Permission;

        if (!(permission in Permission)) {
          return invalidValueForParameter('permissions', res);
        }

        permissions.push(permission);
      }
    } else {
      permissions.push(req.body.permissions.toUpperCase() as Permission);

      if (!(permissions[0] in Permission)) {
        return invalidValueForParameter('permissions', res);
      }
    }
  }

  const newUser: User = {
    username: username,
    password: password,
    permissions: permissions
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
});

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
usersRouter.patch('/edit', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!;
  const editedUser: OrNull<User> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('username' in req.body) {
    editedUser.username = req.body.username.trim();

    if (!validator.isAlphanumeric(editedUser.username as string)) {
      return invalidValueForParameter('username', res);
    }
  }

  if ('password' in req.body) {
    editedUser.password = req.body.password;

    if (!validator.isStrongPassword(editedUser.password as string)) {
      return res.status(400).json({
        error: "Given password is not strong enough."
      });
    }
  }

  if ('permissions' in req.body) {
    editedUser.permissions = [];

    if (Array.isArray(req.body.permissions)) {
      const permissions = req.body.permissions;

      for (var i = 0; i < permissions.length; ++i) {
        const permission = permissions[i].toUpperCase() as Permission;

        if (!(permission in Permission)) {
          return invalidValueForParameter('permissions', res);
        }

        editedUser.permissions.push(permission);
      }
    } else {
      editedUser.permissions.push(req.body.permissions.toUpperCase() as Permission);

      if (!(editedUser.permissions[0] in Permission)) {
        return invalidValueForParameter('permissions', res);
      }
    }
  }

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
});

/**
 * [POST] /api/v1.0/users/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number
 * 
 * @response JSON
 *  {}
 */
usersRouter.delete('/delete', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

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
});

export default usersRouter;

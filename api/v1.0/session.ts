import express from 'express';
import validator from 'validator';
import { Users } from '../../interfaces';
import { getPermissionsFromCode, User } from '../../models/user';
import { ClientError, InvalidCredentials } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';

const sessionRouter = express.Router();

/**
 * [GET] /api/v1.0/session
 * 
 * @header X-Api-Key <API-KEY> (required)
 * 
 * @response JSON
 *  {
 *      "session": {
 *          "username": "admin",
 *          "permissions": [
 *              "ADMIN"
 *          ]
 *      }
 *  }
 */
sessionRouter.get('', Users.checkAuth, async (req, res) => {
  const { id, permissions, ...session } = req.user!;
  
  res.status(200).json({
    session: {
      ...session,
      permissions: getPermissionsFromCode(permissions)
    }
  });
});

/**
 * [POST] /api/v1.0/session/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param username string
 * @param old_password string (required to update password)
 * @param password string
 * 
 * @response JSON
 *  {
 *      user: {
 *          "username": "user",
 *          "password": "***",
 *          "permissions": [
 *              "ADMIN",
 *              ...
 *          ]
 *      }
 *  }
 */
sessionRouter.patch('/edit', Users.checkAuth, async (req, res) => {
  const user = req.user!;
  const editedUser: OrNull<User> = {};

  if ('username' in req.body) {
    editedUser.username = req.body.username.trim();

    if (!validator.isAlphanumeric(editedUser.username as string)) {
      return invalidValueForParameter('username', res);
    }
  }

  if ('password' in req.body) {
    if (!('old_password' in req.body)) {
      return missingRequiredParameter('old_password', res);
    }

    const old_password = req.body.old_password;
    editedUser.password = req.body.password;

    try {
      await Users.login(user.username, old_password, false);
    } catch (err) {
      if (err instanceof ClientError) {
        return res.status(400).json({
          error: "Incorrect old password."
        });
      } else {
        return internalServerError(res);
      }
    }

    if (!validator.isStrongPassword(editedUser.password as string)) {
      return res.status(400).json({
        error: "Given password is not strong enough."
      });
    }
  }

  const { id, ...updatedUser } = await new Users(user.id).edit(user.id, editedUser);

  try {
    res.status(200).json({
      user: updatedUser
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
 * [POST] /api/v1.0/session/login
 * 
 * @param username string (required)
 * @param password string (required)
 * 
 * @response JSON
 *  {
 *      "apiKey": "h3RWfOQJvEAam4TWL61i_jgZ0hU"
 *  }
 */
sessionRouter.post('/login', async (req, res) => {
  if (!('username' in req.body)) {
    return missingRequiredParameter('username', res);
  }

  if (!('password' in req.body)) {
    return missingRequiredParameter('password', res);
  }

  const username = req.body.username;
  const password = req.body.password;

  try {
    res.status(200).json({
      session: await Users.login(username, password)
    });
  } catch (err) {
    if (err instanceof InvalidCredentials) {
      res.status(400).json({
        error: "Invalid username / password"
      });
    } else {
      internalServerError(res);
    }
  }
});

/**
 * POST requests to logout of a session or all sessions
 * 
 * @header X-Api-Key <API-KEY> (required)
 * 
 * @response JSON
 *  {}
 */
sessionRouter.post('/logout', Users.logout);
sessionRouter.post('/logout-all', Users.logoutAll);

export default sessionRouter;

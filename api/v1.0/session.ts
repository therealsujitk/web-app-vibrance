import express from 'express'
import { Users } from '../../interfaces'
import { getPermissionsFromCode, User } from '../../models/user'
import { ClientError, InvalidCredentials } from '../../utils/errors'
import { OrNull } from '../../utils/helpers'
import { badRequestError, internalServerError } from '../utils/errors'
import { body } from 'express-validator'
import { handleValidationErrors } from '../utils/helpers'

const sessionRouter = express.Router()

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
  const { id, permissions, ...session } = req.user!

  res.status(200).json({
    session: {
      ...session,
      permissions: getPermissionsFromCode(permissions),
    },
  })
})

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
sessionRouter.patch(
  '/edit',
  Users.checkAuth,
  body('username')
    .isString()
    .trim()
    .isAlphanumeric()
    .notEmpty()
    .optional()
    .withMessage("'username' must be a valid alphanumeric string"),
  body('old_password').isString().notEmpty().optional(),
  body('password').isString().isStrongPassword().optional().withMessage("'password' is not strong enough"),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const editedUser: OrNull<User> = {
      username: req.body.username,
      password: req.body.password,
    }

    if (editedUser.password) {
      const old_password = req.body.old_password ?? ''

      try {
        await Users.login(user.username, old_password, false)
      } catch (err) {
        if (err instanceof ClientError) {
          return res.status(400).json({
            errors: [
              {
                message: 'Incorrect old password.',
              },
            ],
          })
        } else {
          return internalServerError(res)
        }
      }
    }

    try {
      const { id, ...updatedUser } = await new Users(user.id).edit(user.id, editedUser)

      res.status(200).json({
        user: updatedUser,
      })
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res)
      } else {
        internalServerError(res)
      }
    }
  },
)

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
sessionRouter.post(
  '/login',
  body('username').isString(),
  body('password').isString(),
  handleValidationErrors,
  async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    try {
      res.status(200).json({
        session: await Users.login(username, password),
      })
    } catch (err) {
      if (err instanceof InvalidCredentials) {
        res.status(400).json({
          errors: [
            {
              message: 'Invalid username / password',
            },
          ],
        })
      } else {
        internalServerError(res)
      }
    }
  },
)

/**
 * POST requests to logout of a session or all sessions
 *
 * @header X-Api-Key <API-KEY> (required)
 *
 * @response JSON
 *  {}
 */
sessionRouter.post('/logout', Users.logout)
sessionRouter.post('/logout-all', Users.logoutAll)

export default sessionRouter

import express from 'express'
import { UploadedFile } from 'express-fileupload'
import { Merchandise, Users } from '../../interfaces'
import { Merchandise as MerchandiseModel } from '../../models/merchandise'
import { Permission } from '../../models/user'
import { ClientError } from '../../utils/errors'
import { OrNull } from '../../utils/helpers'
import { badRequestError, internalServerError } from '../utils/errors'
import {
  checkPermissions,
  checkReadOnly,
  getCacheOrFetch,
  getUploadMiddleware,
  handleFileUpload,
  handleValidationErrors,
  MIME_TYPE,
  toNumber,
} from '../utils/helpers'
import { query } from 'express-validator'
import { body_amount, body_non_empty_string, body_positive_integer } from '../utils/validators'

const merchandiseRouter = express.Router()
const uploadMiddleware = getUploadMiddleware()

/**
 * [GET] /api/v1.0/merchandise
 *
 * @param page number
 * @param query string
 *
 * @reponse JSON
 *  {
 *      "merchandise": [
 *          {
 *              "id": 1,
 *              "title": "Wrist Band",
 *              "image": null,
 *              "cost": 30
 *          }
 *      ]
 *  }
 */
merchandiseRouter.get(
  '',
  body_positive_integer('page').optional(),
  query('page').default(1),
  query('query').optional(),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!
    const query = req.query.query as string | undefined

    try {
      const merchandise = await getCacheOrFetch(req, Merchandise.getAll, [page, query])

      res.status(200).json({
        merchandise: merchandise,
        next_page: page + 1,
      })
    } catch (_) {
      if (!res.headersSent) {
        internalServerError(res)
      }
    }
  },
)

/**
 * [POST] /api/v1.0/merchandise/add
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param title string (required)
 * @param cost string (required)
 * @param image File
 *
 * @response JSON
 *  {
 *      "merchandise": {
 *          "id": 1,
 *          "title": "Wrist Band",
 *          "cost": 30,
 *          "image": null
 *      }
 *  }
 */
merchandiseRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.MERCHANDISE),
  checkReadOnly,
  uploadMiddleware,
  body_non_empty_string('title'),
  body_amount('cost'),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return
    }

    const user = req.user!
    const merchandise: MerchandiseModel = {
      title: req.body.title,
      cost: toNumber(req.body.cost)!,
    }

    if (req.files && 'image' in req.files) {
      try {
        merchandise.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE)
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res)
        } else {
          return internalServerError(res)
        }
      }
    }

    try {
      res.status(200).json({
        merchandise: await new Merchandise(user.id).add(merchandise),
      })
    } catch (_) {
      internalServerError(res)
    }
  },
)

/**
 * [POST] /api/v1.0/merchandise/edit
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param title string
 * @param cost string
 * @param image File
 *
 * @response JSON
 *  {
 *      "merchandise": {
 *          "id": 2,
 *          "title": "Badges",
 *          "cost": 10,
 *          "image": null
 *      }
 *  }
 */
merchandiseRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.MERCHANDISE),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('id'),
  body_non_empty_string('title').optional(),
  body_amount('cost').optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return
    }

    const user = req.user!
    const id = toNumber(req.body.id)!
    const merchandise: OrNull<MerchandiseModel> = {
      title: req.body.title,
      cost: toNumber(req.body.cost),
    }

    if (req.files && 'image' in req.files) {
      try {
        merchandise.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE)
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res)
        } else {
          return internalServerError(res)
        }
      }
    }

    try {
      res.status(200).json({
        merchandise: await new Merchandise(user.id).edit(id, merchandise),
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
 * [POST] /api/v1.0/merchandise/delete
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 *
 * @reponse JSON
 *  {}
 */
merchandiseRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(Permission.MERCHANDISE),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const id = toNumber(req.body.id)!

    try {
      await new Merchandise(user.id).delete(id)
      res.status(200).json({})
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res)
      } else {
        internalServerError(res)
      }
    }
  },
)

export default merchandiseRouter

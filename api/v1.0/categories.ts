import express from 'express';
import { UploadedFile } from 'express-fileupload';
import { Categories, Users } from '../../interfaces';
import { Category, CategoryType } from '../../models/category';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError } from '../utils/errors';
import { checkPermissions, checkReadOnly, getCacheOrFetch, getUploadMiddleware, handleFileUpload, handleValidationErrors, MIME_TYPE } from '../utils/helpers';
import { query } from 'express-validator';
import { body_enum, body_non_empty_string, body_positive_integer, query_enum_array, query_positive_integer } from '../utils/validators';

const categoriesRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/categories
 * 
 * @param page number
 * @param type CategoryType|CategoryType[]
 * @param query string
 * 
 * @response JSON
 *  {
 *      "categories": [
 *          {
 *              "id": 1,
 *              "title": "Google Student Developer Club",
 *              "type": "CLUB",
 *              "image": null
 *          },
 *          ...
 *      ],
 *      "types": [
 *          "CENTRAL",
 *          "CLUB"
 *      ]
 *  }
 */
categoriesRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  query_enum_array('type', CategoryType).optional(),
  query('query').optional(),
  handleValidationErrors,
  async (req, res) => {
    const page = Number(req.query.page);
    const type = req.query.type as CategoryType[];
    const query = req.query.query as string|undefined;

    try {
      const categories = await getCacheOrFetch(req, Categories.getAll, [page, type, query]);

      res.status(200).json({
        categories: categories,
        types: Object.keys(CategoryType),
        next_page: page + 1
      });
    } catch (_) {
      if (!res.headersSent) {
        internalServerError(res);
      }
    }
  },
);

/**
 * [POST] /api/v1.0/categories/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param title string (required)
 * @param type CategoryType (required)
 * @param image File
 *
 * @response JSON
 *  {
 *      "category": {
 *          "id": 1,
 *          "title": "Google Student Developer Club",
 *          "type": "CLUB",
 *          "image": null
 *      }
 *  }
 */
categoriesRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  uploadMiddleware,
  body_non_empty_string('title'),
  body_enum('type', CategoryType),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const category: Category = {
      title: req.body.title,
      type: req.body.type as CategoryType,
    };

    if (req.files && 'image' in req.files) {
      try {
        category.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res);
        } else {
          return internalServerError(res);
        }
      }
    }

    try {
      res.status(200).json({
        category: await new Categories(user.id).add(category)
      });
    } catch (_) {
      internalServerError(res);
    }
  },
);

/**
 * [POST] /api/v1.0/categories/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param title string
 * @param type CategoryType
 * @param image File
 *
 * @response JSON
 *  {
 *      "category": {
 *          "id": 1,
 *          "title": "Google Student Developer Club",
 *          "type": "CLUB",
 *          "image": null
 *      }
 *  }
 */
categoriesRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('id'),
  body_non_empty_string('title').optional(),
  body_enum('type', CategoryType).optional(),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = Number(req.body.id);
    const category: OrNull<Category> = {
      title: req.body.title,
      type: req.body.type as CategoryType,
    };

    if (req.files && 'image' in req.files) {
      try {
        category.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res);
        } else {
          return internalServerError(res);
        }
      }
    }

    try {
      res.status(200).json({
        category: await new Categories(user.id).edit(id, category)
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
 * [POST] /api/v1.0/categories/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 *
 * @response JSON
 *  {}
 */
categoriesRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = Number(req.body.id);

    try {
      await new Categories(user.id).delete(id);
      res.status(200).json({});
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res);
      } else {
        return internalServerError(res);
      }
    }
  },
);

export default categoriesRouter;

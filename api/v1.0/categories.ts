import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { Categories, Users } from '../../interfaces';
import { Category, CategoryType } from '../../models/category';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { cache, checkPermissions, checkReadOnly, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

const categoriesRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/categories
 * 
 * @param page number
 * @param type CategoryType|CategoryType[]
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
categoriesRouter.get('', async (req, res) => {
  var page = 1, type: CategoryType[] = [], query = '';

  const cachedCategories = cache.get(req.originalUrl);

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  if ('type' in req.query) {
    if (Array.isArray(req.query.type)) {
      const types = req.query.type;

      for (var i = 0; i < types.length; ++i) {
        const single = (types[i] as string).toUpperCase() as CategoryType;

        if (!(single in CategoryType)) {
          return invalidValueForParameter('type', res);
        }

        type.push(single);
      }
    } else {
      type.push((req.query.type as string).toUpperCase() as CategoryType);

      if (!(type[0] in CategoryType)) {
        return invalidValueForParameter('type', res);
      }
    }
  }

  if ('query' in req.query) {
    query = validator.escape((req.query.query as string).trim());
  }

  if (cachedCategories) {
    return res.status(200).json({
      categories: cachedCategories,
      types: Object.keys(CategoryType),
      next_page: page + 1
    });
  }

  try {
    const categories = await Categories.getAll(page, type, query);

    res.status(200).json({
      categories: categories,
      types: Object.keys(CategoryType),
      next_page: page + 1
    });
    
    cache.set(req.originalUrl, categories);
  } catch (_) {
    if (!res.headersSent) {
      internalServerError(res);
    }
  }
});

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
categoriesRouter.put('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, uploadMiddleware, async (req, res) => {
  const user = req.user!;

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  if (!('type' in req.body)) {
    return missingRequiredParameter('type', res);
  }

  const title = validator.escape(req.body.title.trim());
  const type = (req.body.type as string).toUpperCase() as CategoryType;

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  if (!(type in CategoryType)) {
    return invalidValueForParameter('type', res);
  }

  const category: Category = {
    title: title,
    type: type
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
});

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
categoriesRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, uploadMiddleware, async (req, res) => {
  const user = req.user!;
  const category: OrNull<Category> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (id == 0 || isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('title' in req.body) {
    category.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(category.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  if ('type' in req.body) {
    category.type = (req.body.type as string).toUpperCase() as CategoryType;

    if (!(category.type in CategoryType)) {
      return invalidValueForParameter('type', res);
    }
  }

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
});

/**
 * [POST] /api/v1.0/categories/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 *
 * @response JSON
 *  {}
 */
categoriesRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

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
});

export default categoriesRouter;

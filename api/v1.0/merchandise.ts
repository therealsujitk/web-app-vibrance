import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { Merchandise, Users } from '../../interfaces';
import { Merchandise as MerchandiseModel } from '../../models/merchandise';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { checkPermissions, checkReadOnly, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

const merchandiseRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/merchandise
 * 
 * @param page number
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
merchandiseRouter.get('', async (req, res) => {
  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  try {
    res.status(200).json({
      merchandise: await Merchandise.getAll(page),
      next_page: page + 1
    });
  } catch (_) {
    internalServerError(res);
  }
});

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
merchandiseRouter.put('/add', Users.checkAuth, checkPermissions(Permission.MERCHANDISE), checkReadOnly, uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }
  
  const user = req.user!;

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  if (!('cost' in req.body)) {
    return missingRequiredParameter('cost', res);
  }

  const title = validator.escape(req.body.title.trim());
  const cost = validator.toFloat(req.body.cost);

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  if (isNaN(cost)) {
    return invalidValueForParameter('cost', res);
  }

  const merchandise: MerchandiseModel = {
    title: title,
    cost: cost
  };

  if (req.files && 'image' in req.files) {
    try {
      merchandise.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
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
      merchandise: await new Merchandise(user.id).add(merchandise)
    });
  } catch (_) {
    internalServerError(res);
  }
});

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
merchandiseRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.MERCHANDISE), checkReadOnly, uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }
  
  const user = req.user!;
  const merchandise: OrNull<MerchandiseModel> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('title' in req.body) {
    merchandise.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(merchandise.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  if (req.files && 'image' in req.files) {
    try {
      merchandise.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res);
      } else {
        return internalServerError(res);
      }
    }
  }

  if ('cost' in req.body) {
    merchandise.cost = validator.toFloat(req.body.cost);

    if (isNaN(merchandise.cost)) {
      return invalidValueForParameter('cost', res);
    }
  }

  try {
    res.status(200).json({
      merchandise: await new Merchandise(user.id).edit(id, merchandise)
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
 * [POST] /api/v1.0/merchandise/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * 
 * @reponse JSON
 *  {}
 */
merchandiseRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.MERCHANDISE), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new Merchandise(user.id).delete(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

export default merchandiseRouter;

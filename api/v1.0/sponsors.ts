import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { Sponsors, Users } from '../../interfaces';
import { Sponsor } from '../../models/sponsor';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { checkPermissions, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

const sponsorsRouter = express.Router();
const uploadMiddleware = getUploadMiddleware(10);

/**
 * [GET] /api/v1.0/sponsors
 * 
 * @param page number
 * 
 * @response JSON
 *  {
 *      "sponsors": [
 *          {
 *              "id": 1,
 *              "title": "Google",
 *              "description": "Software Company",
 *              "image": "d3d6916d6105dae8a36cb24b97fdb2cf.jpeg"
 *          }
 *      ]
 *  }
 */
sponsorsRouter.get('', async (req, res) => {
  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }
  
  try {
    res.status(200).json({
      sponsors: await Sponsors.getAll(page)
    });
  } catch (_) {
    return internalServerError(res);
  }
});

/**
 * [POST] /api/v1.0/sponsors/add
 * 
 * @param title string (required)
 * @param description string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "sponsor": {
 *          "id": 7,
 *          "title": "Google",
 *          "description": "Software Company",
 *          "image": null
 *      }
 *  }
 */
sponsorsRouter.put('/add', Users.checkAuth, checkPermissions(Permission.SPONSORS), uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }
  
  const user = req.user!;

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  const title = validator.escape(req.body.title.trim());

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  const sponsor: Sponsor = {
    title: title
  };

  if ('description' in req.body) {
    sponsor.description = validator.escape(req.body.description);
  }

  if (req.files && 'image' in req.files) {
    try {
      sponsor.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
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
      sponsor: await new Sponsors(user.id).add(sponsor)
    });
  } catch (_) {
    internalServerError(res);
  }
});

/**
 * [POST] /api/v1.0/sponsors/edit
 * 
 * @param id number (required)
 * @param title string
 * @param description string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "sponsor": {
 *          "id": 1,
 *          "title": "Google",
 *          "description": "Software Company",
 *          "image": null
 *      }
 *  }
 */
sponsorsRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.SPONSORS), uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }
  
  const user = req.user!;
  const sponsor: OrNull<Sponsor> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if ('title' in req.body) {
    sponsor.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(sponsor.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  if ('description' in req.body) {
    sponsor.description = validator.escape(req.body.description);
  }

  if (req.files && 'image' in req.files) {
    try {
      sponsor.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
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
      sponsor: await new Sponsors(user.id).edit(id, sponsor)
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
 * [POST] /api/v1.0/sponsors/delete
 * 
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
sponsorsRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.SPONSORS), async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new Sponsors(user.id).delete(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

export default sponsorsRouter;

import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { ProShows, Users } from '../../interfaces';
import { ProShow } from '../../models/pro-show';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { checkPermissions, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

const proShowsRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/pro-shows
 * 
 * @param page number
 * 
 * @response JSON
 *  {
 *      "pro_shows": [
 *          {
 *              "id": 1,
 *              "day_id": 1,
 *              "room_id": 1,
 *              "description": "...",
 *              "image": null,
 *              "registration": null
 *          }
 *      ]
 *  }
 */
proShowsRouter.get('', async (req, res) => {
  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  try {
    res.status(200).json({
      pro_shows: await ProShows.getAll(page)
    });
  } catch (_) {
    internalServerError(res);
  }
});

/**
 * [POST] /api/v1.0/pro-shows/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param day_id number (required)
 * @param room_id number (required)
 * @param description string (required)
 * @param registration string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "pro_show": {
 *          "id": 1,
 *          "dayId": 1,
 *          "roomId": 1,
 *          "description": "...",
 *          "registration": null
 *      }
 *  }
 */
proShowsRouter.post('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }

  const user = req.user!;

  if (!('day_id' in req.body)) {
    return missingRequiredParameter('day_id', res);
  }

  if (!('room_id' in req.body)) {
    return missingRequiredParameter('room_id', res);
  }

  if (!('description' in req.body)) {
    return missingRequiredParameter('description', res);
  }

  const dayId = validator.toInt(req.body.day_id);
  const roomId = validator.toInt(req.body.room_id);
  const description = validator.escape(req.body.description.trim());

  if (isNaN(dayId)) {
    return invalidValueForParameter('day_id', res);
  }

  if (isNaN(roomId)) {
    return invalidValueForParameter('room_id', res);
  }

  if (validator.isEmpty(description)) {
    return invalidValueForParameter('description', res);
  }

  const proShow: ProShow = {
    day_id: dayId,
    room_id: roomId,
    description: description
  };
  
  if (req.files && 'image' in req.files) {
    try {
      proShow.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res);
      } else {
        return internalServerError(res);
      }
    }
  }

  if ('registration' in req.body) {
    proShow.registration = validator.escape(req.body.registration.trim());

    if (!validator.isURL(proShow.registration)) {
      return invalidValueForParameter('registration', res);
    }
  }

  try {
    res.status(200).json({
      pro_show: await new ProShows(user.id).add(proShow)
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
 * [POST] /api/v1.0/pro-shows/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param day_id number
 * @param room_id number
 * @param description string
 * @param registration string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "pro_show": {
 *          "id": 1,
 *          "dayId": 1,
 *          "roomId": 1,
 *          "description": "...",
 *          "registration": null
 *      }
 *  }
 */
proShowsRouter.post('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }

  const user = req.user!;
  const proShow: OrNull<ProShow> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('day_id' in req.body) {
    proShow.day_id = validator.toInt(req.body.day_id);

    if (isNaN(proShow.day_id)) {
      return invalidValueForParameter('day_id', res);
    }
  }

  if ('room_id' in req.body) {
    proShow.room_id = validator.toInt(req.body.room_id);

    if (isNaN(proShow.room_id)) {
      return invalidValueForParameter('room_id', res);
    }
  }

  if ('description' in req.body) {
    proShow.description = validator.escape(req.body.description.trim());

    if (validator.isEmpty(proShow.description)) {
      return invalidValueForParameter('description', res);
    }
  }
  
  if (req.files && 'image' in req.files) {
    try {
      proShow.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res);
      } else {
        return internalServerError(res);
      }
    }
  }

  if ('registration' in req.body) {
    proShow.registration = validator.escape(req.body.registration.trim());

    if (!validator.isURL(proShow.registration)) {
      return invalidValueForParameter('registration', res);
    }
  }

  try {
    res.status(200).json({
      pro_show: await new ProShows(user.id).edit(id, proShow)
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
 * [POST] /api/v1.0/pro-shows/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
proShowsRouter.post('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new ProShows(user.id).delete(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

export default proShowsRouter;

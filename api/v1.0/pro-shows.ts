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
 * @param day_id number|number[]
 * @param venue_id number|number[]
 * 
 * @response JSON
 *  {
 *      "pro_shows": [
 *          {
 *              "id": 2,
 *              "day_id": 1,
 *              "day": "Day 1",
 *              "room_id": 2,
 *              "room": "103",
 *              "venue": "Academic Block - 1",
 *              "description": "...",
 *              "image": null
 *          },
 *          ...
 *      ]
 *  }
 */
proShowsRouter.get('', async (req, res) => {
  var page = 1, dayIds = [], venueIds = [];

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  if ('day_id' in req.query) {
    if (Array.isArray(req.query.day_id)) {
      const day_ids = req.query.day_id;

      for (var i = 0; i < day_ids.length; ++i) {
        const dayId = validator.toInt(day_ids[i] as string);

        if (isNaN(dayId)) {
          return invalidValueForParameter('day_id', res);
        }

        dayIds.push(dayId);
      }
    } else {
      dayIds.push(validator.toInt(req.query.day_id as string));

      if (isNaN(dayIds[0])) {
        return invalidValueForParameter('day_id', res);
      }
    }
  }

  if ('venue_id' in req.query) {
    if (Array.isArray(req.query.venue_id)) {
      const venue_ids = req.query.venue_id;

      for (var i = 0; i < venue_ids.length; ++i) {
        const venueId = validator.toInt(venue_ids[i] as string);

        if (isNaN(venueId)) {
          return invalidValueForParameter('venue_id', res);
        }

        venueIds.push(venueId);
      }
    } else {
      venueIds.push(validator.toInt(req.query.venue_id as string));

      if (isNaN(venueIds[0])) {
        return invalidValueForParameter('venue_id', res);
      }
    }
  }

  try {
    res.status(200).json({
      pro_shows: await ProShows.getAll(page, dayIds, venueIds)
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
 *          "id": 2,
 *          "day_id": 1,
 *          "day": "Day 1",
 *          "room_id": 2,
 *          "room": "103",
 *          "venue": "Academic Block - 1",
 *          "description": "...",
 *          "image": null
 *      }
 *  }
 */
proShowsRouter.put('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), uploadMiddleware, async (req, res) => {
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

  const dayId = validator.toInt(req.body.day_id);
  const roomId = validator.toInt(req.body.room_id);

  if (isNaN(dayId)) {
    return invalidValueForParameter('day_id', res);
  }

  if (isNaN(roomId)) {
    return invalidValueForParameter('room_id', res);
  }

  const proShow: ProShow = {
    day_id: dayId,
    room_id: roomId
  };

  if ('title' in req.body) {
    proShow.title = validator.escape((req.body.title as string).trim());
  }

  if ('description' in req.body) {
    proShow.description = validator.escape((req.body.description as string).trim());
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
 *          "id": 2,
 *          "day_id": 1,
 *          "day": "Day 1",
 *          "room_id": 2,
 *          "room": "103",
 *          "venue": "Academic Block - 1",
 *          "description": "...",
 *          "image": null
 *      }
 *  }
 */
proShowsRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), uploadMiddleware, async (req, res) => {
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


  if ('title' in req.body) {
    proShow.title = validator.escape((req.body.title as string).trim());
  }

  if ('description' in req.body) {
    proShow.description = validator.escape((req.body.description as string).trim());
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
proShowsRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), async (req, res) => {
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

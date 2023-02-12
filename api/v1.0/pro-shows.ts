import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { ProShows, Users } from '../../interfaces';
import { ProShow } from '../../models/pro-show';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { getUTCFromString, OrNull, timeRegex } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { cache, checkPermissions, checkReadOnly, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

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
  var page = 1, query = '', dayIds = [], venueIds = [];

  const cachedProShows = cache.get(req.originalUrl);

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  if ('query' in req.query) {
    query = validator.escape((req.query.query as string).trim());
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

  if (cachedProShows && !(await Users.checkValidApiKey(req))) {
    return res.status(200).json({
      pro_shows: cachedProShows,
      next_page: page + 1
    });
  }

  try {
    const proShows = await ProShows.getAll(page, query, dayIds, venueIds);

    res.status(200).json({
      pro_shows: proShows,
      next_page: page + 1
    });

    cache.set(req.originalUrl, proShows);
  } catch (_) {
    if (!res.headersSent) {
      internalServerError(res);
    }
  }
});

/**
 * [POST] /api/v1.0/pro-shows/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param day_id number (required)
 * @param room_id number (required)
 * @param description string (required)
 * @param start_time HH:MM (required)
 * @param end_time HH:MM (required)
 * @param cost number
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
proShowsRouter.put('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, uploadMiddleware, async (req, res) => {
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

  if (!('start_time' in req.body)) {
    return missingRequiredParameter('start_time', res);
  }

  if (!('end_time' in req.body)) {
    return missingRequiredParameter('end_time', res);
  }

  const dayId = validator.toInt(req.body.day_id);
  const roomId = validator.toInt(req.body.room_id);
  const startTime = req.body.start_time.trim();
  const endTime = req.body.end_time.trim();

  if (isNaN(dayId)) {
    return invalidValueForParameter('day_id', res);
  }

  if (isNaN(roomId)) {
    return invalidValueForParameter('room_id', res);
  }

  if (!timeRegex.test(startTime)) {
    return invalidValueForParameter('start_time', res);
  }

  if (!timeRegex.test(endTime)) {
    return invalidValueForParameter('end_time', res);
  }

  const proShow: ProShow = {
    day_id: dayId,
    room_id: roomId,
    start_time: getUTCFromString('2020-01-01 ' + startTime),
    end_time: getUTCFromString('2020-01-01 ' + endTime),
    cost: 0
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

  if ('cost' in req.body) {
    proShow.cost = validator.toFloat(req.body.cost);

    if (isNaN(proShow.cost)) {
      return invalidValueForParameter('cost', res);
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
proShowsRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, uploadMiddleware, async (req, res) => {
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

  if ('start_time' in req.body) {
    const startTime = req.body.start_time.trim();

    if (!timeRegex.test(startTime)) {
      return invalidValueForParameter('start_time', res);
    } else {
      proShow.start_time = getUTCFromString('2020-01-01 ' + startTime);
    }
  }

  if ('end_time' in req.body) {
    const endTime = req.body.end_time.trim();

    if (!timeRegex.test(endTime)) {
      return invalidValueForParameter('end_time', res);
    } else {
      proShow.end_time = getUTCFromString('2020-01-01 ' + endTime);
    }
  }

  if ('cost' in req.body) {
    proShow.cost = validator.toFloat(req.body.cost);

    if (isNaN(proShow.cost)) {
      return invalidValueForParameter('cost', res);
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
proShowsRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
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

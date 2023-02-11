import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { Events, Users } from '../../interfaces';
import { Event } from '../../models/event';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { getUTCFromString, OrNull, timeRegex } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { cache, checkPermissions, checkReadOnly, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

const eventsRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/events
 * 
 * @param page number
 * @param day_id number|number[]
 * @param category_id number|number[]
 * @param venue_id number|number[]
 * 
 * @response JSON
 *  {
 *      "events": [
 *          {
 *              "id": 1,
 *              "day_id": 1,
 *              "category_id": 1,
 *              "venue_id": 1,
 *              "room_id": 1,
 *              "day": "Day 1",
 *              "category": "Google Developer Student Club",
 *              "venue": "Academic Block - 1",
 *              "room": null,
 *              "title": "House of Developers",
 *              "description": "...",
 *              "image": null,
 *              "start_datetime": "2020-02-06T12:30:00.000Z",
 *              "end_datetime": "2022-02-07T03:30:00.000Z",
 *              "cost": 100
 *          }
 *      ]
 *  }
 */
eventsRouter.get('', async (req, res) => {
  var page = 1, dayIds = [], categoryIds = [], venueIds = [];

  const cachedEvents = cache.get(req.originalUrl);

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

  if ('category_id' in req.query) {
    if (Array.isArray(req.query.category_id)) {
      const category_ids = req.query.category_id;

      for (var i = 0; i < category_ids.length; ++i) {
        const categoryId = validator.toInt(category_ids[i] as string);

        if (isNaN(categoryId)) {
          return invalidValueForParameter('category_id', res);
        }

        categoryIds.push(categoryId);
      }
    } else {
      categoryIds.push(validator.toInt(req.query.category_id as string));

      if (isNaN(categoryIds[0])) {
        return invalidValueForParameter('category_id', res);
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

  if (cachedEvents && !(await Users.checkValidApiKey(req))) {
    return res.status(200).json({
      events: cachedEvents,
      next_page: page + 1
    });
  }

  try {
    const events = await Events.getAll(page, dayIds, categoryIds, venueIds);

    res.status(200).json({
      events: events,
      next_page: page + 1
    });

    cache.set(req.originalUrl, events);
  } catch (e) {
    if (!res.headersSent) {
      internalServerError(res);
    }
  }
});

/**
 * [POST] /api/v1.0/events/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param day_id number (required)
 * @param category_id number (required)
 * @param room_id number (required)
 * @param title string (required)
 * @param description string
 * @param image File
 * @param team_size string
 * @param start_datetime YYYY-MM-DD HH:MM (required)
 * @param end_datetime YYYY-MM-DD HH:MM (required)
 * @param cost number
 * @param registration number
 * 
 * @response JSON
 *  {
 *      "event": {
 *          "id": 1,
 *          "day_id": 1,
 *          "category_id": 1,
 *          "venue_id": 1,
 *          "room_id": 1,
 *          "day": "Day 1",
 *          "category": "Google Developer Student Club",
 *          "venue": "Academic Block - 1",
 *          "room": null,
 *          "title": "House of Developers",
 *          "description": "...",
 *          "image": null,
 *          "start_datetime": "2020-02-06T12:30:00.000Z",
 *          "end_datetime": "2022-02-07T03:30:00.000Z",
 *          "cost": 100
 *      }
 *  }
 */
eventsRouter.put('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, uploadMiddleware, async (req, res) => {
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

  if (!('category_id' in req.body)) {
    return missingRequiredParameter('category_id', res);
  }

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  if (!('team_size_min' in req.body)) {
    return missingRequiredParameter('team_size_min', res);
  }

  if (!('team_size_max' in req.body)) {
    return missingRequiredParameter('team_size_max', res);
  }

  if (!('start_time' in req.body)) {
    return missingRequiredParameter('start_time', res);
  }

  if (!('end_time' in req.body)) {
    return missingRequiredParameter('end_time', res);
  }

  const dayId = validator.toInt(req.body.day_id);
  const categoryId = validator.toInt(req.body.category_id);
  const roomId = validator.toInt(req.body.room_id);
  const title = validator.escape(req.body.title.trim());
  const teamSizeMin = validator.toInt(req.body.team_size_min.trim());
  const teamSizeMax = validator.toInt(req.body.team_size_max.trim());
  const startTime = req.body.start_time.trim();
  const endTime = req.body.end_time.trim();

  if (isNaN(dayId)) {
    return invalidValueForParameter('day_id', res);
  }

  if (isNaN(categoryId)) {
    return invalidValueForParameter('category_id', res);
  }

  if (isNaN(roomId)) {
    return invalidValueForParameter('room_id', res);
  }

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  if (isNaN(teamSizeMin)) {
    return invalidValueForParameter('team_size_min', res);
  }

  if (isNaN(teamSizeMax)) {
    return invalidValueForParameter('team_size_max', res);
  }

  if (!timeRegex.test(startTime)) {
    return invalidValueForParameter('start_time', res);
  }

  if (!timeRegex.test(endTime)) {
    return invalidValueForParameter('end_time', res);
  }
  
  const event: Event = {
    day_id: dayId,
    category_id: categoryId,
    room_id: roomId,
    title: title,
    team_size_min: teamSizeMin,
    team_size_max: teamSizeMax,
    start_time: getUTCFromString('2020-01-01 ' + startTime),
    end_time: getUTCFromString('2020-01-01 ' + endTime),
    cost: 0
  }

  if ('description' in req.body) {
    event.description = validator.escape(req.body.description.trim());
  }

  if (req.files && 'image' in req.files) {
    try {
      event.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res);
      } else {
        return internalServerError(res);
      }
    }
  }

  if ('cost' in req.body) {
    event.cost = validator.toFloat(req.body.cost);

    if (isNaN(event.cost)) {
      return invalidValueForParameter('cost', res);
    }
  }

  try {
    res.status(200).json({
      event: await new Events(user.id).add(event)
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
 * [POST] /api/v1.0/events/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param day_id number
 * @param category_id number
 * @param room_id number
 * @param title string
 * @param description string
 * @param image File
 * @param team_size string
 * @param start_datetime YYYY-MM-DD HH:MM
 * @param end_datetime YYYY-MM-DD HH:MM
 * @param cost number
 * @param registration number
 * 
 * @response JSON
 *  {
 *      "event": {
 *          "id": 1,
 *          "day_id": 1,
 *          "category_id": 1,
 *          "venue_id": 1,
 *          "room_id": 1,
 *          "day": "Day 1",
 *          "category": "Google Developer Student Club",
 *          "venue": "Academic Block - 1",
 *          "room": null,
 *          "title": "House of Developers",
 *          "description": "...",
 *          "image": null,
 *          "start_datetime": "2020-02-06T12:30:00.000Z",
 *          "end_datetime": "2022-02-07T03:30:00.000Z",
 *          "cost": 100
 *      }
 *  }
 */
eventsRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }

  const user = req.user!;
  const event: OrNull<Event> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('day_id' in req.body) {
    event.day_id = validator.toInt(req.body.day_id);

    if (isNaN(event.day_id)) {
      return invalidValueForParameter('day_id', res);
    }
  }

  if ('category_id' in req.body) {
    event.category_id = validator.toInt(req.body.category_id);

    if (isNaN(event.category_id)) {
      return invalidValueForParameter('category_id', res);
    }
  }

  if ('room_id' in req.body) {
    event.room_id = validator.toInt(req.body.room_id);

    if (isNaN(event.room_id)) {
      return invalidValueForParameter('room_id', res);
    }
  }

  if ('title' in req.body) {
    event.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(event.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  if ('team_size_min' in req.body) {
    event.team_size_min = validator.toInt(req.body.team_size_min.trim());

    if (isNaN(event.team_size_min)) {
      return invalidValueForParameter('team_size_min', res);
    }
  }

  if ('team_size_max' in req.body) {
    event.team_size_max = validator.toInt(req.body.team_size_max.trim());

    if (isNaN(event.team_size_max)) {
      return invalidValueForParameter('team_size_max', res);
    }
  }

  if ('start_time' in req.body) {
    const startTime = req.body.start_time.trim();

    if (!timeRegex.test(startTime)) {
      return invalidValueForParameter('start_time', res);
    } else {
      event.start_time = getUTCFromString('2020-01-01 ' + startTime);
    }
  }

  if ('end_time' in req.body) {
    const endTime = req.body.end_time.trim();

    if (!timeRegex.test(endTime)) {
      return invalidValueForParameter('end_time', res);
    } else {
      event.end_time = getUTCFromString('2020-01-01 ' + endTime);
    }
  }

  if ('description' in req.body) {
    event.description = validator.escape(req.body.description.trim());
  }

  if (req.files && 'image' in req.files) {
    try {
      event.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res);
      } else {
        return internalServerError(res);
      }
    }
  }

  if ('cost' in req.body) {
    event.cost = validator.toFloat(req.body.cost);

    if (isNaN(event.cost)) {
      return invalidValueForParameter('cost', res);
    }
  }

  try {
    res.status(200).json({
      event: await new Events(user.id).edit(id, event)
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
 * [POST] /api/v1.0/events/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
eventsRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new Events(user.id).delete(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

export default eventsRouter;

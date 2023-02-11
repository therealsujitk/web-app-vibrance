import express from 'express';
import validator from 'validator';
import { Days, Users } from '../../interfaces';
import { Day } from '../../models/day';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { dateRegex, getUTCFromString, OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { cache, checkPermissions, checkReadOnly } from '../utils/helpers';

const daysRouter = express.Router();

/**
 * [GET] /api/v1.0/days
 * 
 * @param page number
 * @param query string
 * 
 * @response JSON
 *  {
 *  "days": [
 *          {
 *              "id": 1,
 *              "title": "Day 1",
 *              "date": "2020-02-05T18:30:00.000Z"
 *          },
 *          ...
 *      ]
 *  }
 */
daysRouter.get('', async (req, res) => {
  var page = 1, query = '';

  const cachedDays = cache.get(req.url);

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  if ('query' in req.query) {
    query = validator.escape((req.query.query as string).trim());
  }

  if (cachedDays) {
    return res.status(200).json({
      days: cachedDays,
      next_page: page + 1
    });
  }

  try {
    const days = await Days.getAll(page, query);

    res.status(200).json({
      days: days,
      next_page: page + 1
    });

    cache.set(req.url, days);
  } catch (_) {
    internalServerError(res);
  }
});

/**
 * [POST] /api/v1.0/days/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param title string (required)
 * @param date YYYY-MM-DD (required)
 * 
 * @response JSON
 *  {
 *      "day": {
 *          "id": 1,
 *          "title": "Day 1",
 *          "date": "2020-02-06T05:30:00.000Z"
 *      }
 *  }
 */
daysRouter.put('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  if (!('date' in req.body)) {
    return missingRequiredParameter('date', res);
  }

  const title = validator.escape(req.body.title.trim());
  const date = req.body.date.trim();

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  if (!dateRegex.test(date)) {
    return invalidValueForParameter('date', res);
  }

  const day: Day = {
    title: title,
    date: getUTCFromString(date)
  };

  try {
    res.status(200).json({
      day: await new Days(user.id).addDay(day)
    });
  } catch (_) {
    internalServerError(res);
  }
});

/**
 * [POST] /api/v1.0/days/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param title string
 * @param date YYYY-MM-DD
 * 
 * @response JSON
 *  {
 *      "day": {
 *          "id": 1,
 *          "title": "Day 1",
 *          "date": "2020-02-06T05:30:00.000Z"
 *      }
 *  }
 */
daysRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (id == 0 || isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  const day: OrNull<Day> = {};

  if ('title' in req.body) {
    day.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(day.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  if ('date' in req.body) {
    const date = req.body.date.trim();

    if (!dateRegex.test(date)) {
      return invalidValueForParameter('date', res);
    } else {
      day.date = getUTCFromString(date);
    }
  }

  try {
    res.status(200).json({
      day: await new Days(user.id).editDay(id, day)
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
 * [POST] /api/v1.0/days/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number
 * 
 * @response JSON
 *  {}
 */
daysRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (id == 0 || isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new Days(user.id).deleteDay(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

export default daysRouter;

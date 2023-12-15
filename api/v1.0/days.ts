import express, { Request, Response } from 'express';
import { Days, Users } from '../../interfaces';
import { Day } from '../../models/day';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { getUTCFromString, OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError } from '../utils/errors';
import { checkPermissions, checkReadOnly, getCacheOrFetch, handleValidationErrors } from '../utils/helpers';
import { body_date, body_non_empty_string, body_positive_integer, query_positive_integer } from '../utils/validators';
import { query } from 'express-validator';

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
daysRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  query('query').optional(),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const page = Number(req.query.page);
    const query = req.query.query as string|undefined;

    try {
      const days = await getCacheOrFetch(req, Days.getAll, [page, query]);

      res.status(200).json({
        days: days,
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
daysRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_non_empty_string('title'),
  body_date('date'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const title = req.body.title;
    const date = req.body.date;

    const day: Day = {
      title: title,
      date: getUTCFromString(date),
    };

    try {
      res.status(200).json({
        day: await new Days(user.id).addDay(day)
      });
    } catch (_) {
      internalServerError(res);
    }
  },
);

/**
 * [POST] /api/v1.0/days/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
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
daysRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('id'),
  body_non_empty_string('title').optional(),
  body_date('date').optional(),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = Number(req.body.id);
    const day: OrNull<Day> = {
      title: req.body.title,
      date: req.body.date && getUTCFromString(req.body.date),
    };

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
  },
);

/**
 * [POST] /api/v1.0/days/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
daysRouter.delete(
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
      await new Days(user.id).deleteDay(id);
      res.status(200).json({});
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res);
      } else {
        internalServerError(res);
      }
    }
  },
);

export default daysRouter;

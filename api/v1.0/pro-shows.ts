import express from 'express';
import { UploadedFile } from 'express-fileupload';
import { ProShows, Users } from '../../interfaces';
import { ProShow } from '../../models/pro-show';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { getUTCFromString, OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError } from '../utils/errors';
import { checkPermissions, checkReadOnly, getCacheOrFetch, getUploadMiddleware, handleFileUpload, handleValidationErrors, MIME_TYPE } from '../utils/helpers';
import { body, query } from 'express-validator';
import { body_amount, body_mobile_number, body_non_empty_string, body_positive_integer, body_time, query_positive_integer, query_positive_integer_array } from '../utils/validators';

const proShowsRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/pro-shows
 * 
 * @param page number
 * @param day_id number|number[]
 * @param venue_id number|number[]
 * @param query string
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
proShowsRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  query_positive_integer_array('day_id').optional(),
  query_positive_integer_array('venue_id').optional(),
  query('query').optional(),
  handleValidationErrors,
  async (req, res) => {
    const page = Number(req.query.page);
    const query = req.query.query as string|undefined;
    const dayIds = req.query.day_id as unknown as number[];
    const venueIds = req.query.venue_id as unknown as number[];

    try {
      const proShows = await getCacheOrFetch(req, ProShows.getAll, [page, query, dayIds, venueIds]);

      res.status(200).json({
        pro_shows: proShows,
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
 * [POST] /api/v1.0/pro-shows/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param day_id number (required)
 * @param room_id number (required)
 * @param title string
 * @param description string
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
proShowsRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('day_id'),
  body_positive_integer('room_id'),
  body_non_empty_string('title'),
  body_non_empty_string('description').optional(),
  body_time('start_time'),
  body_time('end_time'),
  body_amount('cost'),
  body('event_id').isInt().optional(),
  body_non_empty_string('faculty_coordinator_name').optional(),
  body_mobile_number('faculty_coordinator_mobile').optional(),
  body_non_empty_string('student_coordinator_name').optional(),
  body_mobile_number('student_coordinator_mobile').optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return;
    }

    const user = req.user!;
    const proShow: ProShow = {
      title: req.body.title,
      description: req.body.description,
      day_id: Number(req.body.day_id),
      room_id: Number(req.body.room_id),
      start_time: getUTCFromString('2020-01-01 ' + req.body.start_time),
      end_time: getUTCFromString('2020-01-01 ' + req.body.end_time),
      cost: Number(req.body.cost),
      event_id: Number(req.body.event_id ?? 0),
      faculty_coordinator_name: req.body.faculty_coordinator_name,
      faculty_coordinator_mobile: req.body.faculty_coordinator_mobile,
      student_coordinator_name: req.body.student_coordinator_name,
      student_coordinator_mobile: req.body.student_coordinator_mobile,
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
  },
);

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
proShowsRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('id'),
  body_positive_integer('day_id').optional(),
  body_positive_integer('room_id').optional(),
  body_non_empty_string('title').optional(),
  body_non_empty_string('description').optional(),
  body_time('start_time').optional(),
  body_time('end_time').optional(),
  body_amount('cost').optional(),
  body('event_id').isInt().optional(),
  body_non_empty_string('faculty_coordinator_name').optional(),
  body_mobile_number('faculty_coordinator_mobile').optional(),
  body_non_empty_string('student_coordinator_name').optional(),
  body_mobile_number('student_coordinator_mobile').optional(),
  handleValidationErrors,
  async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }

  const id = Number(req.body.id);
  const user = req.user!;
  const proShow: OrNull<ProShow> = {
    title: req.body.title,
    description: req.body.description,
    day_id: Number(req.body.day_id),
    room_id: Number(req.body.room_id),
    start_time: getUTCFromString('2020-01-01 ' + req.body.start_time),
    end_time: getUTCFromString('2020-01-01 ' + req.body.end_time),
    cost: Number(req.body.cost),
    event_id: Number(req.body.event_id),
    faculty_coordinator_name: req.body.faculty_coordinator_name,
    faculty_coordinator_mobile: req.body.faculty_coordinator_mobile,
    student_coordinator_name: req.body.student_coordinator_name,
    student_coordinator_mobile: req.body.student_coordinator_mobile,
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
proShowsRouter.delete(
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
      await new ProShows(user.id).delete(id);
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

export default proShowsRouter;

import express from 'express'
import { UploadedFile } from 'express-fileupload'
import { Events, Users } from '../../interfaces'
import { Event } from '../../models/event'
import { Permission } from '../../models/user'
import { ClientError } from '../../utils/errors'
import { getUTCFromString, OrNull } from '../../utils/helpers'
import { badRequestError, internalServerError } from '../utils/errors'
import {
  checkPermissions,
  checkReadOnly,
  getCacheOrFetch,
  getUploadMiddleware,
  handleFileUpload,
  handleValidationErrors,
  MIME_TYPE,
  toNumber,
} from '../utils/helpers'
import { body, query } from 'express-validator'
import {
  body_amount,
  body_mobile_number_or_null,
  body_non_empty_string,
  body_positive_integer,
  body_string_or_null,
  body_time,
  query_date_time,
  query_positive_integer,
  query_positive_integer_array,
} from '../utils/validators'

const eventsRouter = express.Router()
const uploadMiddleware = getUploadMiddleware()

/**
 * [GET] /api/v1.0/events
 *
 * @param page number
 * @param day_id number|number[]
 * @param category_id number|number[]
 * @param venue_id number|number[]
 * @param query string
 * @param before
 * @param after
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
eventsRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  query('query').optional(),
  query_positive_integer_array('day_id').optional(),
  query_positive_integer_array('category_id').optional(),
  query_positive_integer_array('venue_id').optional(),
  query_date_time('before').optional(),
  query_date_time('after').optional(),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!
    const query = req.query.query as string | undefined
    const dayIds = req.query.day_id as unknown as number[]
    const categoryIds = req.query.category_id as unknown as number[]
    const venueIds = req.query.venue_id as unknown as number[]
    const before = req.query.before as string
    const after = req.query.after as string

    try {
      const events = await getCacheOrFetch(req, Events.getAll, [
        page,
        query,
        dayIds,
        categoryIds,
        venueIds,
        before,
        after,
      ])

      res.status(200).json({
        events: events,
        next_page: page + 1,
      })
    } catch (_) {
      if (!res.headersSent) {
        internalServerError(res)
      }
    }
  },
)

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
eventsRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('day_id'),
  body_positive_integer('room_id'),
  body_positive_integer('category_id'),
  body_non_empty_string('title'),
  body_string_or_null('description').optional(),
  body_positive_integer('team_size_min'),
  body_positive_integer('team_size_max').optional(),
  body_time('start_time'),
  body_time('end_time'),
  body_amount('cost'),
  body('event_id').isInt().optional().withMessage("'event_id' must be a valid integer"),
  body_string_or_null('faculty_coordinator_name').optional(),
  body_mobile_number_or_null('faculty_coordinator_mobile').optional(),
  body_string_or_null('student_coordinator_name').optional(),
  body_mobile_number_or_null('student_coordinator_mobile').optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return
    }

    const user = req.user!
    const event: Event = {
      title: req.body.title,
      description: req.body.description,
      day_id: toNumber(req.body.day_id)!,
      room_id: toNumber(req.body.room_id)!,
      category_id: toNumber(req.body.category_id)!,
      start_time: getUTCFromString('2020-01-01 ' + req.body.start_time),
      end_time: getUTCFromString('2020-01-01 ' + req.body.end_time),
      team_size_min: toNumber(req.body.team_size_min)!,
      team_size_max: toNumber(req.body.team_size_max ?? req.body.team_size_min)!,
      cost: toNumber(req.body.cost)!,
      event_id: toNumber(req.body.event_id ?? 0)!,
      faculty_coordinator_name: req.body.faculty_coordinator_name,
      faculty_coordinator_mobile: req.body.faculty_coordinator_mobile,
      student_coordinator_name: req.body.student_coordinator_name,
      student_coordinator_mobile: req.body.student_coordinator_mobile,
    }

    if (req.files && 'image' in req.files) {
      try {
        event.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE)
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res)
        } else {
          return internalServerError(res)
        }
      }
    }

    try {
      res.status(200).json({
        event: await new Events(user.id).add(event),
      })
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res)
      } else {
        internalServerError(res)
      }
    }
  },
)

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
eventsRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('id'),
  body_positive_integer('day_id').optional(),
  body_positive_integer('room_id').optional(),
  body_positive_integer('category_id').optional(),
  body_non_empty_string('title').optional(),
  body_string_or_null('description').optional(),
  body_positive_integer('team_size_min').optional(),
  body_positive_integer('team_size_max').optional(),
  body_time('start_time').optional(),
  body_time('end_time').optional(),
  body_amount('cost').optional(),
  body('event_id').isInt().optional().withMessage("'event_id' must be a valid integer"),
  body_string_or_null('faculty_coordinator_name').optional(),
  body_mobile_number_or_null('faculty_coordinator_mobile').optional(),
  body_string_or_null('student_coordinator_name').optional(),
  body_mobile_number_or_null('student_coordinator_mobile').optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return
    }

    const user = req.user!
    const id = toNumber(req.body.id)!
    const event: OrNull<Event> = {
      title: req.body.title,
      description: req.body.description,
      day_id: toNumber(req.body.day_id),
      room_id: toNumber(req.body.room_id),
      category_id: toNumber(req.body.category_id),
      start_time: getUTCFromString('2020-01-01 ' + req.body.start_time),
      end_time: getUTCFromString('2020-01-01 ' + req.body.end_time),
      team_size_min: toNumber(req.body.team_size_min),
      team_size_max: toNumber(req.body.team_size_max),
      cost: toNumber(req.body.cost),
      event_id: toNumber(req.body.event_id ?? 0),
      faculty_coordinator_name: req.body.faculty_coordinator_name,
      faculty_coordinator_mobile: req.body.faculty_coordinator_mobile,
      student_coordinator_name: req.body.student_coordinator_name,
      student_coordinator_mobile: req.body.student_coordinator_mobile,
    }

    if (req.files && 'image' in req.files) {
      try {
        event.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE)
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res)
        } else {
          return internalServerError(res)
        }
      }
    }

    try {
      res.status(200).json({
        event: await new Events(user.id).edit(id, event),
      })
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res)
      } else {
        internalServerError(res)
      }
    }
  },
)

/**
 * [POST] /api/v1.0/events/delete
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 *
 * @response JSON
 *  {}
 */
eventsRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const id = toNumber(req.body.id)!

    try {
      await new Events(user.id).delete(id)
      res.status(200).json({})
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res)
      } else {
        internalServerError(res)
      }
    }
  },
)

export default eventsRouter

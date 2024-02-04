import express from 'express'
import { Venues, Users, Rooms } from '../../interfaces'
import { Room } from '../../models/room'
import { Permission } from '../../models/user'
import { Venue } from '../../models/venue'
import { ClientError } from '../../utils/errors'
import { OrNull } from '../../utils/helpers'
import { badRequestError, internalServerError } from '../utils/errors'
import { checkPermissions, checkReadOnly, getCacheOrFetch, handleValidationErrors, toNumber } from '../utils/helpers'
import { query } from 'express-validator'
import { body_non_empty_string, body_positive_integer, query_positive_integer } from '../utils/validators'

const venuesRouter = express.Router()

/**
 * [GET] /api/v1.0/venues
 *
 * @param page number
 * @param query string
 *
 * @response JSON
 *  {
 *      "venues": [
 *          {
 *              "id": 1,
 *              "title": "Academic Block - 1",
 *              "rooms": [
 *                  {
 *                      "id": 1,
 *                      "title": null
 *                  },
 *                  {
 *                      "id": 2,
 *                      "title": "101"
 *                  },
 *                  ...
 *              ]
 *          },
 *          ...
 *      ]
 *  }
 */
venuesRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  query('query').optional(),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!
    const query = req.query.query as string | undefined

    try {
      const venues = await getCacheOrFetch(req, Venues.getAll, [page, query])

      res.status(200).json({
        venues: venues,
        next_page: page + 1,
      })
    } catch (e) {
      if (!res.headersSent) {
        internalServerError(res)
      }
    }
  },
)

/**
 * [POST] /api/v1.0/venues/add
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param title string (required)
 *
 * @response JSON
 *  {
 *      "venue": {
 *          "id": 1,
 *          "title": "Academic Block - 1"
 *      }
 *  }
 */
venuesRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_non_empty_string('title'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const title = req.body.title

    try {
      res.status(200).json({
        venue: await new Venues(user.id).add({ title: title }),
      })
    } catch (_) {
      internalServerError(res)
    }
  },
)

/**
 * [POST] /api/v1.0/venues/edit
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param title string
 *
 * @response JSON
 *  {
 *      "venue": {
 *          "id": 2,
 *          "title": "Academic Block - 2"
 *      }
 *  }
 */
venuesRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('id'),
  body_non_empty_string('title').optional(),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const id = toNumber(req.body.id)!
    const venue: OrNull<Venue> = {
      title: req.body.title,
    }

    try {
      res.status(200).json({
        venue: await new Venues(user.id).edit(id, venue),
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
 * [POST] /api/v1.0/venues/delete
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 *
 * @response JSON
 *  {}
 */
venuesRouter.delete(
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
      await new Venues(user.id).delete(id)
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

/**
 * [GET] /api/v1.0/venues/rooms
 *
 * @param venue_id number (required)
 * @param page number
 *
 * @response JSON
 *  {
 *      "rooms": [
 *          {
 *              "id": 1,
 *              "title": null
 *          },
 *          {
 *              "id": 2,
 *              "title": "101"
 *          },
 *          ...
 *      ]
 *  }
 */
venuesRouter.get(
  '/rooms',
  query_positive_integer('page').optional(),
  query('page').default(1),
  query_positive_integer('venue_id'),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!
    const venueId = toNumber(req.query.venue_id)

    try {
      const rooms = await getCacheOrFetch(req, Rooms.getAll, [venueId, page])

      res.status(200).json({
        rooms: rooms,
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
 * [POST] /api/v1.0/venues/rooms/add
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param venue_id number (required)
 * @param title string (required)
 *
 * @response JSON
 *  {
 *      "room": {
 *          "id": 2,
 *          "venueId": 1,
 *          "title": "101"
 *      }
 *  }
 */
venuesRouter.put(
  '/rooms/add',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('venue_id'),
  body_non_empty_string('title'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const room: Room = {
      venue_id: toNumber(req.body.venue_id)!,
      title: req.body.title,
    }

    try {
      res.status(200).json({
        room: await new Rooms(user.id).add(room),
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
 * [POST] /api/v1.0/venues/rooms/edit
 *
 * @header X-Api-Key <API-KEY> (required)
 * @parma id number (required)
 * @param venue_id number
 * @param title string
 *
 * @response JSON
 *  {
 *      "room": {
 *          "id": 2,
 *          "venueId": 1,
 *          "title": "101"
 *      }
 *  }
 */
venuesRouter.patch(
  '/rooms/edit',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('id'),
  body_positive_integer('venue_id').optional(),
  body_non_empty_string('title').optional(),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const id = toNumber(req.body.id)!
    const room: OrNull<Room> = {
      venue_id: req.body.venue_id ? toNumber(req.body.venue_id) : undefined,
      title: req.body.title,
    }

    try {
      res.status(200).json({
        room: await new Rooms(user.id).edit(id, room),
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
 * [POST] /api/v1.0/venues/rooms/delete
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 *
 * @response JSON
 *  {}
 */
venuesRouter.delete(
  '/rooms/delete',
  Users.checkAuth,
  checkPermissions(Permission.EVENTS),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const id = toNumber(req.body.id)!

    try {
      await new Rooms(user.id).delete(id)
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

export default venuesRouter

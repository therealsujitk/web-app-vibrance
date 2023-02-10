import express from 'express';
import validator from 'validator';
import { Venues, Users, Rooms } from '../../interfaces';
import { Room } from '../../models/room';
import { Permission } from '../../models/user';
import { Venue } from '../../models/venue';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { checkPermissions, checkReadOnly } from '../utils/helpers';

const venuesRouter = express.Router();

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
venuesRouter.get('', async (req, res) => {
  var page = 1, query = '';

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  if ('query' in req.query) {
    query = validator.escape((req.query.query as string).trim());
  }

  try {
    res.status(200).json({
      venues: await Venues.getAll(page, query),
      next_page: page + 1
    });
  } catch (e) {console.log(e)
    internalServerError(res);
  }
});

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
venuesRouter.put('/add', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  const title = validator.escape(req.body.title.trim());

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  try {
    res.status(200).json({
      venue: await new Venues(user.id).add({title: title})
    });
  } catch (_) {
    internalServerError(res);
  }
});

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
venuesRouter.patch('/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;
  const venue: OrNull<Venue> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('title' in req.body) {
    venue.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(venue.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  try {
    res.status(200).json({
      venue: await new Venues(user.id).edit(id, venue)
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
 * [POST] /api/v1.0/venues/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
venuesRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new Venues(user.id).delete(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

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
 venuesRouter.get('/rooms', async (req, res) => {
  
  if (!('venue_id' in req.body)) {
    return missingRequiredParameter('venue_id', res);
  }

  const venueId = validator.toInt(req.body.venue_id);

  if (isNaN(venueId)) {
    return invalidValueForParameter('venue_id', res);
  }

  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  try {
    res.status(200).json({
      rooms: await Rooms.getAll(venueId, page),
      next_page: page + 1
    });
  } catch (_) {
    internalServerError(res);
  }
});

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
venuesRouter.put('/rooms/add', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('venue_id' in req.body)) {
    return missingRequiredParameter('venue_id', res);
  }

  if (!('title' in req.body)) {
    return missingRequiredParameter('title', res);
  }

  const venueId = validator.toInt(req.body.venue_id);
  const title = validator.escape(req.body.title.trim());

  if (isNaN(venueId)) {
    return invalidValueForParameter('venue_id', res);
  }

  if (validator.isEmpty(title)) {
    return invalidValueForParameter('title', res);
  }

  const room: Room = {
    venue_id: venueId,
    title: title
  }

  try {
    res.status(200).json({
      room: await new Rooms(user.id).add(room)
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
 venuesRouter.patch('/rooms/edit', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;
  const room: OrNull<Room> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('venue_id' in req.body) {
    room.venue_id = validator.toInt(req.body.venue_id);

    if (isNaN(room.venue_id)) {
      return invalidValueForParameter('venue_id', res);
    }
  }

  if ('title' in req.body) {
    room.title = validator.escape(req.body.title.trim());

    if (validator.isEmpty(room.title)) {
      return invalidValueForParameter('title', res);
    }
  }

  try {
    res.status(200).json({
      room: await new Rooms(user.id).edit(id, room)
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
 * [POST] /api/v1.0/venues/rooms/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
venuesRouter.delete('/rooms/delete', Users.checkAuth, checkPermissions(Permission.EVENTS), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  try {
    await new Rooms(user.id).delete(id);
    res.status(200).json({});
  } catch (err) {
    if (err instanceof ClientError) {
      badRequestError(err, res);
    } else {
      internalServerError(res);
    }
  }
});

export default venuesRouter;

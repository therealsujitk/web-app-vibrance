import { transaction, query } from "../config/db";
import { LogAction } from "../models/log-entry";
import { Event } from "../models/event";
import { getDateTimeFromUTC, getMysqlErrorCode, getUTCFromString, isEqual, OrNull } from "../utils/helpers";
import Activities from "./audit-log";
import Images from "./images";
import { ClientError } from "../utils/errors";
import { IMAGE_URL, LIMIT } from "../utils/constants";

export default class Events {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1, dayIds: number[] = [], categoryIds: number[] = [], venueIds: number[] = []) {
    const offset = (page - 1) * LIMIT;

    dayIds.push(0);
    categoryIds.push(0);
    venueIds.push(0);

    return await query("SELECT " + 
      "`events`.`id` AS `id`, " + 
      "`days`.`title` AS `day`, " +
      "`categories`.`title` AS `category`, " +
      "`venues`.`title` AS `venue`, " +
      "`rooms`.`title` AS `room`, " +
      "`events`.`title` AS `title`, " + 
      "`events`.`description` AS `description`, " +
      "CONCAT('" +  IMAGE_URL + "', `images`.`image`) AS `image`, " +
      "`events`.`start_datetime` AS `start_datetime`, " +
      "`events`.`end_datetime` AS `end_datetime`, " +
      "`events`.`cost` AS `cost`, " +
      "`events`.`registration` AS `registration` " +
      "FROM (`events`, `days`, `categories`, `venues`, `rooms`) " +
      "LEFT JOIN `images` ON `events`.`image_id` = `images`.`id` " +
      "WHERE " +
      "`day_id` = `days`.`id` AND " +
      "`category_id` = `categories`.`id` AND " +
      "`room_id` = `rooms`.`id` AND " +
      "`venue_id` = `venues`.`id` AND " +
      "(1 = ? OR `day_id` IN (?)) AND " +
      "(1 = ? OR `category_id` IN (?)) AND " +
      "(1 = ? OR `venue_id` IN (?)) " +
      "ORDER BY `events`.`title` " +
      "LIMIT ? OFFSET ?", [dayIds.length, dayIds, categoryIds.length, categoryIds, venueIds.length, venueIds, LIMIT, offset]);
  }

  async #get(id: number) : Promise<Event> {
    const event = (await query("SELECT " +
      "`day_id`, " +
      "`category_id`, " +
      "`room_id`, " +
      "`events`.`title` AS `title`, " +
      "`description`, " +
      "`image`, " +
      "`team_size`, " +
      "`start_datetime`, " +
      "`end_datetime`, " +
      "`cost`, " +
      "`registration` " +
      "FROM `events` " +
      "LEFT JOIN `images` " +
      "ON `events`.`image_id` = `images`.`id`" +
      "WHERE `events`.`id` = ?", [id]))[0];

    if (typeof event === 'undefined') {
      throw new ClientError(`No event with id '${id}' exists.`);
    }

    return {
      day_id: event.day_id,
      category_id: event.category_id,
      room_id: event.room_id,
      title: event.title,
      description: event.description,
      image: event.image,
      team_size: event.team_size,
      start_datetime: getUTCFromString(event.start_datetime),
      end_datetime: getUTCFromString(event.end_datetime),
      cost: event.cost,
      registration: event.registration
    };
  }

  async add(event: Event) {
    const existing = await Images.get(event.image);
    const queries = [
      ...!existing && event.image ? [Images.createInsertQuery(event.image)] : [],
      {
        query: "INSERT INTO `events` (`day_id`, `category_id`, `room_id`, `title`, `description`, `image_id`, `team_size`, `start_datetime`, `end_datetime`, `cost`, `registration`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        options: (results: any[]) => [
          event.day_id,
          event.category_id,
          event.room_id,
          event.title,
          event.description,
          existing?.id ?? (event.image ? results[0].insertId : undefined),
          event.team_size,
          getDateTimeFromUTC(event.start_datetime),
          getDateTimeFromUTC(event.end_datetime),
          event.cost,
          event.registration
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.EVENT_ADD,
        newValue: event
      })
    ];

    try {
      return {
        id: (await transaction(queries))[!existing && event.image ? 1 : 0].insertId,
        ...event,
        image: event.image ? IMAGE_URL + event.image : null
      };
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'day_id', 'category_id' or 'room_id' does not exist.");
      } else {
        throw err;
      }
    }
  }

  async edit(id: number, event: OrNull<Event>) {
    const old = await this.#get(id);
    event.day_id = event.day_id ?? old.day_id;
    event.category_id = event.category_id ?? old.category_id;
    event.room_id = event.room_id ?? old.room_id;
    event.title = event.title ?? old.title;
    event.description = event.description ?? old.description;
    event.image = event.image ?? old.image;
    event.team_size = event.team_size ?? old.team_size;
    event.start_datetime = event.start_datetime ?? old.start_datetime;
    event.end_datetime = event.end_datetime ?? old.end_datetime;
    event.cost = event.cost ?? old.cost;
    event.registration = event.registration ?? old.registration;
    const existing = await Images.get(event.image);

    if (isEqual<Event>(old, event as Event)) {
      return { id, ...event };
    }

    const queries = [
      ...!existing && event.image ? [Images.createInsertQuery(event.image)] : [],
      {
        query: "UPDATE `events` SET `day_id` = ?, `category_id` = ?, `room_id` = ?, `title` = ?, `description` = ?, `image_id` = ?, `team_size` = ?, `start_datetime` = ?, `end_datetime` = ?, `cost` = ?, `registration` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          event.day_id,
          event.category_id,
          event.room_id,
          event.title,
          event.description,
          existing?.id ?? (event.image ? results[0].insertId : undefined),
          event.team_size,
          getDateTimeFromUTC(event.start_datetime!),
          getDateTimeFromUTC(event.end_datetime!),
          event.cost,
          event.registration,
          id
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.EVENT_EDIT,
        oldValue: old,
        newValue: event
      })
    ];

    try {
      await transaction(queries);
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'day_id', 'category_id' or 'room_id' does not exist.");
      } else {
        throw err;
      }
    }

    return { 
      id, 
      ...event,
      image: event.image ? IMAGE_URL + event.image : null
    };
  }

  async delete(id: number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `events` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.EVENT_DELETE,
        oldValue: old
      })
    ];

    await transaction(queries);
  }
}

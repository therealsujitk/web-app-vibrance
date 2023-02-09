import { transaction, query } from "../config/db";
import { LogAction } from "../models/log-entry";
import { Event } from "../models/event";
import { getMysqlErrorCode, getTimeFromUTC, getUTCFromString, isEqual, OrNull } from "../utils/helpers";
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
      "`day_id`, " + 
      "`category_id`, " + 
      "`venue_id`, " + 
      "`room_id`, " + 
      "`days`.`title` AS `day`, " +
      "`days`.`date` AS `date`, " +
      "`categories`.`title` AS `category`, " +
      "`venues`.`title` AS `venue`, " +
      "`rooms`.`title` AS `room`, " +
      "`events`.`title` AS `title`, " + 
      "`events`.`description` AS `description`, " +
      "CONCAT('" +  IMAGE_URL + "', `images`.`image`) AS `image`, " +
      "CONCAT('" +  IMAGE_URL + "', `c_images`.`image`) AS `category_image`, " +
      "`team_size_min`, " +
      "`team_size_max`, " +
      "`events`.`start_time` AS `start_time`, " +
      "`events`.`end_time` AS `end_time`, " +
      "`events`.`cost` AS `cost` " +
      "FROM (`events`, `days`, `categories`, `venues`, `rooms`) " +
      "LEFT JOIN `images` ON `events`.`image_id` = `images`.`id` " +
      "LEFT JOIN `images` AS `c_images` ON `categories`.`image_id` = `c_images`.`id` " +
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

  async #get(id: number) : Promise<any> {
    const event = (await query(this.#createSelectQueryString(), [id]))[0];

    if (typeof event === 'undefined') {
      throw new ClientError(`No event with id '${id}' exists.`);
    }

    return {
      ...event,
      start_time: getUTCFromString('2020-01-01 ' + event.start_time),
      end_time: getUTCFromString('2020-01-01 ' + event.end_time)
    };
  }

  #createSelectQueryString() {
    return "SELECT " + 
      "`events`.`id` AS `id`, " + 
      "`day_id`, " + 
      "`category_id`, " + 
      "`venue_id`, " + 
      "`room_id`, " + 
      "`days`.`title` AS `day`, " +
      "`days`.`date` AS `date`, " +
      "`categories`.`title` AS `category`, " +
      "`venues`.`title` AS `venue`, " +
      "`rooms`.`title` AS `room`, " +
      "`events`.`title` AS `title`, " + 
      "`events`.`description` AS `description`, " +
      "`images`.`image` AS `image`, " +
      "`c_images`.`image` AS `category_image`, " +
      "`team_size_min`, " +
      "`team_size_max`, " +
      "`events`.`start_time` AS `start_time`, " +
      "`events`.`end_time` AS `end_time`, " +
      "`events`.`cost` AS `cost` " +
      "FROM (`events`, `days`, `categories`, `venues`, `rooms`) " +
      "LEFT JOIN `images` ON `events`.`image_id` = `images`.`id` " +
      "LEFT JOIN `images` AS `c_images` ON `categories`.`image_id` = `c_images`.`id` " +
      "WHERE " +
      "`day_id` = `days`.`id` AND " +
      "`category_id` = `categories`.`id` AND " +
      "`room_id` = `rooms`.`id` AND " +
      "`venue_id` = `venues`.`id` AND " +
      "`events`.`id` = ?";
  }

  #reduceObject(ob: any) : Event {
    return {
      day_id: ob.day_id,
      category_id: ob.category_id,
      room_id : ob.room_id,
      title: ob.title,
      description: ob.description,
      image: ob.image,
      team_size_min: ob.team_size_min,
      team_size_max: ob.team_size_max,
      start_time: ob.start_time,
      end_time: ob.end_time,
      cost: ob.cost
    };
  }

  async add(event: Event) {
    const existing = await Images.get(event.image);
    const queries = [
      ...!existing && event.image ? [Images.createInsertQuery(event.image)] : [],
      {
        query: "INSERT INTO `events` (`day_id`, `category_id`, `room_id`, `title`, `description`, `image_id`, `team_size_min`, `team_size_max`, `start_time`, `end_time`, `cost`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        options: (results: any[]) => [
          event.day_id,
          event.category_id,
          event.room_id,
          event.title,
          event.description,
          existing?.id ?? (event.image ? results[0].insertId : undefined),
          event.team_size_min,
          event.team_size_max,
          getTimeFromUTC(event.start_time),
          getTimeFromUTC(event.end_time),
          event.cost
        ]
      },
      {
        query: this.#createSelectQueryString(),
        options: (results: any[]) => {
          return [results[!existing && event.image ? 1 : 0].insertId];
        }
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.EVENT_ADD,
        newValue: event
      })
    ];

    try {
      const results = await transaction(queries);
      const result = results[results.length - 2][0];

      return {
        ...result,
        image: result.image ? IMAGE_URL + result.image : null,
        category_image: result.category_image ? IMAGE_URL + result.category_image : null
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
    const oldReduced = this.#reduceObject(old);
    event.day_id = event.day_id ?? old.day_id;
    event.category_id = event.category_id ?? old.category_id;
    event.room_id = event.room_id ?? old.room_id;
    event.title = event.title ?? old.title;
    event.description = event.description ?? old.description;
    event.image = event.image ?? old.image;
    event.team_size_min = event.team_size_min ?? old.team_size_min;
    event.team_size_max = event.team_size_max ?? old.team_size_max;
    event.start_time = event.start_time ?? old.start_time;
    event.end_time = event.end_time ?? old.end_time;
    event.cost = event.cost ?? old.cost;
    const existing = await Images.get(event.image);

    if (isEqual<Event>(oldReduced, event as Event)) {
      return {
        ...old,
        image: old.image ? IMAGE_URL + old.image : null,
        category_image: old.category_image ? IMAGE_URL + old.category_image : null,
        start_time: getTimeFromUTC(event.start_time!),
        end_time: getTimeFromUTC(event.end_time!)
      }
    }

    const queries = [
      ...!existing && event.image ? [Images.createInsertQuery(event.image)] : [],
      {
        query: "UPDATE `events` SET `day_id` = ?, `category_id` = ?, `room_id` = ?, `title` = ?, `description` = ?, `image_id` = ?, `team_size_min` = ?, `team_size_max` = ?, `start_time` = ?, `end_time` = ?, `cost` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          event.day_id,
          event.category_id,
          event.room_id,
          event.title,
          event.description,
          existing?.id ?? (event.image ? results[0].insertId : undefined),
          event.team_size_min,
          event.team_size_max,
          getTimeFromUTC(event.start_time!),
          getTimeFromUTC(event.end_time!),
          event.cost,
          id
        ]
      },
      {
        query: this.#createSelectQueryString(),
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.EVENT_EDIT,
        oldValue: {
          ...oldReduced,
          start_time: getTimeFromUTC(oldReduced.start_time),
          end_time: getTimeFromUTC(oldReduced.end_time)
        },
        newValue: event
      })
    ];

    try {
      const results = await transaction(queries);
      const result = results[results.length - 2][0];

      return {
        ...result,
        image: result.image ? IMAGE_URL + result.image : null,
        category_image: result.category_image ? IMAGE_URL + result.category_image : null,
        start_time: getTimeFromUTC(event.start_time!),
        end_time: getTimeFromUTC(event.end_time!)
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

  async delete(id: number) {
    const old = await this.#get(id);
    const oldReduced = this.#reduceObject(old);
    const queries = [
      {
        query: "DELETE FROM `events` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.EVENT_DELETE,
        oldValue: oldReduced
      })
    ];

    await transaction(queries);
  }
}

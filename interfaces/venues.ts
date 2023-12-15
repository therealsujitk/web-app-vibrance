import { transaction, query } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { Venue } from '../models/venue';
import { getMysqlErrorCode, isEqual, OrNull } from '../utils/helpers';
import { ClientError } from '../utils/errors';
import { LIMIT } from '../utils/constants';

export default class Venues {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1, searchQuery = '') {
    const offset = (page - 1) * LIMIT;
    searchQuery = `%${searchQuery}%`;

    const result = await query("SELECT " +
      "`venue_id` AS `id`, " +
      "`rooms`.`id` AS `room_id`, " +
      "`venues`.`title` AS `title`, " +
      "`rooms`.`title` AS `room` " +
      "FROM `rooms` " + 
      "INNER JOIN (SELECT * FROM `venues` ORDER BY `title` LIMIT ? OFFSET ?) AS `venues`" +
      "WHERE `venue_id` = `venues`.`id` " + 
      "AND CONCAT(`venues`.`title`, ' - ', COALESCE(`rooms`.`title`, '')) LIKE ? " +
      "ORDER BY `venues`.`title`, `rooms`.`title`", [LIMIT, offset, searchQuery]);
    
    const venues_map: { [x: number]: number } = {};
    const venues = [];

    for (var i = 0; i < result.length; ++i) {
      const record = result[i];
      const room = {
        id: record.room_id,
        title: record.room
      }

      if (record.id in venues_map) {
        venues[venues_map[record.id]].rooms.push(room);
      } else {
        delete record.room_id;
        delete record.room;
        record.rooms = [room];

        venues_map[record.id] = venues.length;
        venues.push(record);
      }
    }

    return venues;
  }

  async #get(id: number) : Promise<Venue> {
    const venue = (await query("SELECT * FROM `venues` WHERE `id`", [id]))[0];

    if (typeof venue === 'undefined') {
      throw new ClientError(`No venue with id '${id}' exists.`);
    }

    return {
      title: venue.title
    };
  }

  async add(venue: Venue) {
    const queries = [
      {
        query: "INSERT INTO `venues` (`title`) VALUES (?)",
        options: [venue.title]
      },
      {
        query: "INSERT INTO `rooms` (`venue_id`) VALUES (?)",
        options: (results: any[]) => [results[0].insertId]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.VENUE_ADD,
        newValue: venue
      })
    ];

    return {
      id: (await transaction(queries))[0].insertId,
      ...venue
    };
  }

  async edit(id : number, venue: OrNull<Venue>) {
    const old = await this.#get(id);
    venue.title = venue.title ?? old.title;

    if (isEqual<Venue>(old, venue as Venue)) {
      return { id, ...venue };
    }

    const queries = [
      {
        query: "UPDATE `venues` SET `title` = ? WHERE `id` = ?",
        options: [venue.title, id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.VENUE_EDIT,
        oldValue: old,
        newValue: venue
      })
    ];

    await transaction(queries);
    return { id, ...venue };
  }

  async delete(id : number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `rooms` WHERE `venue_id` = ? AND `title` IS NULL",
        options: [id]
      },
      {
        query: "DELETE FROM `venues` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.VENUE_DELETE,
        oldValue: old
      })
    ];

    try {
      await transaction(queries);
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_ROW_IS_REFERENCED')) {
        throw new ClientError("Venue contains one or more rooms or is being used by one or more events.");
      } else {
        throw err;
      }
    }
  }
}

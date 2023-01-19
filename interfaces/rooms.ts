import { transaction, query } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { Room } from '../models/room';
import { getMysqlErrorCode, isEqual, OrNull } from '../utils/helpers';
import { ClientError } from '../utils/errors';
import { LIMIT } from '../utils/constants';

export default class Venues {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(venueId: number, page = 1) {
    const offset = (page - 1) * LIMIT;

    return await query("SELECT `id`, `title` FROM `rooms` WHERE `venue_id` = ? LIMIT ? OFFSET ?", [venueId, LIMIT, offset]);
  }

  async #get(id: number) : Promise<Room> {
    const room = (await query("SELECT * FROM `rooms` WHERE `id` = ?", [id]))[0];

    if (typeof room === 'undefined') {
      throw new ClientError(`No room with id '${id}' exists.`);
    }

    return {
      venue_id: room.venue_id,
      title: room.title
    };
  }

  async add(room: Room) {
    const queries = [
      {
        query: "INSERT INTO `rooms` (`venue_id`, `title`) VALUES (?, ?)",
        options: [room.venue_id, room.title]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.ROOM_ADD,
        newValue: room
      })
    ];

    try {
      return {
        id: (await transaction(queries))[0].insertId,
        ...room
      };
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'venue_id' does not exist.");
      } else {
        throw err;
      }
    }
  }

  async edit(id: number, room: OrNull<Room>) {
    const old = await this.#get(id);
    room.title = room.title ?? old.title;
    room.venue_id = room.venue_id ?? old.venue_id;

    if (isEqual<Room>(old, room as Room)) {
      return { id, ...room };
    }

    const queries = [
      {
        query: "UPDATE `rooms` SET `venue_id` = ?, `title` = ? WHERE `id` = ? AND `title` IS NOT NULL",
        options: [room.venue_id, room.title, id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.ROOM_EDIT,
        newValue: room
      })
    ];

    try {
      await transaction(queries);
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'venue_id' does not exist.");
      } else {
        throw err;
      }
    }

    return { id, ...room };
  }

  async delete(id : number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `rooms` WHERE `id` = ? AND `title` IS NOT NULL",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.ROOM_DELETE,
        oldValue: old
      })
    ];

    try {
      await transaction(queries);
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_ROW_IS_REFERENCED')) {
        throw new ClientError("Room is being used by one or more events or pro shows.");
      } else {
        throw err;
      }
    }
  }
}

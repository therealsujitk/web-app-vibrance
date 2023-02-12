import { transaction, query } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { ProShow } from '../models/pro-show';
import { getMysqlErrorCode, getTimeFromUTC, getUTCFromString, isEqual, OrNull } from '../utils/helpers';
import Images from './images';
import { ClientError } from '../utils/errors';
import { IMAGE_URL, LIMIT } from '../utils/constants';

export default class ProShows {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1, searchQuery = '', dayIds: number[] = [], venueIds: number[] = []) {
    const offset = (page - 1) * LIMIT;

    searchQuery = `%${searchQuery}%`;
    dayIds.push(0);
    venueIds.push(0);

    return await query("SELECT " + 
      "`pro_shows`.`id` AS `id`, " +
      "`day_id`, " + 
      "`venue_id`, " +
      "`room_id`, " + 
      "`days`.`title` AS `day`, " +
      "`venues`.`title` AS `venue`,  " +
      "`rooms`.`title` AS `room`, " +
      "`pro_shows`.`title` AS `title`, " +
      "`description`, " + 
      "CONCAT('" + IMAGE_URL + "', `images`.`image`) AS `image`, " +
      "`start_time`, " +
      "`end_time`, " +
      "`cost` " +
      "FROM (`pro_shows`, `days`, `rooms`, `venues`) " +
      "LEFT JOIN `images` ON `image_id` = `images`.`id` " +
      "WHERE `pro_shows`.`title` LIKE ? " +
      "AND `day_id` = `days`.`id` " +
      "AND `room_id` = `rooms`.`id` " +
      "AND `venue_id` = `venues`.`id` " +
      "AND (1 = ? OR `day_id` IN (?)) " +
      "AND (1 = ? OR `venue_id` IN (?)) " +
      "ORDER BY `days`.`date` " +
      "LIMIT ? OFFSET ?", [searchQuery, dayIds.length, dayIds, venueIds.length, venueIds, LIMIT, offset]);
  }

  async #get(id: number) : Promise<any> {
    const proShow = (await query(this.#createSelectQueryString(), [id]))[0];

    if (typeof proShow === 'undefined') {
      throw new ClientError(`No pro show with id '${id}' exists.`);
    }

    return {
      ...proShow,
      start_time: getUTCFromString('2020-01-01 ' + proShow.start_time),
      end_time: getUTCFromString('2020-01-01 ' + proShow.end_time)
    };
  }

  #createSelectQueryString() {
    return "SELECT " + 
      "`pro_shows`.`id` AS `id`, " +
      "`day_id`, " + 
      "`venue_id`, " +
      "`room_id`, " + 
      "`days`.`title` AS `day`, " +
      "`venues`.`title` AS `venue`,  " +
      "`rooms`.`title` AS `room`, " +
      "`pro_shows`.`title` AS `title`, " +
      "`description`, " + 
      "`images`.`image` AS `image`, " +
      "`start_time`, " +
      "`end_time`, " +
      "`cost` " +
      "FROM (`pro_shows`, `days`, `rooms`, `venues`) " +
      "LEFT JOIN `images` ON `image_id` = `images`.`id` " +
      "WHERE `day_id` = `days`.`id` " +
      "AND `room_id` = `rooms`.`id` " +
      "AND `venue_id` = `venues`.`id` " +
      "AND `pro_shows`.`id` = ?";
  }

  #reduceObject(ob: any) : ProShow {
    return {
      day_id: ob.day_id,
      room_id: ob.room_id,
      title: ob.title,
      description: ob.description,
      image: ob.image,
      start_time: ob.start_time,
      end_time: ob.end_time,
      cost: ob.cost
    };
  }

  async add(proShow: ProShow) {
    const existing = await Images.get(proShow.image);
    const queries = [
      ...!existing && proShow.image ? [Images.createInsertQuery(proShow.image)] : [],
      {
        query: "INSERT INTO `pro_shows` (`day_id`, `room_id`, `title`, `description`, `image_id`, `start_time`, `end_time`, `cost`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        options: (results: any[]) => [
          proShow.day_id,
          proShow.room_id,
          proShow.title,
          proShow.description,
          existing?.id ?? (proShow.image ? results[0].insertId : undefined),
          getTimeFromUTC(proShow.start_time),
          getTimeFromUTC(proShow.end_time),
          proShow.cost
        ]
      },
      {
        query: this.#createSelectQueryString(),
        options: (results: any[]) => {
          return [results[!existing && proShow.image ? 1 : 0].insertId];
        }
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.PRO_SHOW_ADD,
        newValue: proShow
      })
    ];

    try {
      const results = await transaction(queries);
      const result = results[results.length - 2][0];

      return {
        ...result,
        image: result.image ? IMAGE_URL + result.image : null
      };
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'day_id' or 'room_id' does not exist.");
      } else {
        throw err;
      }
    }
  }

  async edit(id : number, proShow: OrNull<ProShow>) {
    const old = await this.#get(id);
    const oldReduced = this.#reduceObject(old);
    proShow.day_id = proShow.day_id ?? old.day_id;
    proShow.room_id = proShow.room_id ?? old.room_id;
    proShow.title = proShow.title ?? old.title;
    proShow.description = proShow.description ?? old.description;
    proShow.image = proShow.image ?? old.image;
    const existing = await Images.get(proShow.image);

    if (isEqual<ProShow>(oldReduced, proShow as ProShow)) {
      return {
        ...old,
        image: old.image ? IMAGE_URL + old.image : null,
        start_time: getTimeFromUTC(old.start_time!),
        end_time: getTimeFromUTC(old.end_time!)
      }
    }

    const queries = [
      ...!existing && proShow.image ? [Images.createInsertQuery(proShow.image)] : [],
      {
        query: "UPDATE `pro_shows` SET `day_id` = ?, `room_id` = ?, `title` = ?, `description` = ?, `image_id` = ?, `start_time` = ?, `end_time` = ?, `cost` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          proShow.day_id,
          proShow.room_id,
          proShow.title === '' ? null : proShow.title,
          proShow.description === '' ? null : proShow.description,
          existing?.id ?? (proShow.image ? results[0].insertId : undefined),
          getTimeFromUTC(proShow.start_time!),
          getTimeFromUTC(proShow.end_time!),
          proShow.cost,
          id
        ]
      },
      {
        query: this.#createSelectQueryString(),
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.PRO_SHOW_EDIT,
        oldValue: oldReduced,
        newValue: proShow
      })
    ];

    try {
      const results = await transaction(queries);
      const result = results[results.length - 2][0];

      return {
        ...result,
        image: result.image ? IMAGE_URL + result.image : null
      };
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'day_id' or 'room_id' does not exist.");
      } else {
        throw err;
      }
    }
  }

  async delete(id : number) {
    const old = await this.#get(id);
    const oldReduced = this.#reduceObject(old);
    const queries = [
      {
        query: "DELETE FROM `pro_shows` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.PRO_SHOW_DELETE,
        oldValue: oldReduced
      })
    ];

    await transaction(queries);
  }
}

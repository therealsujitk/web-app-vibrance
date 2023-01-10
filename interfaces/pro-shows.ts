import { transaction, query } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { ProShow } from '../models/pro-show';
import { getMysqlErrorCode, isEqual, OrNull } from '../utils/helpers';
import Images from './images';
import { ClientError } from '../utils/errors';
import { IMAGE_URL, LIMIT } from '../utils/constants';

export default class ProShows {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const offset = (page - 1) * LIMIT;

    return await query("SELECT * FROM `pro_shows` LIMIT ? OFFSET ?", [LIMIT, offset]);
  }

  async #get(id: number) : Promise<ProShow> {
    const proShow = (await query("SELECT * FROM `pro_shows` WHERE `id` = ?", [id]))[0];

    if (typeof proShow === 'undefined') {
      throw new ClientError(`No pro show with id '${id}' exists.`);
    }

    return {
      day_id: proShow.day_id,
      room_id: proShow.room_id,
      description: proShow.description,
      image: proShow.image,
      registration: proShow.registration
    };
  }

  async add(proShow: ProShow) {
    const existing = await Images.get(proShow.image);
    const queries = [
      ...!existing && proShow.image ? [Images.createInsertQuery(proShow.image)] : [],
      {
        query: "INSERT INTO `pro_shows` (`day_id`, `room_id`, `description`, `image_id`, `registration`) VALUES (?, ?, ?, ?, ?)",
        options: (results: any[]) => [
          proShow.day_id,
          proShow.room_id,
          proShow.description,
          existing?.id ?? proShow.image ? results[0].insertId : undefined,
          proShow.registration
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.PRO_SHOW_ADD,
        newValue: proShow
      })
    ];

    try {
      return {
        id: (await transaction(queries))[!existing && proShow.image ? 1 : 0].insertId,
        ...proShow,
        image: proShow.image ? IMAGE_URL + proShow.image : null
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
    proShow.day_id = proShow.day_id ?? old.day_id;
    proShow.room_id = proShow.room_id ?? old.room_id;
    proShow.description = proShow.description ?? old.description;
    proShow.image = proShow.image ?? old.image;
    proShow.registration = proShow.registration ?? old.registration;
    const existing = await Images.get(proShow.image);

    if (isEqual<ProShow>(old, proShow as ProShow)) {
      return { id, ...proShow };
    }

    const queries = [
      ...!existing && proShow.image ? [Images.createInsertQuery(proShow.image)] : [],
      {
        query: "UPDATE `pro_shows` SET `day_id` = ?, `room_id` = ?, `description` = ?, `image_id` = ?, `registration` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          proShow.day_id,
          proShow.room_id,
          proShow.description,
          existing?.id ?? proShow.image ? results[0].insertId : undefined,
          proShow.registration,
          id
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.PRO_SHOW_EDIT,
        oldValue: old,
        newValue: proShow
      })
    ];

    try {
      await transaction(queries);
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_NO_REFERENCED_ROW')) {
        throw new ClientError("Given 'day_id' or 'room_id' does not exist.");
      } else {
        throw err;
      }
    }

    return { 
      id, 
      ...proShow,
      image: proShow.image ? IMAGE_URL + proShow.image : null
    };
  }

  async delete(id : number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `pro_shows` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.PRO_SHOW_DELETE,
        oldValue: old
      })
    ];

    await transaction(queries);
  }
}

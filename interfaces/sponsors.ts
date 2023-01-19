import { transaction, query } from '../config/db';
import Activities from './audit-log';
import Images from './images';
import { LogAction } from '../models/log-entry';
import { Sponsor } from '../models/sponsor';
import { isEqual, OrNull } from '../utils/helpers';
import { ClientError } from '../utils/errors';
import { IMAGE_URL, LIMIT } from '../utils/constants';

export default class Sponsors {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const offset = (page - 1) * LIMIT;

    return await query("SELECT " + 
      "`sponsors`.`id` AS `id`, " + 
      "`title`, " + 
      "`description`, " + 
      "CONCAT('" + IMAGE_URL + "', `image`) AS `image` " + 
      "FROM `sponsors` " + 
      "LEFT JOIN `images` " + 
      "ON `image_id` = `images`.`id` " + 
      "LIMIT ? OFFSET ?", [LIMIT, offset]);
  }

  async #get(id: number) {
    const sponsor = (await query("SELECT `title`, `description`, `image` FROM `sponsors` LEFT JOIN `images` ON `image_id` = `images`.`id` WHERE `sponsors`.`id` = ?", [id]))[0];

    if (typeof sponsor === 'undefined') {
      throw new ClientError(`No sponsor with id '${id}' exists.`);
    }

    return sponsor;
  }

  async add(sponsor: Sponsor) {
    const existing = await Images.get(sponsor.image);
    const queries = [
      ...!existing && sponsor.image ? [Images.createInsertQuery(sponsor.image)] : [],
      {
        query: "INSERT INTO `sponsors` (`title`, `description`, `image_id`) VALUES (?, ?, ?)",
        options: (results: any[]) => [
          sponsor.title,
          sponsor.description,
          existing?.id ?? (sponsor.image ? results[0].insertId : undefined)
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.SPONSOR_ADD,
        newValue: sponsor
      })
    ];
  
    return {
      id: (await transaction(queries))[!existing && sponsor.image ? 1 : 0].insertId,
      ...sponsor,
      image: sponsor.image ? IMAGE_URL + sponsor.image : null
    };
  }

  async edit(id: number, sponsor: OrNull<Sponsor>) {
    const old = await this.#get(id);
    sponsor.title = sponsor.title ?? old.title;
    sponsor.description = sponsor.description ?? old.description;
    sponsor.image = sponsor.image ?? old.image;
    const existing = await Images.get(sponsor.image);

    if (isEqual<Sponsor>(old, sponsor as Sponsor)) {
      return { id, ...sponsor };
    }

    const queries = [
      ...!existing && sponsor.image ? [Images.createInsertQuery(sponsor.image)] : [],
      {
        query: "UPDATE `sponsors` SET `title` = ?, `description` = ?, `image_id` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          sponsor.title,
          sponsor.description,
          existing?.id ?? (sponsor.image ? results[0].insertId : undefined),
          id
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.SPONSOR_EDIT,
        oldValue: old,
        newValue: sponsor
      })
    ];
  
    await transaction(queries);
    return { 
      id,
      ...sponsor,
      image: sponsor.image ? IMAGE_URL + sponsor.image : null
    };
  }

  async delete(id: number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `sponsors` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.SPONSOR_DELETE,
        oldValue: old
      })
    ];
  
    await transaction(queries);
  }
}

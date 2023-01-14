import { transaction, query } from '../config/db';
import Activities from './audit-log';
import Images from './images';
import { LogAction } from '../models/log-entry';
import { ClientError } from '../utils/errors';
import { IMAGE_URL, LIMIT } from '../utils/constants';

export default class Gallery {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const offset = (page - 1) * LIMIT;

    return await query("SELECT " + 
      "`gallery`.`id` AS `id`, " + 
      "CONCAT('" + IMAGE_URL + "', `image`) AS `image` " + 
      "FROM `gallery`, `images` " + 
      "WHERE `image_id` = `images`.`id` LIMIT ? OFFSET ?", [LIMIT, offset]);
  }

  async #get(id: number) {
    return (await query("SELECT `image` FROM `gallery`, `images` WHERE `images`.`id` = `image_id` AND `gallery`.`id` = ?", [id]))[0];
  }

  async add(images: string[]) {
    const imageQueries = [];
    const galleryQueries = [];
    const auditLogQuery = Activities.createInsertQuery({
      actor: this.userId,
      action: LogAction.GALLERY_ADD,
      newValue: { images: images }
    });

    for (var i = 0; i < images.length; ++i) {
      const existing = await Images.get(images[i]);

      if (!existing) {
        imageQueries.push(Images.createInsertQuery(images[i]))
        galleryQueries.push({
          query: "INSERT INTO `gallery` (`image_id`) VALUES (?)",
          options: (results: any[]) => [results[imageQueries.length - 1].insertId]
        });
      } else {
        galleryQueries.push({
          query: "INSERT INTO `gallery` (`image_id`) VALUES (?)",
          options: [existing.id]
        });
      }
    }

    const results = await transaction([ ...imageQueries, ...galleryQueries, auditLogQuery ]);
    
    return images.map((image, i) => {
      return {
        id: results[i + imageQueries.length].insertId,
        image: image ? IMAGE_URL + image : null
      };
    });
  }

  async delete(id: number) {
    const old = await this.#get(id);

    if (typeof old === 'undefined') {
      throw new ClientError(`No gallery image with id '${id}' exists.`);
    }

    const queries = [
      {
        query: "DELETE FROM `gallery` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.GALLERY_DELETE,
        oldValue: { image: old.image }
      })
    ];
  
    await transaction(queries);
  }
}

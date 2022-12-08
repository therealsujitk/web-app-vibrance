import { transaction, query } from '../config/db';
import Activities from './audit-log';
import Images from './images';
import { LogAction } from '../models/log-entry';
import { ClientError } from '../utils/errors';

export default class Gallery {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    return await query("SELECT `gallery`.`id` AS `id`, `image` FROM `gallery`, `images` WHERE `image_id` = `images`.`id` LIMIT ? OFFSET ?", [limit, offset]);
  }

  async #get(id: number) {
    return (await query("SELECT `image` FROM `gallery`, `images` WHERE `images`.`id` = `image_id` AND `gallery`.`id` = ?", [id]))[0];
  }

  async add(images: string[]) {
    const imageQueries = [];
    const galleryQueries = [];
    const auditLogQueries = [];

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

      auditLogQueries.push(Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.GALLERY_ADD,
        newValue: { image: images[i] }
      }));
    }

    const results = await transaction([ ...imageQueries, ...galleryQueries, ...auditLogQueries ]);
    
    return images.map((image, i) => {
      return {
        id: results[i + imageQueries.length].insertId,
        image: image
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
  
    return (await transaction(queries))[0].insertId;
  }
}

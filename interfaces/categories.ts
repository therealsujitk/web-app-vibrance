import { transaction, query } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { Category, CategoryType } from '../models/category';
import { getMysqlErrorCode, isEqual, OrNull } from '../utils/helpers';
import Images from './images';
import { ClientError } from '../utils/errors';

export default class Categories {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1, types: CategoryType[] = []) {
    const limit = 10;
    const offset = (page - 1) * limit;

    return await query("SELECT `categories`.`id` AS `id`, `title`, `type`, `image` FROM `categories` LEFT JOIN `images` ON `images`.`id` = `image_id` WHERE (1 = ? OR `type` IN (?)) ORDER BY `title` LIMIT ? OFFSET ?", [types.length + 1, types.length == 0 ? [0] : types, limit, offset]);
  }

  async #get(id: number) : Promise<Category> {
    const category = (await query("SELECT * FROM `categories` WHERE `id` = ?", [id]))[0];

    if (typeof category === 'undefined') {
      throw new ClientError(`No category with id '${id}' exists.`);
    }

    return {
      title: category.title,
      type: category.type,
      image: category.image
    }
  }

  async add(category: Category) {
    const existing = await Images.get(category.image);
    const queries = [
      ...!existing && category.image ? [Images.createInsertQuery(category.image)] : [],
      {
        query: "INSERT INTO `categories` (`title`, `type`, `image_id`) VALUES (?, ?, ?)",
        options: (results: any[]) => [
          category.title,
          category.type,
          existing?.id ?? (category.image ? results[0].insertId : undefined)
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.CATEGORY_ADD,
        newValue: category
      })
    ];

    return {
      id: (await transaction(queries))[!existing && category.image ? 1 : 0].insertId,
      ...category
    };
  }

  async edit(id : number, category: OrNull<Category>) {
    const old = await this.#get(id);
    category.title = category.title ?? old.title;
    category.type = category.type ?? old.type;
    category.image = category.image ?? old.image;
    const existing = await Images.get(category.image);

    if (isEqual<Category>(old, category as Category)) {
      return { id, ...category };
    }

    const queries = [
      ...!existing && category.image ? [Images.createInsertQuery(category.image)] : [],
      {
        query: "UPDATE `categories` SET `title` = ?, `type` = ?, `image_id` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          category.title,
          category.type,
          existing?.id ?? (category.image ? results[0].insertId : undefined),
          id
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.CATEGORY_EDIT,
        oldValue: old,
        newValue: category
      })
    ];

    await transaction(queries);
    return { id, ...category };
  }

  async delete(id : number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `categories` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.CATEGORY_DELETE,
        oldValue: old
      })
    ];

    try {
      await transaction(queries);
    } catch (err) {
      const code = getMysqlErrorCode(err);

      if ((code as string).startsWith('ER_ROW_IS_REFERENCED')) {
        throw new ClientError("Category is being used by one or more events.");
      } else {
        throw err;
      }
    }
  }
}

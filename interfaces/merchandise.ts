import { transaction, query } from '../config/db'
import Activities from './audit-log'
import { LogAction } from '../models/log-entry'
import { Merchandise as MerchandiseModel } from '../models/merchandise'
import { isEqual, OrNull } from '../utils/helpers'
import Images from './images'
import { ClientError } from '../utils/errors'
import { IMAGE_URL, LIMIT } from '../utils/constants'

export default class Merchandise {
  userId: number

  constructor(userId: number) {
    this.userId = userId
  }

  static async getAll(page = 1, searchQuery = '') {
    const offset = (page - 1) * LIMIT

    searchQuery = `%${searchQuery}%`

    return await query(
      'SELECT ' +
        '`merchandise`.`id` AS `id`, ' +
        '`title`, ' +
        "CONCAT('" +
        IMAGE_URL +
        "', `image`) AS `image`, " +
        '`cost` ' +
        'FROM `merchandise` ' +
        'LEFT JOIN `images` ' +
        'ON `images`.`id` = `image_id` ' +
        'WHERE ' +
        '`title` LIKE ? ' +
        'ORDER BY `title` LIMIT ? OFFSET ?',
      [searchQuery, LIMIT, offset],
    )
  }

  async #get(id: number): Promise<MerchandiseModel> {
    const merchandise = (
      await query(
        'SELECT `title`, `image`, `cost` FROM `merchandise` LEFT JOIN `images` ON `image_id` = `images`.`id` WHERE `merchandise`.`id` = ?',
        [id],
      )
    )[0]

    if (typeof merchandise === 'undefined') {
      throw new ClientError(`No merchandise with id '${id}' exists.`)
    }

    return {
      title: merchandise.title,
      image: merchandise.image,
      cost: merchandise.cost,
    }
  }

  async add(merchandise: MerchandiseModel) {
    const existing = await Images.get(merchandise.image)
    const queries = [
      ...(!existing && merchandise.image ? [Images.createInsertQuery(merchandise.image)] : []),
      {
        query: 'INSERT INTO `merchandise` (`title`, `image_id`, `cost`) VALUES (?, ?, ?)',
        options: (results: any[]) => [
          merchandise.title,
          existing?.id ?? (merchandise.image ? results[0].insertId : undefined),
          merchandise.cost,
        ],
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.MERCHANDISE_ADD,
        newValue: merchandise,
      }),
    ]

    return {
      id: (await transaction(queries))[!existing && merchandise.image ? 1 : 0].insertId,
      ...merchandise,
      image: merchandise.image ? IMAGE_URL + merchandise.image : null,
    }
  }

  async edit(id: number, merchandise: OrNull<MerchandiseModel>) {
    const old = await this.#get(id)
    merchandise.title = merchandise.title ?? old.title
    merchandise.cost = merchandise.cost ?? old.cost

    if (merchandise.image !== null) {
      merchandise.image = merchandise.image ?? old.image
    }

    const existing = await Images.get(merchandise.image)

    if (isEqual<MerchandiseModel>(old, merchandise as MerchandiseModel)) {
      return { id, ...merchandise }
    }

    const queries = [
      ...(!existing && merchandise.image ? [Images.createInsertQuery(merchandise.image)] : []),
      {
        query: 'UPDATE `merchandise` SET `title` = ?, `image_id` = ?, `cost` = ? WHERE `id` = ?',
        options: (results: any[]) => [
          merchandise.title,
          existing?.id ?? (merchandise.image ? results[0].insertId : undefined),
          merchandise.cost,
          id,
        ],
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.MERCHANDISE_EDIT,
        oldValue: old,
        newValue: merchandise,
      }),
    ]

    await transaction(queries)
    return {
      id,
      ...merchandise,
      image: merchandise.image ? IMAGE_URL + merchandise.image : null,
    }
  }

  async delete(id: number) {
    const old = await this.#get(id)
    const queries = [
      {
        query: 'DELETE FROM `merchandise` WHERE `id` = ?',
        options: [id],
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.MERCHANDISE_DELETE,
        oldValue: old,
      }),
    ]

    await transaction(queries)
  }
}

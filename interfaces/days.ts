import { transaction, query } from '../config/db'
import Activities from './audit-log'
import { LogAction } from '../models/log-entry'
import { Day } from '../models/day'
import { getDateFromUTC, getMysqlErrorCode, getUTCFromString, isEqual, OrNull } from '../utils/helpers'
import { ClientError } from '../utils/errors'
import { LIMIT } from '../utils/constants'

export default class Days {
  userId: number

  constructor(userId: number) {
    this.userId = userId
  }

  static async getAll(page = 1, searchQuery = '') {
    const offset = (page - 1) * LIMIT
    searchQuery = `%${searchQuery}%`

    return await query('SELECT * FROM `days` WHERE `title` LIKE ? OR `date` LIKE ? ORDER BY `date` LIMIT ? OFFSET ?', [
      searchQuery,
      searchQuery,
      LIMIT,
      offset,
    ])
  }

  async #get(id: number): Promise<Day> {
    const day = (await query('SELECT * FROM `days` WHERE `id` = ?', [id]))[0]

    if (typeof day === 'undefined') {
      throw new ClientError(`No day with id '${id}' exists.`)
    }

    return {
      title: day.title,
      date: getUTCFromString(day.date),
    }
  }

  async addDay(day: Day) {
    const queries = [
      {
        query: 'INSERT INTO `days` (`title`, `date`) VALUES (?, ?)',
        options: [day.title, getDateFromUTC(day.date)],
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.DAY_ADD,
        newValue: day,
      }),
    ]

    return {
      id: (await transaction(queries))[0].insertId,
      ...day,
    }
  }

  async editDay(id: number, day: OrNull<Day>) {
    const old = await this.#get(id)
    day.title = day.title ?? old.title
    day.date = day.date ?? old.date

    if (isEqual<Day>(old, day as Day)) {
      return { id, ...day }
    }

    const queries = [
      {
        query: 'UPDATE `days` SET `title` = ?, `date` = ? WHERE `id` = ?',
        options: [day.title, getDateFromUTC(day.date), id],
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.DAY_EDIT,
        oldValue: old,
        newValue: day,
      }),
    ]

    await transaction(queries)
    return { id, ...day }
  }

  async deleteDay(id: number) {
    const old = await this.#get(id)
    const queries = [
      {
        query: 'DELETE FROM `days` WHERE `id` = ?',
        options: [id],
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.DAY_DELETE,
        oldValue: old,
      }),
    ]

    try {
      await transaction(queries)
    } catch (err) {
      const code = getMysqlErrorCode(err)

      if ((code as string).startsWith('ER_ROW_IS_REFERENCED')) {
        throw new ClientError('Day is being used by one or more events or pro shows.')
      } else {
        throw err
      }
    }
  }
}

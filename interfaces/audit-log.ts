import { query } from '../config/db'
import { LogEntry } from '../models/log-entry'
import { LIMIT } from '../utils/constants'

export default class AuditLog {
  constructor() {}

  static async getAll(page = 1, actors: number[] = []) {
    const offset = (page - 1) * LIMIT
    actors.push(0)

    return await query(
      'SELECT ' +
        '`audit_log`.`id` AS `id`, ' +
        '`username` AS `actor`, ' +
        '`action`, ' +
        '`old`, ' +
        '`new`, ' +
        '`timestamp` ' +
        'FROM `audit_log` ' +
        'LEFT JOIN `users` ON `users`.`id` = `actor` ' +
        'WHERE (1 = ? OR `actor` IN (?))' +
        'ORDER BY `id` DESC LIMIT ? OFFSET ?',
      [actors.length, actors, LIMIT, offset],
    )
  }

  static createInsertQuery(logEntry: LogEntry) {
    return {
      query: 'INSERT INTO `audit_log` (`actor`, `action`, `old`, `new`) VALUES (?, ?, ?, ?)',
      options: [logEntry.actor, logEntry.action, JSON.stringify(logEntry.oldValue), JSON.stringify(logEntry.newValue)],
    }
  }
}

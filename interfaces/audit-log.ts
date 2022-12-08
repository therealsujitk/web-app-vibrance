import { query } from '../config/db';
import { LogEntry } from '../models/log-entry';

export default class AuditLog {
  constructor() {}

  static async getAll(page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    return await query("SELECT `audit_log`.`id` AS `id`, `username` AS `actor`, `action`, `old`, `new`, `timestamp` FROM `audit_log` LEFT JOIN `users` ON `users`.`id` = `actor` ORDER BY `id` DESC LIMIT ? OFFSET ?", [limit, offset]);
  }

  static createInsertQuery(logEntry: LogEntry) {
    return {
      query: "INSERT INTO `audit_log` (`actor`, `action`, `old`, `new`) VALUES (?, ?, ?, ?)",
      options: [logEntry.actor, logEntry.action, JSON.stringify(logEntry.oldValue), JSON.stringify(logEntry.newValue)]
    };
  }
}

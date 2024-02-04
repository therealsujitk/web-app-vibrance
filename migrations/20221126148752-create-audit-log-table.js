const { LogAction } = require('../models/log-entry')

;('use strict')

var dbm
var type
var seed

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate
  type = dbm.dataType
  seed = seedLink
}

exports.up = function (db) {
  return db.createTable('audit_log', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    actor: {
      type: type.INTEGER,
      foreignKey: {
        name: 'audit_log_user_id_fk',
        table: 'users',
        mapping: 'id',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'RESTRICT',
        },
      },
    },
    action: { type: `enum('${Object.keys(LogAction).join("','")}')`, notNull: true },
    old: { type: type.TEXT },
    new: { type: type.TEXT },
    timestamp: { type: type.TIMESTAMP, defaultValue: 'CURRENT_TIMESTAMP' },
  })
}

exports.down = function (db) {
  return db.dropTable('audit_log')
}

exports._meta = {
  version: 1,
}

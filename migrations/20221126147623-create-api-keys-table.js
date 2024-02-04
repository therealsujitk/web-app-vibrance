'use strict'

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
  return db.createTable('api_keys', {
    api_key: { type: type.STRING, primaryKey: true, notNull: true },
    user_id: {
      type: type.INTEGER,
      notNull: true,
      foreignKey: {
        name: 'api_keys_user_id_fk',
        table: 'users',
        mapping: 'id',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
        },
      },
    },
    date_created: { type: type.TIMESTAMP, notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
  })
}

exports.down = function (db) {
  return db.dropTable('api_keys')
}

exports._meta = {
  version: 1,
}

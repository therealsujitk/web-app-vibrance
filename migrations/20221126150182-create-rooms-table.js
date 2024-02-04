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
  return db.createTable('rooms', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    venue_id: {
      type: type.INTEGER,
      notNull: true,
      foreignKey: {
        name: 'rooms_venue_id_fk',
        table: 'venues',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT',
        },
      },
    },
    title: { type: type.STRING },
  })
}

exports.down = function (db) {
  return db.dropTable('rooms')
}

exports._meta = {
  version: 1,
}

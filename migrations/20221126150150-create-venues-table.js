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
  return db.createTable('venues', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    title: { type: type.STRING, notNull: true },
  })
}

exports.down = function (db) {
  return db.dropTable('venues')
}

exports._meta = {
  version: 1,
}

const { CategoryType } = require('../models/category')

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
  return db.createTable('categories', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    title: { type: type.STRING, notNull: true },
    type: { type: `enum('${Object.keys(CategoryType).join("','")}')`, notNull: true },
    image_id: {
      type: type.INTEGER,
      foreignKey: {
        name: 'categories_image_id_fk',
        table: 'images',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT',
        },
      },
    },
  })
}

exports.down = function (db) {
  return db.dropTable('categories')
}

exports._meta = {
  version: 1,
}

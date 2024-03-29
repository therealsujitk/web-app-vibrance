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
  return db.createTable('events', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    day_id: {
      type: type.INTEGER,
      notNull: true,
      foreignKey: {
        name: 'events_day_id_fk',
        table: 'days',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT',
        },
      },
    },
    category_id: {
      type: type.INTEGER,
      notNull: true,
      foreignKey: {
        name: 'events_category_id_fk',
        table: 'categories',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT',
        },
      },
    },
    room_id: {
      type: type.INTEGER,
      notNull: true,
      foreignKey: {
        name: 'events_room_id_fk',
        table: 'rooms',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT',
        },
      },
    },
    title: { type: type.STRING, notNull: true },
    description: type.TEXT,
    image_id: {
      type: type.INTEGER,
      foreignKey: {
        name: 'events_image_id_fk',
        table: 'images',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT',
        },
      },
    },
    team_size_min: { type: type.INTEGER, notNull: true },
    team_size_max: { type: type.INTEGER, notNull: true },
    cost: { type: type.REAL, notNull: true, defaultValue: 0 },
    start_time: { type: type.TIME, notNull: true },
    end_time: { type: type.TIME, notNull: true },
    faculty_coordinator_name: type.STRING,
    faculty_coordinator_mobile: type.STRING,
    student_coordinator_name: type.STRING,
    student_coordinator_mobile: type.STRING,
  })
}

exports.down = function (db) {
  return db.dropTable('events')
}

exports._meta = {
  version: 1,
}

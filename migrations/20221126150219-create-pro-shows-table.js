'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('pro_shows', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    day_id: { type: type.INTEGER, notNull: true, foreignKey: {
      name: 'pro_shows_day_id_fk',
      table: 'days',
      mapping: 'id',
      rules: {
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
    }},
    room_id: { type: type.INTEGER, notNull: true, foreignKey: {
      name: 'pro_shows_room_id_fk',
      table: 'rooms',
      mapping: 'id',
      rules: {
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
    }},
    title: type.STRING,
    description: type.TEXT,
    image_id: { type: type.INTEGER, foreignKey: {
      name: 'pro_shows_image_id_fk',
      table: 'images',
      mapping: 'id',
      rules: {
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
    }}
  });
};

exports.down = function(db) {
  return db.dropTable('pro_shows');
};

exports._meta = {
  "version": 1
};

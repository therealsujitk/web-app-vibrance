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
  return db.createTable('team', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    name: { type: type.STRING, notNull: true },
    team_name: type.STRING,
    role: type.STRING,
    image_id: { type: type.INTEGER, foreignKey: {
      name: 'team_image_id_fk',
      table: 'images',
      mapping: 'id',
      rules: {
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
    }},
    phone: type.STRING,
    email: type.STRING
  });
};

exports.down = function(db) {
  return db.dropTable('team');
};

exports._meta = {
  "version": 1
};

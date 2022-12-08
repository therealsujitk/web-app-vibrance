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
  return db.createTable('gallery', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    image_id: { type: type.INTEGER, notNull: true, foreignKey: {
      name: 'gallery_image_id_fk',
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
  return db.dropTable('gallery');
};

exports._meta = {
  "version": 1
};

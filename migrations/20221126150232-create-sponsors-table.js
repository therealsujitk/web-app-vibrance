const { SponsorType }  = require('../models/sponsor');

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
  return db.createTable('sponsors', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    title: { type: type.STRING, notNull: true },
    type: { type: `enum('${Object.keys(SponsorType).join('\',\'')}')`, notNull: true, defaultValue: SponsorType.OTHER },
    description: type.TEXT,
    image_id: { type: type.INTEGER, foreignKey: {
      name: 'sponsors_image_id_fk',
      table: 'images',
      mapping: 'id',
      rules: {
        onDelete: 'RESTRICT',
        onUpdate: 'RESTRICT'
      },
    }},
  });
};

exports.down = function(db) {
  return db.dropTable('sponsors');
};

exports._meta = {
  "version": 1
};

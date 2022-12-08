const { Permission }  = require('../models/user');

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
  return db.createTable('users', {
    id: { type: type.INTEGER, notNull: true, primaryKey: true, autoIncrement: true },
    username: { type: type.STRING, notNull: true, unique: true },
    password: { type: type.STRING, notNull: true },
    permission_code: { type: type.BIG_INTEGER, notNull: true }
  });
};

exports.down = function(db) {
  return db.dropTable('users');
};

exports._meta = {
  "version": 1
};

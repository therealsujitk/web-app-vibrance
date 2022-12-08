const { Permission }  = require('../models/user');

'use strict';

const bcrypt = require('bcrypt');

var dbm;
var type;
var seed;

const user = {
  username: 'admin',
  password: bcrypt.hashSync('password', 10),
  permission_code: Permission.ADMIN
};

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
  return db.insert('users', user);
};

exports.down = function(db) {
  return db.runSql("DELETE FROM `users` WHERE username = ?", [user.username]);
};

exports._meta = {
  "version": 1
};

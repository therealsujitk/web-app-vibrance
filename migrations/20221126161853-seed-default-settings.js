'use strict';

const { SettingKey } = require('../models/setting');

var dbm;
var type;
var seed;

const settings = [
  {
    key: SettingKey.SITE_TITLE,
    value: 'Vibrance'
  },
  {
    key: SettingKey.SITE_DESCRIPTION,
    value: 'A web application for VIT Chennai\'s Cultural Festival, Vibrance.'
  }
];

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
  return db.runSql('INSERT INTO `settings` VALUES ?', [settings.map(e => [e.key, e.value])]);
};

exports.down = function(db) {
  return db.runSql("DELETE FROM `settings` WHERE `key` IN (?)", [settings.map(e => e.key)]);
};

exports._meta = {
  "version": 1
};

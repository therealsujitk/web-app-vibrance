'use strict';

const { AnalyticsConfigKey } = require("../models/analytics");

var dbm;
var type;
var seed;

const analyticsConfig = [
  {
    key: AnalyticsConfigKey.GA_PROPERTY_ID,
    value: null
  },
  {
    key: AnalyticsConfigKey.GA_CLIENT_EMAIL,
    value: null
  },
  {
    key: AnalyticsConfigKey.GA_PRIVATE_KEY,
    value: null
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
  return db.runSql('INSERT INTO `settings` VALUES ?', [analyticsConfig.map(e => [e.key, e.value])]);
};

exports.down = function(db) {
  return db.runSql("DELETE FROM `settings` WHERE `key` IN (?)", [analyticsConfig.map(e => e.key)]);
};

exports._meta = {
  "version": 1
};

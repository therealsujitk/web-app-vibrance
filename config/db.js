/*
    The Database Connection - Please don't change
    anything in this file
 */
const mysql = require('serverless-mysql');
const { MYSQL_HOST } = require('../config');
const { MYSQL_USER } = require('../config');
const { MYSQL_PASSWORD } = require('../config');
const { MYSQL_DATABASE } = require('../config');

const db = mysql({
    config: {
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE
    }
})

exports.query = async (query) => {
    try {
        const results = await db.query(query);
        await db.end();
        return results;
    } catch (error) {
        return error;
    }
}

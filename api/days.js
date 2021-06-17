/*
    The Days API - Please do not change anything
    in this file unless you know what you're doing
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.get('*', async (req, res) => {
    let sql = escape`SELECT day_string, date_string FROM days ORDER BY DATE(date_string)`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let jsonObject = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        jsonObject[i] = jsonArray[i];
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(jsonObject);
});

module.exports = router;

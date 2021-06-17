/*
    The About API - Please do not change anything
    in this file unless you know what you're doing
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.get('*', async (req, res) => {
    let sql = escape`SELECT * FROM settings`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let jsonObject = {};
    for (let i = 0; i < jsonArray.length; ++i) {
        let key = jsonArray[i]["key_string"];
        let value = jsonArray[i]["value_string"];

        jsonObject[key] = value;
    }

    /*
        Adding the social links
     */
    sql = escape`SELECT * FROM social`;
    jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    social = {};
    for (let i = 0; i < jsonArray.length; ++i) {
        let key = jsonArray[i]["social"].toLowerCase();
        let value = jsonArray[i]["handle"];

        social[key] = value;
    }

    jsonObject["social"] = social;

    /*
        Sending the JSON Object
     */
    res.status(200).json(jsonObject);
});

module.exports = router;

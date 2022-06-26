/*
    The Categories API - Please do not change anything
    in this file unless you know what you're doing
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.get('*', async (req, res) => {
    /*
        Building the SQL query
     */
    let query = req.query;
    let sql = escape`SELECT category,`;
    if ("type" in query) {
        if (Array.isArray(query["type"])) {
            let types = query["type"];
            sql.append(escape` category_type, image FROM categories WHERE`);
            for (let i = types.length - 1; i > 0; --i) {
                sql.append(escape` category_type = ${types[i]} OR`);
            }
            sql.append(escape` category_type = ${types[0]}`);
        } else {
            sql.append(escape` image FROM categories WHERE category_type = ${query["type"]}`);
        }
    } else {
        sql.append(escape` category_type, image FROM categories`);
    }
    sql.append(escape` ORDER BY category`);

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

const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT * FROM social`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let response = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        response[i] = jsonArray[i];
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(response);
});

router.post('/edit', async (req, res) => {
    let social = req.body.social;
    let handle = req.body.handle;

    let sql = escape`UPDATE social SET handle = ${handle} WHERE social = ${social}`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, something went wrong.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

module.exports = router;

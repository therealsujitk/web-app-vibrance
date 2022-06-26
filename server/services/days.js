const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT * FROM days ORDER BY DATE(date_string)`;
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

router.post('/add', async (req, res) => {
    let dayString = req.body.dayString;
    let dateString = req.body.dateString;

    let sql = escape`INSERT INTO days (day_string, date_string) VALUES(${dayString}, ${dateString})`;
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

router.post('/edit', async (req, res) => {
    let id = req.body.id;
    let dayString = req.body.dayString;
    let dateString = req.body.dateString;

    let sql = escape`UPDATE days SET day_string = ${dayString}, date_string = ${dateString} WHERE id = ${id}`;
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

router.post('/delete', async (req, res) => {
    let id = req.body.id;

    let sql = escape`DELETE FROM days WHERE id = ${id}`;
    let result = await db.query(sql);

    if ("errno" in result) {
        res.status(200).send('Sorry, there are still one or more events or pro shows in this day.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

module.exports = router;

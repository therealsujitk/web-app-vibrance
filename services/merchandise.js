const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT * FROM merchandise`;
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
    let title = req.body.title;
    let cost = req.body.cost;
    let image = req.body.image;

    let sql = escape`INSERT INTO merchandise (title, image, cost) VALUES(${title}, ${image}, ${cost})`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, that merchandise already exists.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

router.post('/edit', async (req, res) => {
    let id = req.body.id;
    let title = req.body.title;
    let cost = req.body.cost;
    let image = req.body.image;

    let sql = escape`UPDATE merchandise SET title = ${title}, image = ${image}, cost = ${cost} WHERE id = ${id}`;
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

    let sql = escape`DELETE FROM merchandise WHERE id = ${id}`;
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

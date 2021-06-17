const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT * FROM venues`;
    let jsonArray = await db.query(sql);

    /*
        Building the venues JSON Object
     */
    let venues = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        venues[i] = jsonArray[i];
    }

    sql = escape`SELECT * FROM rooms`;
    jsonArray = await db.query(sql);

    /*
        Building the rooms JSON Object
     */
    let rooms = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        rooms[i] = jsonArray[i];
    }

    let response = {
        "venues": venues,
        "rooms": rooms
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(response);
});

router.post('/add', async (req, res) => {
    var venue = req.body.venue;

    if (venue.trim() == "") {
        res.status(200).send('Sorry, the venue\'s title cannot be blank.');
        return;
    }

    let sql = escape`INSERT INTO venues (venue) VALUES(${venue})`;
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
    var id = req.body.id;
    var venue = req.body.venue;

    if (venue.trim() == "") {
        res.status(200).send('Sorry, the venue\'s title cannot be blank.');
        return;
    }

    let sql = escape`UPDATE venues SET venue = ${venue} WHERE id = ${id}`;
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
    var id = req.body.id;

    let sql = escape`DELETE FROM venues WHERE id = ${id}`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, this venue still contains one or more rooms, events or pro shows.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

router.post('/rooms/add', async (req, res) => {
    var venueID = req.body.venueID;
    var room = req.body.room;

    if (room.trim() == "") {
        res.status(200).send('Sorry, the room\'s title cannot be blank.');
        return;
    }

    let sql = escape`INSERT INTO rooms (room, venue_id) VALUES(${room}, ${venueID})`;
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

router.post('/rooms/delete', async (req, res) => {
    var id = req.body.id;

    let sql = escape`DELETE FROM rooms WHERE id = ${id}`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, this room still contains an event or a pro show.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT pro_shows.id, day_id, day_string, room_id, venue, room, description, image FROM pro_shows, days, venues, rooms WHERE pro_shows.day_id = days.id AND pro_shows.room_id = rooms.id AND rooms.venue_id = venues.id ORDER BY DATE(days.date_string)`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let proShows = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        proShows[i] = jsonArray[i];
    }

    sql = escape`SELECT id, day_string FROM days ORDER BY DATE(date_string)`;
    jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let days = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        days[i] = jsonArray[i];
    }

    sql = escape`SELECT rooms.id, venue, room FROM rooms, venues WHERE venue_id = venues.id ORDER BY venues.id`;
    jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let rooms = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        rooms[i] = jsonArray[i];
    }

    let response = {
        "pro_shows": proShows,
        "days": days,
        "rooms": rooms
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(response);
});

router.post('/add', async (req, res) => {
    let dayID = req.body.dayID;
    let roomID = req.body.roomID;
    let description = req.body.description;
    let image = req.body.image;

    let sql = escape`INSERT INTO pro_shows (day_id, room_id, description, image) VALUES(${dayID}, ${roomID}, ${description}, ${image})`;
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
    let dayID = req.body.dayID;
    let roomID = req.body.roomID;
    let description = req.body.description;
    let image = req.body.image;

    let sql = escape`UPDATE pro_shows SET day_id = ${dayID}, room_id = ${roomID}, description = ${description}, image = ${image} WHERE id = ${id}`;
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

    let sql = escape`DELETE FROM pro_shows WHERE id = ${id}`;
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

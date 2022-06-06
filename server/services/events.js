const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT title, description, image, events.id, category_id, room_id, venue, room, start_time, end_time, members, entry_fee FROM events, venues, rooms WHERE room_id = rooms.id AND venues.id = rooms.venue_id AND day_id = (SELECT id FROM days ORDER BY DATE(date_string) LIMIT 1)`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let events = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        events[i] = jsonArray[i];
    }

    sql = escape`SELECT id, category FROM categories`;
    jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let categories = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        categories[i] = jsonArray[i];
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
        "events": events,
        "categories": categories,
        "days": days,
        "rooms": rooms
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(response);
});

router.post('/id/*', async (req, res) => {
    let id = req.params[0];
    let sql = escape`SELECT events.id, title, description, image, category_id, room_id, venue, room, start_time, end_time, members, entry_fee FROM events, venues, rooms WHERE day_id = ${id} AND room_id = rooms.id AND venues.id = rooms.venue_id`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let events = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        events[i] = jsonArray[i];
    }

    let response = {
        "events": events
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(response);
});

router.post('/add', async (req, res) => {
    let title = req.body.title;
    let description = req.body.description;
    let image = req.body.image;
    let categoryID = req.body.categoryID;
    let dayID = req.body.dayID;
    let roomID = req.body.roomID;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    let members = req.body.members;
    let entryFee = req.body.entryFee;

    let sql = escape`INSERT INTO events (title, description, image, category_id, day_id, room_id, start_time, end_time, members, entry_fee) VALUES(${title}, ${description}, ${image}, ${categoryID}, ${dayID}, ${roomID}, ${startTime}, ${endTime}, ${members}, ${entryFee})`;
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
    let title = req.body.title;
    let description = req.body.description;
    let image = req.body.image;
    let roomID = req.body.roomID;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    let members = req.body.members;
    let entryFee = req.body.entryFee;

    let sql = escape`UPDATE events SET title = ${title}, description = ${description}, image = ${image}, room_id = ${roomID}, start_time = ${startTime}, end_time = ${endTime}, members = ${members}, entry_fee = ${entryFee} WHERE id = ${id}`;
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

    let sql = escape`DELETE FROM events WHERE id = ${id}`;
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

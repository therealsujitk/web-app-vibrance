/*
    The Venues API - Please do not change anything
    in this file unless you know what you're doing
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.get('*', async (req, res) => {
    let sql = escape`SELECT venue, room FROM venues, rooms WHERE venue_id = venues.id ORDER BY venue DESC`;
    let jsonArray = await db.query(sql);

    /*
        Building the JSON Object
     */
    let groupedVenues = {};
    for (let i = jsonArray.length - 1; i >= 0; --i) {
        let venue = jsonArray[i]["venue"];
        let room = jsonArray[i]["room"];
        
        if (venue in groupedVenues) {
            if (room != null) {
                groupedVenues[venue].push(room);
            }
        } else {
            if (room != null) {
                groupedVenues[venue] = [room];
            } else {
                groupedVenues[venue] = [];
            }
        }
    }

    let jsonObject = {}, i = 0;
    for (let venue in groupedVenues) {
        jsonObject[i] = {};
        jsonObject[i]["venue"] = venue;
        jsonObject[i]["rooms"] = groupedVenues[venue];
        ++i
    }

    /*
        Sending the JSON Object
     */
    res.status(200).json(jsonObject);
});

module.exports = router;

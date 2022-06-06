/*
    The Events API - Please do not change anything
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
    let sql = escape`SELECT title, description, categories.image AS category_image, events.image AS event_image, start_time, end_time, members, entry_fee`;

    let whereDay = escape`1`;
    let whereCategory = escape`1`;
    let whereVenue = escape`1`;
    let whereRoom = escape`1`;

    // Filter by days
    if ("day" in query) {
        if (Array.isArray(query["day"])) {
            let days = query["day"];
            whereDay = escape``;

            sql.append(escape`, day_string`);
            whereDay.append(escape`(`);

            for (let i = days.length - 1; i > 0; --i) {
                whereDay.append(escape`day_string = ${days[i]} OR `);
            }

            whereDay.append(escape`day_string = ${days[0]})`);
        } else {
            whereDay = escape`day_string = ${query["day"]}`;
        }
    } else {
        sql.append(escape`, day_string`);
    }

    // Filter by categories
    if ("category" in query) {
        if (Array.isArray(query["category"])) {
            let categories = query["category"];
            whereCategory = escape``;

            sql.append(escape`, category`);
            whereCategory.append(escape`(`);

            for (let i = days.length - 1; i > 0; --i) {
                whereCategory.append(escape`category = ${categories[i]} OR `);
            }

            whereCategory.append(escape`category = ${categories[0]})`);
        } else {
            whereCategory = escape`category = ${query["category"]}`;
        }
    } else {
        sql.append(escape`, category`);
    }

    // Filter by venues
    if ("venue" in query) {
        if (Array.isArray(query["venue"])) {
            let venues = query["venue"];
            whereVenue = escape``;

            sql.append(escape`, venue`);
            whereVenue.append(escape`(`);

            for (let i = days.length - 1; i > 0; --i) {
                whereVenue.append(escape`venue = ${venues[i]} OR `);
            }

            whereVenue.append(escape`venue = ${venues[0]})`);
        } else {
            whereVenue = escape`venue = ${query["venue"]}`;
        }
    } else {
        sql.append(escape`, venue`);
    }

    // Filter by rooms
    if ("room" in query) {
        if (Array.isArray(query["room"])) {
            let rooms = query["room"];
            whereRoom = escape``;

            sql.append(escape`, room`);
            whereRoom.append(escape`(`);

            for (let i = days.length - 1; i > 0; --i) {
                whereVenue.append(escape`room = ${rooms[i]} OR `);
            }

            whereRoom.append(escape`room = ${rooms[0]})`);
        } else {
            whereRoom = escape`room = ${query["room"]}`;
        }
    } else {
        sql.append(escape`, room`);
    }

    sql.append(escape` FROM events, categories, days, venues, rooms`);
    sql.append(escape` WHERE day_id = days.id AND category_id = categories.id AND venue_id = venues.id AND room_id = rooms.id`);

    let where = [whereDay, whereCategory, whereVenue, whereRoom];
    for (let i = where.length - 1; i >= 0; --i) {
        sql.append(escape` AND `).append(where[i]);
    }

    sql.append(escape` ORDER BY DATE(date_string), TIME(start_time) LIMIT 40`);

    if ("offset" in query) {
        let offset = Math.floor(query["offset"] / 40) * 40;

        if(!Number.isInteger(offset)) {
            offset = 0;
        }

        sql.append(escape` OFFSET ${offset}`);
    }

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

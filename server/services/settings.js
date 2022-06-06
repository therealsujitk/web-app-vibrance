const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let settings = await db.query(escape`SELECT key_string, value_string FROM settings`);

    var title = 'Vibrance';
    var description = 'The official website for VIT Chennai\'s cultural festival.';
    var openingDate = '';
    var openingTime = '';

    for (let i = settings.length - 1; i >=0; --i) {
        if (settings[i]["value_string"] == '') {
            continue;
        }

        if (settings[i]["key_string"] == 'title') {
            title = settings[i]["value_string"];
        } else if (settings[i]["key_string"] == 'description') {
            description = settings[i]["value_string"];
        } else if (settings[i]["key_string"] == 'opening_date') {
            openingDate = settings[i]["value_string"];
        } else if (settings[i]["key_string"] == 'opening_time') {
            openingTime = settings[i]["value_string"];
        }
    }

    var response = {
        "title": title,
        "description": description,
        "opening_date": openingDate,
        "opening_time": openingTime
    };

    /*
        Sending the response
     */
    res.status(200).send(response);
});

router.post('/save', async (req, res) => {
    var title = req.body.title;
    var description = req.body.description;
    var date = req.body.date;
    var time = req.body.time;

    let sql = escape`UPDATE settings SET value_string = ${title} WHERE key_string = 'title'`;
    await db.query(sql);

    sql = escape`UPDATE settings SET value_string = ${description} WHERE key_string = 'description'`;
    await db.query(sql);

    sql = escape`UPDATE settings SET value_string = ${date} WHERE key_string = 'opening_date'`;
    await db.query(sql);

    sql = escape`UPDATE settings SET value_string = ${time} WHERE key_string = 'opening_time'`;
    await db.query(sql);

    /*
        Sending the response
     */
    res.status(200).send('success');
});

module.exports = router;

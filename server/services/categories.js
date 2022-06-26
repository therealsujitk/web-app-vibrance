const express = require('express');
const router = express.Router();
const db = require('../config/db')
const escape = require('sql-template-strings');

router.post('', async (req, res) => {
    let sql = escape`SELECT * FROM categories`;
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
    let category = req.body.category;
    let categoryType = 'Club';
    let image = req.body.image;

    if (!req.body.categoryType.toLowerCase().includes('club')) {
        categoryType = 'Chapter';
    }

    let sql = escape`INSERT INTO categories (category, category_type, image) VALUES(${category}, ${categoryType}, ${image})`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, that category might already exist.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

router.post('/edit', async (req, res) => {
    let id = req.body.id;
    let category = req.body.category;
    let categoryType = 'Club';
    let image = req.body.image;

    if (!req.body.categoryType.toLowerCase().includes('club')) {
        categoryType = 'Chapter';
    }

    let sql = escape`UPDATE categories SET category = ${category}, category_type = ${categoryType}, image = ${image} WHERE id = ${id}`;
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

    let sql = escape`DELETE FROM categories WHERE id = ${id}`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, this category still contains one or more events.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const escape = require('sql-template-strings');
const md5 = require('md5');

router.post('', checkAdministrator, async (req, res) => {
    let sql = escape`SELECT id, username, is_admin FROM users`;
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

router.post('/add', checkAdministrator, async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let repeatPassword = req.body.repeatPassword;
    let userType = req.body.userType;

    if (userType.toLowerCase().includes('admin')) {
        userType = 1;
    } else {
        userType = 0;
    }

    if (password != repeatPassword) {
        res.status(200).send('Sorry, passwords do not match');
        return;
    }

    let sql = escape`INSERT INTO users (username, password, is_admin) VALUES(${username}, ${md5(password)}, ${userType})`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, that user already exists.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

router.post('/edit/password', checkAdministrator, async (req, res) => {
    let id = req.body.id;
    let password = req.body.password;
    let repeatPassword = req.body.repeatPassword;

    if (password != repeatPassword) {
        res.status(200).send('Sorry, passwords do not match.');
        return;
    }

    let sql = escape`UPDATE users SET password = ${md5(password)} WHERE id = ${id}`;
    let result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, that user already exists.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

router.post('/edit/my-password', async (req, res) => {
    let userID = req.session.userID;
    let currentPassword = req.body.currentPassword;
    let password = req.body.password;
    let repeatPassword = req.body.repeatPassword;

    if (password != repeatPassword) {
        res.status(200).send('Sorry, new passwords do not match.');
        return;
    }

    let sql = escape`SELECT id, password FROM users WHERE id = ${userID}`;
    let result = await db.query(sql);

    if (!result[0] || md5(currentPassword) != result[0]["password"]) {
        res.status(200).send('Sorry, your current password is incorrect.');
        return;
    }

    sql = escape`UPDATE users SET password = ${md5(password)} WHERE id = ${userID}`;
    result = await db.query(sql);
    
    if ("errno" in result) {
        res.status(200).send('Sorry, something went wrong.');
        return;
    }

    /*
        Sending the response
     */
    res.status(200).send('success');
});

router.post('/edit/permission', checkAdministrator, async (req, res) => {
    let id = req.body.id;
    let userType = req.body.userType;

    if (userType.toLowerCase().includes('admin')) {
        userType = 1;
    } else {
        userType = 0;
    }

    if (id == 1) {
        res.status(200).send('Sorry, this user\'s permission cannot be changed.');
        return;
    }

    let sql = escape`UPDATE users SET is_admin = ${userType} WHERE id = ${id}`;
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

router.post('/delete', checkAdministrator, async (req, res) => {
    let id = req.body.id;

    if (id == 1) {
        res.status(200).send('Sorry, this user cannot be deleted.');
        return;
    }

    let sql = escape`DELETE FROM users WHERE id = ${id}`;
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

/*
    Checking if the user is an administrator
 */
async function checkAdministrator(req, res, next) {
    if (!req.session.userID) {
        res.status(200).send('Sorry, you don\'t seem to be signed in.');
    } else {
        let sql = escape`SELECT is_admin FROM users WHERE id = ${req.session.userID}`;
        let result = await db.query(sql);
        
        var isAdmin = false;

        if (result[0]["is_admin"] == 1) {
            isAdmin = true;
        }

        if (!isAdmin) {
            res.status(200).send('Sorry, you are not an administrator.');
            return;
        }

        next();
    }
}

module.exports = router;

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

    if (!validateUsername(username, res)) {
        return;
    }

    if (!validatePassword(password, res)) {
        return;
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

    if (!validatePassword(password, res)) {
        return;
    }

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

    if (!validatePassword(password, res)) {
        return;
    }

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

/*
    Username validation
 */
function validateUsername(username, res) {
    if(username.match(/\W/)){
        res.status(200).send('Sorry, username cannot contain special characters or spaces.');
        return false;
    } else if (username.length < 3) {
        res.status(200).send('Sorry, your username needs to have atleast 3 characters.')
    } else if (username.length > 20) {
        res.status(200).send('Sorry, your username cannot have more than 20 characters.');
        return false;
    }

    return true;
}

/*
    Password validation
 */
function validatePassword(password, res) {
    if(password != password.trim()){
        res.status(200).send('Sorry, your password cannot contain trailing spaces.');
        return false;
    } else if (password.length < 8) {
        res.status(200).send('Sorry, your password needs to have atleast 8 characters.');
        return false;
    } else if (password.length > 20) {
        res.status(200).send('Sorry, your password cannot have more than 20 characters.');
        return false;
    }

    return true;
}

module.exports = router;

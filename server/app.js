const express = require('express');
const session = require('express-session');
const app = express();
const db = require(__dirname + '/config/db');
const escape = require('sql-template-strings');
const md5 = require('md5');

/*
    API Endpoints
 */
const aboutEndpoint = require(__dirname + '/api/about');
const categoriesEndpoint = require(__dirname + '/api/categories');
const daysEndpoint = require(__dirname + '/api/days');
const venuesEndpoint = require(__dirname + '/api/venues');
const eventsEndpoint = require(__dirname + '/api/events');
const proShowsEndpoint = require(__dirname + '/api/pro_shows');
const merchandiseEndpoint = require(__dirname + '/api/merchandise');

app.use('/api/about.json', aboutEndpoint);
app.use('/api/categories.json', categoriesEndpoint);
app.use('/api/days.json', daysEndpoint);
app.use('/api/venues.json', venuesEndpoint);
app.use('/api/events.json', eventsEndpoint);
app.use('/api/pro_shows.json', proShowsEndpoint);
app.use('/api/merchandise.json', merchandiseEndpoint);

/*
    Static Files
 */
app.use('/', express.static(__dirname + '/build'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery'));

/*
    Admin
 */
const { SESSION_SECRET } = require(__dirname + '/config');

app.use(session({
    secret: SESSION_SECRET || 'DEFAULT_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: true
    }
}));

app.use(express.urlencoded({
    extended: true
}));

app.get('/admin', checkAuthenticated, async (req, res) => {
    let sql = escape`SELECT username, is_admin FROM users WHERE id = ${req.session.userID}`;
    let result = await db.query(sql);
    
    var username = result[0]["username"];
    var isAdmin = false;

    if (result[0]["is_admin"] == 1) {
        isAdmin = true;
    }

    sql = escape`SELECT value_string FROM settings WHERE key_string = 'title'`;
    let settings = await db.query(sql);

    var title = 'Vibrance';

    if(settings[0] && settings[0]["value_string"] != "") {
        title = settings[0]["value_string"];
    }

    res.status(200).render('admin/admin.ejs', {
        title: title,
        username: username,
        isAdmin: isAdmin
    });
});

app.post('/admin-login', async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let sql = escape`SELECT id, password FROM users WHERE username = ${username}`;
    let result = await db.query(sql);
    
    try {
        if (md5(password) === result[0]["password"]) {
            req.session.userID = result[0]["id"];
            res.status(200).send('success');
        } else {
            res.status(200).send('Invalid Username / Password');
        }
    } catch {
        res.status(200).send('Invalid Username / Password');
    }
});

app.post('/admin-logout', async (req, res) => {
    req.session.destroy();
    res.status(200).send('success');
});

/*
    Admin Routes
 */
const settingsService = require(__dirname + '/services/settings');
const usersService = require(__dirname + '/services/users');
const daysService = require(__dirname + '/services/days');
const categoriesService = require(__dirname + '/services/categories');
const venuesService = require(__dirname + '/services/venues');
const proShowsService = require(__dirname + '/services/pro_shows');
const eventsService = require(__dirname + '/services/events');
const merchandiseService = require(__dirname + '/services/merchandise');
const socialService = require(__dirname + '/services/social');

app.use('/settings', checkAdministrator, settingsService);
app.use('/users', usersService);
app.use('/days', checkEditor, daysService);
app.use('/categories', checkEditor, categoriesService);
app.use('/venues', checkEditor, venuesService);
app.use('/pro_shows', checkEditor, proShowsService);
app.use('/events', checkEditor, eventsService);
app.use('/merchandise', checkEditor, merchandiseService);
app.use('/social', checkEditor, socialService);

/*
    Checking if the user is authenticated
 */
async function checkAuthenticated(req, res, next) {
    if (!req.session.userID) {
        let settings = await db.query(escape`SELECT value_string FROM settings WHERE key_string = 'title'`);
        var title = 'Vibrance';

        if (settings[0] && settings[0]["value_string"]) {
            title = settings[0]["value_string"];
        }

        res.status(200).render('admin/admin-login.ejs', {
            title: title
        });
    } else {
        next();
    }
}

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
    Checking if the user is an editor
 */
async function checkEditor(req, res, next) {
    if (!req.session.userID) {
        res.status(200).send('Sorry, you don\'t seem to be signed in.');
        return;
    }

    next();
}

/*
    Send all other requests to React
 */
app.get('/*', (req, res) => {
    res.status(200).sendFile(__dirname + '/build/index.html');
});

module.exports = app;

const app = require('../app');
const http = require('http').createServer(app);
const { PORT } = require('../config');
const port = PORT || 8080;

/*
    Starting the listener
 */
http.listen(port, () => {
    console.log('listening on *:' + port);
});

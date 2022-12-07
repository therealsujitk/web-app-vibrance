import app from '../app';
import { PORT } from '../config';

const http = require('http').createServer(app);
const port = PORT || 3000;

/*
  Starting the listener
 */
http.listen(port, () => {
  console.log('listening on *:' + port);
});

import app from '../app';
import http from 'http';
import { PORT } from '../config';

const httpServer = http.createServer(app);
const port = PORT || 3000;

/*
  Starting the listener
 */
httpServer.listen(port, () => {
  console.log('listening on *:' + port);
});

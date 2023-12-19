import express from 'express';
import path from 'path';

const adminRouter = express.Router();
const docsRouter = express.Router();
const homeRouter = express.Router();

adminRouter.use(express.static(path.join(__dirname, '/admin/dist'), {index: false}));
adminRouter.get('/*', (req, res) => {
  res.status(200).sendFile(__dirname + '/admin/dist/index.html');
});

docsRouter.use(express.static(path.join(__dirname, '/docs/dist'), {index: false}));
docsRouter.get('/*', (req, res) => {
  res.status(200).sendFile(__dirname + '/docs/dist/index.html');
});

homeRouter.use(express.static(path.join(__dirname, '/home/dist'), {index: false}));
homeRouter.get('/*', (req, res) => {
  res.status(200).sendFile(__dirname + '/home/dist/index.html');
});

export { adminRouter, docsRouter, homeRouter };

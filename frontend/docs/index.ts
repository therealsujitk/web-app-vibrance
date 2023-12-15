import express from 'express';
const docsRouter = express.Router();

docsRouter.use(express.static(__dirname + '/dist', {index: false}));
docsRouter.get('/*', (req, res) => {
  res.status(200).sendFile(__dirname + '/dist/index.html');
});

export default docsRouter;

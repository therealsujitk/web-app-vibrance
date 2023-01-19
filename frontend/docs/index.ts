import express from 'express';
const docsRouter = express.Router();

docsRouter.use(express.static(__dirname + '/build'));
docsRouter.get('/*', (req, res) => {
  res.status(200).sendFile(__dirname + '/build/index.html');
});

export default docsRouter;

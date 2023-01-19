import express from 'express';
const docsRouter = express.Router();

docsRouter.use(express.static(__dirname + '/node_modules/redoc/bundles'));
docsRouter.use(express.static(__dirname + '/public'));

export default docsRouter;

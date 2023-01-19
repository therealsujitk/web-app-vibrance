import express from 'express';
import path from 'path';
const adminRouter = express.Router();

adminRouter.use(express.static(path.join(__dirname, '/build')));
adminRouter.get('/*', (req, res) => {
  res.status(200).sendFile(__dirname + '/build/index.html');
});

export default adminRouter;

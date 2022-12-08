import express from 'express';
const adminRouter = express.Router();

adminRouter.get('/*', (req, res) => {
  res.status(200).send('Hello world!');
});

export default adminRouter;

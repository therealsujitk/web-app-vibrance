import express from 'express';
const homeRouter = express.Router();

homeRouter.get('/', async (req, res) => {
  res.redirect('https://github.com/therealsujitk/web-app-vibrance/blob/main/README.md');
});

homeRouter.get('/*', (req, res) => {
  res.status(404).send('404');
});

export default homeRouter;

import cors from 'cors';
import express from 'express';
import version_1_0 from './v1.0';

const apiRouter = express.Router().use(cors());

apiRouter.use('/v1.0', version_1_0);
apiRouter.use('/latest', version_1_0);

apiRouter.all('/*', (req, res) => {
  res.status(404).json({
    error: 'Invalid API version in URI.'
  });
});

export default apiRouter;

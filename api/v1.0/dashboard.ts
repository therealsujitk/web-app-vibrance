import { Users } from '../../interfaces';
import express from 'express';
import os from 'os';
import { query } from '../../config/db';
import { version } from '../../package.json';
import { internalServerError } from '../utils/errors';
import { checkPermissions } from '../utils/helpers';

const dashboardRouter = express.Router();

/**
 * [GET] /api/v1.0/dashboard
 * 
 * @header X-Api-Key <API-KEY> (required)
 * 
 * @response JSON
 *  {
 *      "softwareInfo": {
 *          "release": "2021.0.0",
 *          "nodejs": "v16.14.2",
 *          "mysql": "10.4.24-MariaDB"
 *      },
 *      "serverStats": {
 *          "totalMemory": 8235102208,
 *          "freeMemory": 3394170880
 *      }
 *  }
 */
dashboardRouter.get('', Users.checkAuth, checkPermissions(), async (req, res) => {
  try {
    const response = {
      softwareInfo: {
        release: version,
        nodejs: process.version,
        mysql: (await query('SELECT VERSION() AS `version`'))[0].version
      },
      serverStats: {
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
      }
    };

    res.status(200).json(response);
  } catch (err) {
    internalServerError(res);
  }
});

export default dashboardRouter;

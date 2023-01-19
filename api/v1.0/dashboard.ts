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
 *      "software_info": [
 *          {
 *            name: 'Release',
 *            version: "2021.0.0"
 *          },
 *          {
 *            name: 'Node.js',
 *            version: "v16.14.2"
 *          },
 *          ...
 *      ],
 *      "server_stats": {
 *          "totalMemory": 8235102208,
 *          "freeMemory": 3394170880
 *      }
 *  }
 */
dashboardRouter.get('', Users.checkAuth, checkPermissions(), async (req, res) => {
  try {
    const response = {
      software_info: [
        {
          name: 'Release',
          version: version
        },
        {
          name: 'Node.js',
          version: process.version
        },
        {
          name: 'MySQL',
          version: (await query('SELECT VERSION() AS `version`'))[0].version
        },
      ],
      server_stats: {
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

import { Users } from '../../interfaces';
import express from 'express';
import os from 'node-os-utils';
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
    const getCpuUsage = async () => {
      return new Promise((resolve) => {
        os.cpu.usage().then((result) => resolve(result));
      })
    }

    const getTotalMemory = async () => {
      return new Promise((resolve) => {
        os.mem.info().then((result) => resolve(result.totalMemMb));
      })
    }
    
    const getFreeMemory = async () => {
      return new Promise((resolve) => {
        os.mem.info().then((result) => resolve(result.freeMemMb));
      })
    }

    const getTotalDisk = async () => {
      return new Promise((resolve) => {
        os.drive.info('/').then((result) => resolve(result.totalGb * 1024));
      })
    }
    
    const getFreeDisk = async () => {
      return new Promise((resolve) => {
        os.drive.info('/').then((result) => resolve(result.freeGb * 1024));
      })
    }

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
        total_memory: await getTotalMemory(),
        free_memory: await getFreeMemory(),
        total_disk: await getTotalDisk(),
        free_disk: await getFreeDisk(),
        cpu_usage: await getCpuUsage(),
      }
    };

    res.status(200).json(response);
  } catch (err) {
    internalServerError(res);
  }
});

export default dashboardRouter;

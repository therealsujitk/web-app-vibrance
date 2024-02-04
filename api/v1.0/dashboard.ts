import { Analytics, Users } from '../../interfaces'
import express from 'express'
import os from 'node-os-utils'
import { query } from '../../config/db'
import { version } from '../../package.json'
import { internalServerError } from '../utils/errors'
import { checkPermissions, handleValidationErrors } from '../utils/helpers'
import { body } from 'express-validator'
import { body_email, body_non_empty_string } from '../utils/validators'
import { AnalyticsConfig } from '../../models/analytics'

const dashboardRouter = express.Router()

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
  const getCpuUsage = async () => {
    return new Promise((resolve) => {
      os.cpu
        .usage()
        .then((result) => resolve(result))
        .catch(() => resolve(null))
    })
  }

  const getTotalMemory = async () => {
    return new Promise((resolve) => {
      os.mem
        .info()
        .then((result) => resolve(result.totalMemMb))
        .catch(() => resolve(null))
    })
  }

  const getFreeMemory = async () => {
    return new Promise((resolve) => {
      os.mem
        .info()
        .then((result) => resolve(result.freeMemMb))
        .catch(() => resolve(null))
    })
  }

  const getTotalDisk = async () => {
    return new Promise((resolve) => {
      os.drive
        .info('/')
        .then((result) => resolve(result.totalGb * 1024))
        .catch(() => resolve(null))
    })
  }

  const getFreeDisk = async () => {
    return new Promise((resolve) => {
      os.drive
        .info('/')
        .then((result) => resolve(result.freeGb * 1024))
        .catch(() => resolve(null))
    })
  }

  try {
    const response = {
      software_info: [
        {
          name: 'Release',
          version: version,
        },
        {
          name: 'Node.js',
          version: process.version,
        },
        {
          name: 'MySQL',
          version: (await query('SELECT VERSION() AS `version`'))[0].version,
        },
      ],
      server_stats: {
        total_memory: await getTotalMemory(),
        free_memory: await getFreeMemory(),
        total_disk: await getTotalDisk(),
        free_disk: await getFreeDisk(),
        cpu_usage: await getCpuUsage(),
      },
    }

    res.status(200).json(response)
  } catch (err) {
    internalServerError(res)
  }
})

/**
 * [GET] /api/v1.0/dashboard/analytics
 *
 * @header X-Api-Key <API-KEY> (required)
 *
 * @response JSON
 *  {
 *      "analytics": [
 *          {
 *              "name": "Total users",
 *              "data": [
 *                  {
 *                      oldValue: 500,
 *                      newValue: 10000
 *                  },
 *                  ...
 *              ],
 *              "weekData": {
 *                  "oldValue": 500,
 *                  "newValue": 10000,
 *              }
 *          },
 *          ...
 *      ]
 *  }
 */
dashboardRouter.get('/analytics', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!

  try {
    res.status(200).json({
      analytics: await new Analytics(user.id).get(),
    })
  } catch (err: any) {
    if (err.details) {
      internalServerError(res, err.details.split('.')[0])
    } else {
      internalServerError(res)
    }
  }
})

/**
 * [PUT] /api/v1.0/dashboard/analytics/delete
 *
 * @header X-Api-Key <API-KEY> (required)
 *
 * @response JSON
 *  {}
 */
dashboardRouter.put(
  '/analytics/configuration/set',
  Users.checkAuth,
  checkPermissions(),
  body_non_empty_string('ga_property_id'),
  body_email('ga_client_email'),
  body('ga_private_key')
    .isString()
    .customSanitizer((s) => s.replace(/\\n/g, '\n'))
    .trim()
    .matches(/^-----BEGIN PRIVATE KEY-----(.|\n)*-----END PRIVATE KEY-----$/)
    .withMessage("'ga_private_key' must be a valid private key."),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!
    const config: AnalyticsConfig = {
      ga_property_id: req.body.ga_property_id,
      ga_client_email: req.body.ga_client_email,
      ga_private_key: req.body.ga_private_key,
    }

    try {
      await new Analytics(user.id).setConfig(config)
      res.status(200).json({})
    } catch (err: any) {
      if (err.details) {
        internalServerError(res, err.details.split('.')[0])
      } else {
        internalServerError(res)
      }
    }
  },
)

/**
 * [DELETE] /api/v1.0/dashboard/analytics/delete
 *
 * @header X-Api-Key <API-KEY> (required)
 *
 * @response JSON
 *  {}
 */
dashboardRouter.delete('/analytics/configuration/delete', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!

  try {
    await new Analytics(user.id).deleteConfig()
    res.status(200).json({})
  } catch (err: any) {
    if (err.details) {
      internalServerError(res, err.details.split('.')[0])
    } else {
      internalServerError(res)
    }
  }
})

export default dashboardRouter

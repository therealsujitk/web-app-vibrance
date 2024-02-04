import express from 'express'
import { AuditLog, Users } from '../../interfaces'
import { internalServerError } from '../utils/errors'
import { checkPermissions, handleValidationErrors, toNumber } from '../utils/helpers'
import { query } from 'express-validator'
import { query_positive_integer, query_positive_integer_array } from '../utils/validators'

const auditLogRouter = express.Router()

/**
 * [GET] /api/v1.0/audit-log
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param page number
 * @param actor_id number[]
 *
 * @response JSON
 *  {
 *      "audit_log": [
 *          {
 *              "id": 1,
 *              "actor": "admin",
 *              "action": "DAY_ADD",
 *              "old": null,
 *              "new": "{\"title\":\"Day 1\",\"date\":\"2020-02-06T05:30:00.000Z\"}",
 *              "timestamp": "2022-12-05T07:52:23.000Z"
 *          },
 *          ...
 *      ]
 *  }
 */
auditLogRouter.get(
  '',
  Users.checkAuth,
  checkPermissions(),
  query_positive_integer('page').optional(),
  query('page').default(1),
  query_positive_integer_array('actor_id').optional(),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!
    const actorIds = req.query.actor_id as unknown as number[]

    try {
      res.status(200).json({
        audit_log: await AuditLog.getAll(page, actorIds),
        next_page: page + 1,
      })
    } catch (_) {
      internalServerError(res)
    }
  },
)

export default auditLogRouter

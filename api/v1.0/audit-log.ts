import express from 'express';
import validator from 'validator';
import { AuditLog, Users } from '../../interfaces';
import { internalServerError, invalidValueForParameter } from '../utils/errors';
import { checkPermissions } from '../utils/helpers';

const auditLogRouter = express.Router();

/**
 * [GET] /api/v1.0/audit-log
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param page number
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
auditLogRouter.get('', Users.checkAuth, checkPermissions(), async (req, res) => {
  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  try {
    res.status(200).json({
      audit_log: await AuditLog.getAll(page)
    });
  } catch (_) {
    internalServerError(res);
  }
});

export default auditLogRouter;

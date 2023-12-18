import express from 'express';
import { UploadedFile } from 'express-fileupload';
import { Team, Users } from '../../interfaces';
import { Team as TeamModel } from '../../models/team';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError } from '../utils/errors';
import { checkPermissions, checkReadOnly, getCacheOrFetch, getUploadMiddleware, handleFileUpload, handleValidationErrors, MIME_TYPE, toNumber } from '../utils/helpers';
import { query } from 'express-validator';
import { body_email_or_null, body_mobile_number_or_null, body_non_empty_string, body_positive_integer, query_positive_integer } from '../utils/validators';

const teamRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/team
 * 
 * @param page number
 * 
 * @response JSON
 *  {
 *      "team": [
 *          {
 *              "id": 1,
 *              "name": "Sujit",
 *              "team_name": "Technical Team",
 *              "role": "Technical Lead",
 *              "image": null,
 *              "phone": "999999999",
 *              "email": "social@therealsuji.tk"
 *          },
 *          ...
 *      ]
 *  }
 */
teamRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!;

    try {
      // TODO: Fix cache
      const team = await getCacheOrFetch(req, Team.getAll, [page]);
      const teamNames = (await Team.getTeams()).map((t: any) => t.team_name);

      res.status(200).json({
        team: team,
        team_names: teamNames,
        next_page: page + 1
      });
    } catch (_) {
      if (!res.headersSent) {
        internalServerError(res);
      }
    }
  },
);

/**
 * [POST] /api/v1.0/team/add
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param name string (required)
 * @param description string
 * @param phone string
 * @param email string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "member": {
 *          "id": 1,
 *          "name": "Sujit",
 *          "team_name": "Technical Team",
 *          "role": "Technical Lead",
 *          "image": null,
 *          "phone": "999999999",
 *          "email": "social@therealsuji.tk"
 *      }
 *  }
 */
teamRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.TEAM),
  checkReadOnly,
  uploadMiddleware,
  body_non_empty_string('name'),
  body_non_empty_string('team_name'),
  body_non_empty_string('role'),
  body_mobile_number_or_null('phone').optional(),
  body_email_or_null('email').optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return;
    }
    
    const user = req.user!;
    const team: TeamModel = {
      name: req.body.name,
      team_name: req.body.team_name,
      role: req.body.role,
      phone: req.body.phone,
      email: req.body.email,
    };

    if (req.files && 'image' in req.files) {
      try {
        team.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res);
        } else {
          return internalServerError(res);
        }
      }
    }

    try {
      res.status(200).json({
        member: await new Team(user.id).add(team)
      });
    } catch (_) {
      internalServerError(res);
    }
  },
);

/**
 * [POST] /api/v1.0/team/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number (required)
 * @param name string
 * @param description string
 * @param phone string
 * @param email string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "member": {
 *          "id": 1,
 *          "name": "Sujit",
 *          "team_name": "Technical Team",
 *          "role": "Technical Lead",
 *          "image": null,
 *          "phone": "999999999",
 *          "email": "social@therealsuji.tk"
 *      }
 *  }
 */
teamRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.TEAM),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('id'),
  body_non_empty_string('name').optional(),
  body_non_empty_string('team_name').optional(),
  body_non_empty_string('role').optional(),
  body_mobile_number_or_null('phone').optional(),
  body_email_or_null('email').optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return;
    }
    
    const user = req.user!;
    const id = toNumber(req.body.id)!;
    const team: OrNull<TeamModel> = {
      name: req.body.name,
      team_name: req.body.team_name,
      role: req.body.role,
      phone: req.body.phone,
      email: req.body.email,
    };

    if (req.files && 'image' in req.files) {
      try {
        team.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
      } catch (err) {
        if (err instanceof ClientError) {
          return badRequestError(err, res);
        } else {
          return internalServerError(res);
        }
      }
    }

    try {
      res.status(200).json({
        member: await new Team(user.id).edit(id, team)
      });
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res);
      } else {
        internalServerError(res);
      }
    }
  },
);

/**
 * [POST] /api/v1.0/team/delete
 * 
 * @header X-Api-Key <API-KEY>
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
teamRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(Permission.TEAM),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = toNumber(req.body.id)!;

    try {
      await new Team(user.id).delete(id);
      res.status(200).json({});
    } catch (err) {
      if (err instanceof ClientError) {
        badRequestError(err, res);
      } else {
        internalServerError(res);
      }
    }
  },
);

export default teamRouter;

import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { Team, Users } from '../../interfaces';
import { Team as TeamModel } from '../../models/team';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError, invalidValueForParameter, missingRequiredParameter } from '../utils/errors';
import { checkPermissions, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

const teamRouter = express.Router();
const uploadMiddleware = getUploadMiddleware(10);

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
teamRouter.get('', async (req, res) => {
  var page = 1;

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  try {
    res.status(200).json({
      team: await Team.getAll(page)
    });
  } catch (_) {
    return internalServerError(res);
  }
});

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
teamRouter.post('/add', Users.checkAuth, checkPermissions(Permission.TEAM), uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }
  
  const user = req.user!;

  if (!('name' in req.body)) {
    return missingRequiredParameter('name', res);
  }

  const name = validator.escape(req.body.name.trim());

  if (!('team_name' in req.body)) {
    return missingRequiredParameter('team', res);
  }

  const teamName = validator.escape(req.body.team_name.trim());

  if (!('role' in req.body)) {
    return missingRequiredParameter('role', res);
  }

  const role = validator.escape(req.body.role.trim());

  if (validator.isEmpty(name)) {
    return invalidValueForParameter('name', res);
  }

  if (validator.isEmpty(teamName)) {
    return invalidValueForParameter('team_name', res);
  }

  if (validator.isEmpty(role)) {
    return invalidValueForParameter('role', res);
  }

  const team: TeamModel = {
    name: name,
    team_name: teamName,
    role: role
  };

  if ('team' in req.body) {
    team.team_name = validator.escape(req.body.description.trim());
  }

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

  if ('phone' in req.body) {
    team.phone = req.body.phone.trim();

    if (!validator.isMobilePhone(team.phone as string)) {
      return invalidValueForParameter('phone', res);
    }
  }

  if ('email' in req.body) {
    team.email = req.body.email.trim();

    if (!validator.isEmail(team.email as string)) {
      return invalidValueForParameter('email', res);
    }
  }

  try {
    res.status(200).json({
      member: await new Team(user.id).add(team)
    });
  } catch (_) {
    internalServerError(res);
  }
});

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
teamRouter.post('/edit', Users.checkAuth, checkPermissions(Permission.TEAM), uploadMiddleware, async (req, res) => {
  // Incase the file upload was aborted
  if (res.headersSent) {
    return;
  }
  
  const user = req.user!;
  const team: OrNull<TeamModel> = {};

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

  if ('name' in req.body) {
    team.name = validator.escape(req.body.name.trim());

    if (validator.isEmpty(team.name)) {
      return invalidValueForParameter('name', res);
    }
  }

  if ('team' in req.body) {
    team.team_name = validator.escape(req.body.team.trim());
  }

  if ('role' in req.body) {
    team.role = validator.escape(req.body.role.trim());
  }

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

  if ('phone' in req.body) {
    team.phone = req.body.phone.trim();

    if (!validator.isMobilePhone(team.phone as string)) {
      return invalidValueForParameter('phone', res);
    }
  }

  if ('email' in req.body) {
    team.email = req.body.email.trim();

    if (!validator.isEmail(team.email as string)) {
      return invalidValueForParameter('email', res);
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
});

/**
 * [POST] /api/v1.0/team/delete
 * 
 * @header X-Api-Key <API-KEY>
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
teamRouter.post('/delete', Users.checkAuth, checkPermissions(Permission.TEAM), async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

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
});

export default teamRouter;

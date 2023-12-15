import express from 'express';
import { UploadedFile } from 'express-fileupload';
import { Sponsors, Users } from '../../interfaces';
import { Sponsor, SponsorType } from '../../models/sponsor';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { OrNull } from '../../utils/helpers';
import { badRequestError, internalServerError } from '../utils/errors';
import { checkPermissions, checkReadOnly, getCacheOrFetch, getUploadMiddleware, handleFileUpload, handleValidationErrors, MIME_TYPE } from '../utils/helpers';
import { body, query } from 'express-validator';
import { body_enum, body_non_empty_string, body_positive_integer, query_positive_integer } from '../utils/validators';

const sponsorsRouter = express.Router();
const uploadMiddleware = getUploadMiddleware();

/**
 * [GET] /api/v1.0/sponsors
 * 
 * @param page number
 * 
 * @response JSON
 *  {
 *      "sponsors": [
 *          {
 *              "id": 1,
 *              "title": "Google",
 *              "description": "Software Company",
 *              "image": "d3d6916d6105dae8a36cb24b97fdb2cf.jpeg"
 *          }
 *      ]
 *  }
 */
sponsorsRouter.get(
  '',
  query_positive_integer('page').optional(),
  query('page').default(1),
  handleValidationErrors,
  async (req, res) => {
    var page = Number(req.query.page);
    
    try {
      const sponsors = await getCacheOrFetch(req, Sponsors.getAll, [page]);

      res.status(200).json({
        sponsors: sponsors,
        types: Object.keys(SponsorType),
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
 * [POST] /api/v1.0/sponsors/add
 * 
 * @param title string (required)
 * @param type SponsorType (required)
 * @param description string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "sponsor": {
 *          "id": 7,
 *          "title": "Google",
 *          "description": "Software Company",
 *          "image": null
 *      }
 *  }
 */
sponsorsRouter.put(
  '/add',
  Users.checkAuth,
  checkPermissions(Permission.SPONSORS),
  checkReadOnly,
  uploadMiddleware,
  body_non_empty_string('title'),
  body_non_empty_string('description').optional(),
  body_enum('type', SponsorType),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return;
    }

    const user = req.user!;
    const sponsor: Sponsor = {
      title: req.body.title,
      type: req.body.type,
      description: req.body.description,
    };

    if (req.files && 'image' in req.files) {
      try {
        sponsor.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
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
        sponsor: await new Sponsors(user.id).add(sponsor)
      });
    } catch (_) {
      internalServerError(res);
    }
  },
);

/**
 * [POST] /api/v1.0/sponsors/edit
 * 
 * @param id number (required)
 * @param title string
 * @param type SponsorType
 * @param description string
 * @param image File
 * 
 * @response JSON
 *  {
 *      "sponsor": {
 *          "id": 1,
 *          "title": "Google",
 *          "description": "Software Company",
 *          "image": null
 *      }
 *  }
 */
sponsorsRouter.patch(
  '/edit',
  Users.checkAuth,
  checkPermissions(Permission.SPONSORS),
  checkReadOnly,
  uploadMiddleware,
  body_positive_integer('id'),
  body_non_empty_string('title').optional(),
  body_non_empty_string('description').optional(),
  body_enum('type', SponsorType).optional(),
  handleValidationErrors,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return;
    }
    
    const user = req.user!;
    const id = Number(req.body.id);
    const sponsor: OrNull<Sponsor> = {
      title: req.body.title,
      type: req.body.type,
      description: req.body.description,
    };

    if (req.files && 'image' in req.files) {
      try {
        sponsor.image = handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE);
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
        sponsor: await new Sponsors(user.id).edit(id, sponsor)
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
 * [POST] /api/v1.0/sponsors/delete
 * 
 * @param id number (required)
 * 
 * @response JSON
 *  {}
 */
sponsorsRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(Permission.SPONSORS),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = Number(req.body.id);

    try {
      await new Sponsors(user.id).delete(id);
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

export default sponsorsRouter;

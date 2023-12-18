import express from 'express';
import { UploadedFile } from 'express-fileupload';
import { Gallery, Users } from '../../interfaces';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { internalServerError, missingRequiredParameter, badRequestError } from '../utils/errors';
import { checkPermissions, checkReadOnly, getCacheOrFetch, getUploadMiddleware, handleFileUpload, handleValidationErrors, MIME_TYPE, toNumber } from '../utils/helpers';
import { body, query } from 'express-validator';
import { body_positive_integer, query_positive_integer } from '../utils/validators';

const galleryRouter = express.Router();
const uploadMiddleware = getUploadMiddleware(10);

/**
 * [GET] /api/v1.0/gallery
 * 
 * @param page number
 * 
 * @response JSON
 *  {
 *      "gallery": [
 *          {
 *              "id": 1,
 *              "image": "e08cc82ab8fdd0c08c910815474b2c0d.jpeg"
 *          },
 *          ...
 *      ]
 *  }
 */
galleryRouter.get(
  '',

  query_positive_integer('page'),
  query('page').default(1),
  handleValidationErrors,
  async (req, res) => {
    const page = toNumber(req.query.page)!;

    try {
      const gallery = await getCacheOrFetch(req, Gallery.getAll, [page]);

      res.status(200).json({
        gallery: gallery,
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
 * [POST] /api/v1.0/gallery/upload
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param image File|File[] (required)
 * 
 * {
 *      "images": [
 *          {
 *              "id": 1,
 *              "image": "e08cc82ab8fdd0c08c910815474b2c0d.jpeg"
 *          },
 *          ...
 *      ]
 *  }
 */
galleryRouter.put(
  '/upload',
  Users.checkAuth,
  checkPermissions(Permission.GALLERY),
  checkReadOnly,
  uploadMiddleware,
  async (req, res) => {
    // Incase the file upload was aborted
    if (res.headersSent) {
      return;
    }
    
    const user = req.user!;

    if (!req.files || !('image' in req.files)) {
      return missingRequiredParameter('image', res);
    }

    const images: string[] = [];

    try {
      if (Array.isArray(req.files.image)) {
        for (var i = 0; i < req.files.image.length; ++i) {
          images.push(handleFileUpload(req.files.image[i] as UploadedFile, MIME_TYPE.IMAGE))
        }
      } else {
        images.push(handleFileUpload(req.files.image as UploadedFile, MIME_TYPE.IMAGE));
      }
    } catch (err) {
      if (err instanceof ClientError) {
        return badRequestError(err, res)
      } else {
        return internalServerError(res);
      }
    }

    try {
      res.status(200).json({
        images: await new Gallery(user.id).add(images)
      });
    } catch (_) {
      internalServerError(res);
    }
  },
);

/**
 * [POST] /api/v1.0/gallery/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number
 * 
 * @reponse JSON
 *  {}
 */
galleryRouter.delete(
  '/delete',
  Users.checkAuth,
  checkPermissions(Permission.GALLERY),
  checkReadOnly,
  body_positive_integer('id'),
  handleValidationErrors,
  async (req, res) => {
    const user = req.user!;
    const id = toNumber(req.body.id)!;

    try {
      await new Gallery(user.id).delete(id);
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

export default galleryRouter;

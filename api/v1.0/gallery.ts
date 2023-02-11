import express from 'express';
import { UploadedFile } from 'express-fileupload';
import validator from 'validator';
import { Gallery, Users } from '../../interfaces';
import { Permission } from '../../models/user';
import { ClientError } from '../../utils/errors';
import { internalServerError, invalidValueForParameter, missingRequiredParameter, badRequestError } from '../utils/errors';
import { cache, checkPermissions, checkReadOnly, getUploadMiddleware, handleFileUpload, MIME_TYPE } from '../utils/helpers';

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
galleryRouter.get('', async (req, res) => {
  var page = 1;

  const cachedGallery = cache.get(req.originalUrl);

  if ('page' in req.query) {
    page = validator.toInt(req.query.page as string);

    if (isNaN(page)) {
      return invalidValueForParameter('page', res);
    }
  }

  if (cachedGallery) {
    return res.status(200).json({
      gallery: cachedGallery,
      next_page: page + 1
    });
  }

  try {
    const gallery = await Gallery.getAll(page);

    res.status(200).json({
      gallery: gallery,
      next_page: page + 1
    });

    cache.set(req.originalUrl, gallery);
  } catch (_) {
    if (!res.headersSent) {
      internalServerError(res);
    }
  }
});

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
galleryRouter.put('/upload', Users.checkAuth, checkPermissions(Permission.GALLERY), checkReadOnly, uploadMiddleware, async (req, res) => {
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
});

/**
 * [POST] /api/v1.0/gallery/delete
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param id number
 * 
 * @reponse JSON
 *  {}
 */
galleryRouter.delete('/delete', Users.checkAuth, checkPermissions(Permission.GALLERY), checkReadOnly, async (req, res) => {
  const user = req.user!;

  if (!('id' in req.body)) {
    return missingRequiredParameter('id', res);
  }

  const id = validator.toInt(req.body.id);

  if (isNaN(id)) {
    return invalidValueForParameter('id', res);
  }

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
});

export default galleryRouter;

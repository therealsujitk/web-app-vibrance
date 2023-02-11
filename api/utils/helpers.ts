import { NextFunction, Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import NodeCache from "node-cache";
import { query } from "../../config/db";
import { Permission } from "../../models/user";
import { IMAGE_PATH } from "../../utils/constants";
import { internalServerError, InvalidMIMEType } from "./errors";

const cacheObject = new NodeCache({
  stdTTL: 24 * 60 * 60,
  checkperiod: 12 * 60 * 60
});

export function checkPermissions(permissions = 0) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (hasPermissions(req, Permission.ADMIN | permissions)) {
      return next();
    }

    res.status(401).json({
      error: "You are not authorised to access this resource."
    });
  }
}

export function hasPermissions(req: Request, permissions: number) {
  return ((req.user?.permissions as number) & permissions) != 0;
}

/**
 * 
 * @param files The number of file uploads allowed
 * @param fileSize The size of each file in MB
 * @returns 
 */
export function getUploadMiddleware(files = 1, fileSize = 5) {
  return fileUpload({
    safeFileNames: true,
    preserveExtension: 5,
    abortOnLimit: true,
    responseOnLimit: 'File size exceeded the ' + fileSize + ' MB limit.',
    limitHandler: function (req, res, next) {
      res.status(400).json({
        error: this.responseOnLimit
      })
    },
    useTempFiles: true,
    tempFileDir: __dirname + '/../../public/uploads/tmp',
    limits: {
      fileSize: fileSize * 1024 * 1024,
      files: files,
    }
  });
}

export const MIME_TYPE = {
  IMAGE: ['image/jpeg', 'image/png']
}

export function handleFileUpload(file: UploadedFile, mimetypes: string[]) {
  if (!mimetypes.includes(file.mimetype)) {
    throw new InvalidMIMEType(mimetypes, file.mimetype);
  }

  const fileDir = __dirname + '/../../public' + IMAGE_PATH;
  const fileExt = file.name.split('.')[1] || '';
  const fileName = file.md5 + '.' + fileExt;
  const filePath = fileDir + '/' + fileName;

  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }

  file.mv(filePath, (err) => {
    if (err) throw err;
  });

  return fileName;
}

export async function checkReadOnly(req: Request, res: Response, next: NextFunction) {
  try {
    const readOnly = (await query("SELECT `value` FROM `settings` WHERE `key` = 'read_only'"))[0].value;

    if (readOnly === "1") {
      return res.status(409).json({
        error: 'Read only mode is enabled, contact an administrator to disable it.'
      });
    }

    return next();
  } catch (_) {
    return internalServerError(res);
  }
}

export const cache = cacheObject;

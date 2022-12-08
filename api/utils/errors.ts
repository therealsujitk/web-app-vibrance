import { Response } from 'express';
import { ClientError } from '../../utils/errors';

export class InvalidMIMEType extends ClientError {
  constructor(expected: string[], received: string) {
    super('Invalid MIME type, expected ' + expected.join(', ') + ' but got ' + received);
  }
};

export function badRequestError(err: Error, res: Response) {
  res.status(400).json({
    error: err.message
  });
}

export function internalServerError(res: Response) {
  res.status(500).json({
    error: 'An internal server error occurred.'
  });
}

export function missingRequiredParameter(param: string, res: Response) {
  res.status(400).json({
    error: `Missing required parameter '${param}'.`
  });
}

export function invalidValueForParameter(param: string, res: Response) {
  res.status(400).json({
    error: `Invalid value for the parameter '${param}'.`
  });
}

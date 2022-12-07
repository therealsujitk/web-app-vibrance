import express from 'express';
import validator from 'validator';
import { Settings, Users } from '../../interfaces';
import { Setting, SettingKey } from '../../models/setting';
import { internalServerError } from '../utils/errors';
import { checkPermissions } from '../utils/helpers';

const settingsRouter = express.Router();

/**
 * [GET] /api/v1.0/settings
 * 
 * @header X-Api-Key <API-KEY> (required)
 * 
 * @response JSON
 *  {
 *      "settings": [
 *          "KEY": "VALUE",
 *          ...
 *      ]
 *  }
 */
settingsRouter.get('', Users.checkAuth, checkPermissions(), async (req, res) => {
  try {
    const settings = await Settings.getAll();

    res.status(200).json({
      settings: Object.fromEntries(settings.map((s: { key: string, value: string }) => [s.key, s.value]))
    });
  } catch (_) {
    return internalServerError(res);
  }
});

/**
 * [POST] /api/v1.0/settings/edit
 * 
 * @header X-Api-Key <API-KEY> (required)
 * @param KEY VALUE string[]
 * 
 * @response JSON
 *  {
 *      "settings": [
 *          "KEY": "VALUE",
 *          ...
 *      ]
 *  }
 */
settingsRouter.post('/edit', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!;
  const settings: Setting[] = [];

  for (var key in req.body) {
    const value = req.body[key];
    key = key.toUpperCase();

    if (key in SettingKey) {
      settings.push({
        key: key as SettingKey,
        value: validator.escape(value.trim())
      });
    }
  }

  try {
    res.status(200).json({
      settings: await new Settings(user.id).update(settings)
    });
  } catch (_) {
    internalServerError(res);
  }
});

export default settingsRouter;

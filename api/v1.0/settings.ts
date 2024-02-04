import express from 'express'
import { dump } from '../../config/db'
import { Settings, Users } from '../../interfaces'
import { Setting, SettingKey } from '../../models/setting'
import { internalServerError } from '../utils/errors'
import { cache, checkPermissions } from '../utils/helpers'

const settingsRouter = express.Router()

/**
 * [GET] /api/v1.0/settings
 *
 * @header X-Api-Key <API-KEY> (required)
 *
 * @response JSON
 *  {
 *      "settings": {
 *          "KEY": "VALUE",
 *          ...
 *      }
 *  }
 */
settingsRouter.get('', Users.checkAuth, checkPermissions(), async (req, res) => {
  try {
    const settings = await Settings.getAll()
    const settingsObject = Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]))

    if (SettingKey.READ_ONLY in settingsObject) {
      settingsObject[SettingKey.READ_ONLY] = settingsObject[SettingKey.READ_ONLY] === '1'
    }

    res.status(200).json({
      settings: settingsObject,
    })
  } catch (_) {
    return internalServerError(res)
  }
})

/**
 * [POST] /api/v1.0/settings/edit
 *
 * @header X-Api-Key <API-KEY> (required)
 * @param KEY VALUE string[]
 *
 * @response JSON
 *  {
 *      "settings": {
 *          "KEY": "VALUE",
 *          ...
 *      }
 *  }
 */
settingsRouter.patch('/edit', Users.checkAuth, checkPermissions(), async (req, res) => {
  const user = req.user!
  const settings: Setting[] = []

  for (var key in req.body) {
    const value = req.body[key]
    key = key.toUpperCase()

    if (key in SettingKey) {
      settings.push({
        key: key.toLowerCase() as SettingKey,
        value: typeof value === 'string' ? value.trim() : value,
      })
    }
  }

  try {
    const settingsArray = await new Settings(user.id).update(settings)
    const settingsObject = Object.fromEntries(
      settingsArray!.map((s: { key: string; value: string }) => [s.key, s.value]),
    )
    res.status(200).json({
      settings: settingsObject,
    })
  } catch (_) {
    internalServerError(res)
  }
})

settingsRouter.post('/clear-cache', Users.checkAuth, async (req, res) => {
  try {
    cache.flushAll()
    res.status(200).json({})
  } catch (_) {
    internalServerError(res)
  }
})

settingsRouter.post('/backup', Users.checkAuth, async (req, res) => {
  try {
    const result = await dump()
    res.status(200).download(result.location, result.fileName)
  } catch (e) {
    internalServerError(res)
  }
})

export default settingsRouter

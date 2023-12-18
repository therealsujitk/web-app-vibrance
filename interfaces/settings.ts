import { transaction, query } from '../config/db';
import Activities from './audit-log';
import { LogAction } from '../models/log-entry';
import { Setting, SettingKey } from '../models/setting';
import { isEqual } from '../utils/helpers';

export default class Settings {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll() {
    return await query("SELECT * FROM `settings` WHERE `key` IN (?)", [Object.keys(SettingKey)]);
  }

  async #get(keys: SettingKey[]) : Promise<Setting[]> {
    if (keys.length == 0) {
      return {} as Setting[];
    }

    return await query("SELECT `key`, `value` FROM `settings` WHERE `key` IN (?)", [keys]) as Setting[];
  }

  async update(settings: Setting[]) {
    if (Object.keys(settings).length == 0) {
      return settings;
    }

    const old = await this.#get(settings.map(s => s.key));
    const queries = [];

    if (isEqual<Setting[]>(old, settings as Setting[])) {
      return;
    }

    for (var i = 0; i < settings.length; ++i) {
      queries.push({
        query: "UPDATE `settings` SET `value` = ? WHERE `key` = ?",
        options: [settings[i].value, settings[i].key]
      });
    }

    queries.push(Activities.createInsertQuery({
      actor: this.userId,
      action: LogAction.SETTINGS_EDIT,
      oldValue: old,
      newValue: settings
    }));

    await transaction(queries);
    return settings;
  }
}

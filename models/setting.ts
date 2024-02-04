export enum SettingKey {
  SITE_TITLE = 'site_title',
  SITE_DESCRIPTION = 'site_description',
  READ_ONLY = 'read_only',
}

export interface Setting {
  key: SettingKey
  value: any
}

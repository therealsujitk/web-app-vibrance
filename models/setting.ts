export enum SettingKey {
  SITE_TITLE = 'site_title',
  SITE_DESCRIPTION = 'site_description'
};

export interface Setting {
  key: SettingKey,
  value: string
}

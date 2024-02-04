export enum LogAction {
  SETTINGS_EDIT = 'settings_edit',
  USER_ADD = 'user_add',
  USER_EDIT = 'user_edit',
  USER_DELETE = 'user_delete',
  DAY_ADD = 'day_add',
  DAY_EDIT = 'day_edit',
  DAY_DELETE = 'day_delete',
  CATEGORY_ADD = 'category_add',
  CATEGORY_EDIT = 'category_edit',
  CATEGORY_DELETE = 'category_delete',
  VENUE_ADD = 'venue_add',
  VENUE_EDIT = 'venue_edit',
  VENUE_DELETE = 'venue_delete',
  ROOM_ADD = 'room_add',
  ROOM_EDIT = 'room_edit',
  ROOM_DELETE = 'room_delete',
  EVENT_ADD = 'event_add',
  EVENT_EDIT = 'event_edit',
  EVENT_DELETE = 'event_delete',
  PRO_SHOW_ADD = 'pro_show_add',
  PRO_SHOW_EDIT = 'pro_show_edit',
  PRO_SHOW_DELETE = 'pro_show_delete',
  GALLERY_ADD = 'gallery_add',
  GALLERY_DELETE = 'gallery_delete',
  MERCHANDISE_ADD = 'merchandise_add',
  MERCHANDISE_EDIT = 'merchandise_edit',
  MERCHANDISE_DELETE = 'merchandise_delete',
  SPONSOR_ADD = 'sponsor_add',
  SPONSOR_EDIT = 'sponsor_edit',
  SPONSOR_DELETE = 'sponsor_delete',
  TEAM_ADD = 'team_add',
  TEAM_EDIT = 'team_edit',
  TEAM_DELETE = 'team_delete',
}

export interface LogEntry {
  actor: number
  action: LogAction
  oldValue?: Object
  newValue?: Object
}

export enum Permission {
  ADMIN = (1 << 0),
  EVENTS = (1 << 1),
  GALLERY = (1 << 2),
  MERCHANDISE = (1 << 3),
  SPONSORS = (1 << 4),
  TEAM = (1 << 5),
}

export function getPermissionCode(permissions?: Permission[]) {
  if (!permissions) {
    return 0;
  }

  var p = 0;

  for (var i = 0; i < permissions.length; ++i) {
    p = p | (Permission[permissions[i]] as unknown as number);
  }

  return p;
}

export function getPermissionsFromCode(permissions: number) {
  const p: Permission[] = [];

  for (const key in Permission) {
    if ((permissions & Permission[key] as unknown as number) != 0) {
      p.push(key as unknown as Permission);
    }
  }

  return p;
}

export interface User {
  username: string,
  password: string,
  permissions: Permission[]
}

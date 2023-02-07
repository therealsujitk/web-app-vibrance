export enum CategoryType {
  CENTRAL = 'central',
  CLUB = 'club'
}

export interface Category {
  title: string,
  type: CategoryType,
  image?: string
}

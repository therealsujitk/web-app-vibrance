export enum CategoryType {
  CHAPTER = 'chapter',
  CLUB = 'club'
}

export interface Category {
  title: string,
  type: CategoryType,
  image?: string
}

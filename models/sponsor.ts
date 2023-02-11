export enum SponsorType {
  TITLE = 'title',
  FOOD_PARTNER = 'food_partner',
  MEDIA_PARTNER = 'media_partner',
  BANKING_PARTNER = 'banking_partner',
  MERCHANDISE_PARTNER = 'merchandise_partner',
  OTHER = 'other'
}

export interface Sponsor {
  title: string,
  type: SponsorType,
  description?: string,
  image?: string
}

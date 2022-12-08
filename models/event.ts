export interface Event {
  day_id: number,
  category_id: number,
  room_id: number,
  title: string,
  description?: string,
  image?: string,
  team_size?: string,
  start_datetime: Date,
  end_datetime: Date,
  cost: number,
  registration?: string
}

export interface Event {
  day_id: number,
  category_id: number,
  room_id: number,
  title: string,
  description?: string,
  image?: string,
  team_size_min: number,
  team_size_max: number,
  start_time: Date,
  end_time: Date,
  cost: number
}

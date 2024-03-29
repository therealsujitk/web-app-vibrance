export interface ProShow {
  day_id: number
  room_id: number
  title?: string
  description?: string
  image?: string
  start_time: Date
  end_time: Date
  cost: number
  faculty_coordinator_name?: string
  faculty_coordinator_mobile?: string
  student_coordinator_name?: string
  student_coordinator_mobile?: string
  event_id: number
}

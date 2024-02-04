// eslint-disable-next-line
import { Express } from 'express-serve-static-core'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number
      username: string
      permissions: number
    }
  }
}

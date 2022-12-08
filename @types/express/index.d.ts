import { Express } from "express-serve-static-core";
import { Permission } from "../../models/user";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number,
      username: string,
      permissions: number
    };
  }
}

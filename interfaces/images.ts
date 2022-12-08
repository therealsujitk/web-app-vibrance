import { query } from '../config/db';

export default class Images {
  constructor() {}

  static async get(image?: string) {
    if (!image) {
      return undefined;
    }

    return (await query("SELECT * FROM `images` WHERE `image` = ?", [image]))[0];
  }

  static createInsertQuery(image: string) {
    return {
      query: "INSERT INTO `images` (`image`) VALUES (?)",
      options: [image]
    };
  }
}

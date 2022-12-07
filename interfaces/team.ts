import { transaction, query } from '../config/db';
import Activities from './audit-log';
import Images from './images';
import { LogAction } from '../models/log-entry';
import { Team as TeamModel } from '../models/team';
import { isEqual, OrNull } from '../utils/helpers';
import { ClientError } from '../utils/errors';

export default class Team {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const limit = 10;
    const offset = (page - 1) * limit;

    return await query("SELECT `team`.`id` AS `id`, `name`, `description`, `image`, `phone`, `email` FROM `team` LEFT JOIN `images` ON `image_id` = `images`.`id` LIMIT ? OFFSET ?", [limit, offset]);
  }

  async #get(id: number) {
    const member = (await query("SELECT `name`, `description`, `image`, `phone`, `email` FROM `team` LEFT JOIN `images` ON `image_id` = `images`.`id` WHERE `team`.`id` = ?", [id]))[0];

    if (typeof member === 'undefined') {
      throw new ClientError(`No team member with id '${id}' exists.`);
    }

    return member;
  }

  async add(team: TeamModel) {
    const existing = await Images.get(team.image);
    const queries = [
      ...!existing && team.image ? [Images.createInsertQuery(team.image)] : [],
      {
        query: "INSERT INTO `team` (`name`, `description`, `image_id`, `phone`, `email`) VALUES (?, ?, ?, ?, ?)",
        options: (results: any[]) => [
          team.name,
          team.description,
          existing?.id ?? (team.image ? results[0].insertId : undefined),
          team.phone,
          team.email
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.TEAM_ADD,
        newValue: team
      })
    ];
  
    return {
      id: (await transaction(queries))[!existing && team.image ? 1 : 0].insertId,
      ...team
    };
  }

  async edit(id: number, team: OrNull<TeamModel>) {
    const old = await this.#get(id);
    team.name = team.name ?? old.name;
    team.description = team.description ?? old.description;
    team.image = team.image ?? old.image;
    team.phone = team.image ?? old.phone;
    team.email = team.image ?? old.email;
    const existing = await Images.get(team.image);

    if (isEqual<Team>(old, team as Team)) {
      return { id, ...team };
    }

    const queries = [
      ...!existing && team.image ? [Images.createInsertQuery(team.image)] : [],
      {
        query: "UPDATE `team` SET `name` = ?, `description` = ?, `image_id` = ?, `phone` = ?, `email` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          team.name,
          team.description,
          existing?.id ?? (team.image ? results[0].insertId : undefined),
          team.phone,
          team.email,
          id
        ]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.TEAM_EDIT,
        oldValue: old,
        newValue: team
      })
    ];
  
    await transaction(queries);
    return { id, ...team };
  }

  async delete(id: number) {
    const old = await this.#get(id);
    const queries = [
      {
        query: "DELETE FROM `team` WHERE `id` = ?",
        options: [id]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.TEAM_DELETE,
        oldValue: old
      })
    ];
  
    await transaction(queries);
  }
}

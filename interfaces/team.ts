import { transaction, query } from '../config/db';
import Activities from './audit-log';
import Images from './images';
import { LogAction } from '../models/log-entry';
import { Team as TeamModel } from '../models/team';
import { isEqual, OrNull } from '../utils/helpers';
import { ClientError } from '../utils/errors';
import { IMAGE_URL, LIMIT } from '../utils/constants';

export default class Team {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  static async getAll(page = 1) {
    const offset = (page - 1) * LIMIT;

    return await query("SELECT " + 
      "`team`.`id` AS `id`, " + 
      "`name`, " + 
      "`team_name`, " + 
      "`role`, " + 
      "CONCAT('" + IMAGE_URL + "', `image`) AS `image`, " + 
      "`phone`, " + 
      "`email` " + 
      "FROM `team` " + 
      "LEFT JOIN `images` " + 
      "ON `image_id` = `images`.`id` " +
      "ORDER BY `team_name`, `team`.`id` " + 
      "LIMIT ? OFFSET ?", [LIMIT, offset]);
  }

  static async getTeams() {
    return await query("SELECT `team_name` FROM `team` GROUP BY `team_name`");
  }

  async #get(id: number) {
    const member = (await query("SELECT `name`, `team_name`, `role`, `image`, `phone`, `email` FROM `team` LEFT JOIN `images` ON `image_id` = `images`.`id` WHERE `team`.`id` = ?", [id]))[0];

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
        query: "INSERT INTO `team` (`name`, `team_name`, `role`, `image_id`, `phone`, `email`) VALUES (?, ?, ?, ?, ?, ?)",
        options: (results: any[]) => [
          team.name,
          team.team_name,
          team.role,
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
      ...team,
      image: team.image ? IMAGE_URL + team.image : null,
    };
  }

  async edit(id: number, team: OrNull<TeamModel>) {
    const old = await this.#get(id);
    team.name = team.name ?? old.name;
    team.team_name = team.team_name ?? old.team_name;
    team.role = team.role ?? old.role;

    if (team.image !== null) {
      team.image = team.image ?? old.image;
    }

    if (team.phone !== null) {
      team.phone = team.phone ?? old.phone;
    }

    if (team.email !== null) {
      team.email = team.email ?? old.email;
    }

    const existing = await Images.get(team.image);

    if (isEqual<Team>(old, team as Team)) {
      return { id, ...team };
    }

    const queries = [
      ...!existing && team.image ? [Images.createInsertQuery(team.image)] : [],
      {
        query: "UPDATE `team` SET `name` = ?, `team_name` = ?, `role` = ?, `image_id` = ?, `phone` = ?, `email` = ? WHERE `id` = ?",
        options: (results: any[]) => [
          team.name,
          team.team_name,
          team.role,
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
    return { 
      id, 
      ...team,
      image: team.image ? IMAGE_URL + team.image : null
    };
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

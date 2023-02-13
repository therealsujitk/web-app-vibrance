/*
    The Database Connection - Please don't change
    anything in this file
 */
import fs from 'fs';
import mysql from 'mysql';
import mysqldump from 'mysqldump';
import path from 'path';
import { MYSQL_HOST } from '../config';
import { MYSQL_USER } from '../config';
import { MYSQL_PASSWORD } from '../config';
import { MYSQL_DATABASE } from '../config';

const pool = mysql.createPool({
  connectionLimit: 10,
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE
});

type OptionsBuilder = (results: any[]) => any[];
interface Query {
  query: string,
  options: any[] | OptionsBuilder
}

const transaction = async (queries: Query[]) : Promise<any[]> => {
  const promise : Promise<any[]> = new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        return reject(err);
      }

      connection.beginTransaction((err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            reject(err);
          });
        }

        const results: any[] = [];
        const recursiveQuery = (index = 0) => {
          if (index == queries.length) {
            return connection.commit((err) => {
              connection.release();

              if (err) {
                return reject(err);
              }

              resolve(results);
            });
          }

          const query = queries[index];

          if (query.options instanceof Function) {
            query.options = query.options(results);
          }

          connection.query(query.query, query.options, (err, result, fields) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                reject(err);
              });
            }

            if (result) {
              results.push(JSON.parse(JSON.stringify(result)));
            } else {
              results.push([]);
            }

            recursiveQuery(index + 1);
          });
        };

        recursiveQuery();
      });
    });
  });

  return promise;
}

const query = async (query: string, options: any[] = []) : Promise<any> => {
  const promise = new Promise((resolve, reject) => {
    pool.query(query, options, (err, results, fields) => {
      if (err) {
        return reject(err);
      }

      if (results) {
        resolve(JSON.parse(JSON.stringify(results)));
      } else {
        resolve(null);
      }
    });
  });

  return promise;
}

const dump = async(location = __dirname + '/../public/exports') => {
  fs.mkdirSync(location, { recursive: true });
  const fileName = `vibrance_${new Date().getTime()}.sql`;
  location = path.resolve(`${location}/${fileName}`);

  await mysqldump({
    connection: {
      host: MYSQL_HOST!,
      user: MYSQL_USER!,
      password: MYSQL_PASSWORD!,
      database: MYSQL_DATABASE!
    },
    dumpToFile: location
  });

  return { fileName, location };
}

export { transaction, query, dump };

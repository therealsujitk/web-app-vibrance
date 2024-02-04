# Vibrance

![License](https://img.shields.io/badge/license-MIT-blue.svg)

A web application for VIT Chennai's cultural festival with a built-in Rest API for easy access of data on other platforms and an admin panel to make life easier for the event organisers.

![Preview](./preview.gif)

## Links

- [Admin Panel](https://vitvibrance.adaptable.app/admin)
- [API Documentation](https://vitvibrance.adaptable.app/docs)
- [Donate](https://therealsuji.tk/donate)

## Requirements

- Node.js 18+
- MySQL 5.6+ or MariaDB 10.0.5+

## Installation & Setup

Firstly you'll need a local copy of this project to get started. You can either use git to clone this repository, or manually download it from GitHub.

The package manager used in this project is yarn, incase you don't have it you'll need to [install](https://classic.yarnpkg.com/lang/en/docs/install) it first.

Install the project dependencies by running the following command in the project's root directory.

```sh
$ yarn install
```

After the installation is complete you can then start setting up your database.

- The first thing you need is to set some environment variables, you can do that by creating a `.env` file in your project's root directory. Here are the variables used in this project.

  - `PORT` - The port that your server will run on. (If this is a production deployment, your server should automatically set it to 80)
  - `MYSQL_HOST` - The host of your MySQL connection.
  - `MYSQL_USER` - The username used to access the MySQL database.
  - `MYSQL_PASSWORD` - The password for the given MySQL username.
  - `MYSQL_DATABASE` - The name of the database used by this application.
  - `API_EXPIRY_DAYS` - The number of days after which a user's API key will expire.

  Here's an example of the final `.env` file.

  ```env
  PORT=8080
  MYSQL_HOST=localhost
  MYSQL_USER=root
  MYSQL_PASSWORD=
  MYSQL_DATABASE=vibrance
  API_EXPIRY_DAYS=10
  ```

- After setting up your environment variables, run the following command in your project's root directory to fill up the database with some necessary information.

  ```sh
  $ yarn migrate up
  ```

If you are running a production build of this application, you'll need to build this project. To do that run the following command in your project's root directory.

```sh
$ yarn build
```

> **Note:** All of the commands above are executed only in the project's root directory, ensure not to run them in sub-directories.

> **Note:** The migration/build step automatically creates a default user with the username '**admin**' and password '**password**' for you to sign in to the admin panel.

## Usage

### Production

If you are running a production build of this application, just run the following command in your project's root directory and you're good to go!

```sh
$ yarn start
```

### Development

If you are running a development build, you'll first have to start your server by running the following command in your project's root directory. (Ensure you've installed all dependencies and executed the build command as mentioned in the steps above.)

```sh
$ yarn dev
```

Open up another terminal, and run the deveopment command of the frontend that you require. For example to run the dev build of the admin frontend, head over to the `frontend/admin` directory and run the `$ yarn dev` command.

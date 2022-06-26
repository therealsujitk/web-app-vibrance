// This is preloaded to avoid errors in production
// const dotenv = require('dotenv');
// dotenv.config();

module.exports = {
    PORT: process.env.PORT,
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    SESSION_SECRET: process.env.SESSION_SECRET
};

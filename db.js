const { Sequelize } = require('sequelize');
const pg = require('pg');
require('dotenv').config();

const user = process.env.DB_USER;
const pass = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const dbName = process.env.DB_NAME;

module.exports = new Sequelize(`postgres://${user}:${pass}@${host}/${dbName}?ssl=true`, {
  dialect: 'postgres',
  dialectModule: pg,
  connect_timeout: '10',
  sslmode: 'prefer',
});
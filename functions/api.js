require('dotenv').config();
const express = require('express');
const sequelize = require('../db');
const api = express();
const models = require('../models/models');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const router = require('../routes/index');
const errorHandler = require('../middleware/ErrorHandlingMiddleware');
const path = require('path');
const colors = require('colors');
const serverless = require('serverless-http');
const pg = require('pg');

const PORT = process.env.PORT || 3001;

api.use(cors());
api.use(express.json());
api.use(express.static(path.resolve(__dirname, 'static')));
api.use(fileUpload({}));
api.use('/.netlify/functions/api', router);

//Last in list
api.use(errorHandler);

exports.handler = serverless(api);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    api.listen(PORT, () => {
      console.log(`App running on port ${PORT}`.bgWhite.black);
    });
    api.get('/test', (req, res) => {
      res.json({
        message: 'Hello from backend bbb-server express.js',
      });
    });
  } catch (e) {
    console.log(e);
  }
};

start();

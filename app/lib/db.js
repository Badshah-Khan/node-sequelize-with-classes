import Sequelize, { DataTypes } from 'sequelize';
import fs from 'fs';
import path from "path";
import config from 'config';

const sequelize = new Sequelize(
    config.get('postgres.database'),
    config.get('postgres.user'),
    config.get('postgres.password'),
    {
        host: config.get('postgres.host'),
        dialect: 'postgres',
        logging: false
    }
)

// Read all model files
export const models = {};

const modelPath = path.resolve(__dirname, "..", 'models');

fs.readdirSync(modelPath)
.filter(file => file.indexOf('.') !== 0 && file.slice(-3) === '.js')
.forEach(file => {
    // eslint-disable-next-line global-require
    const modelFile = require(path.join(modelPath, file));
    try {
      const model = modelFile.default(sequelize, DataTypes);
      if (model.Model) {
        models[model.Model.name] = model;
      }
    } catch (ex) {
      console.log(ex);
    }
});

// Establish associations
const modelList = sequelize.models;
Object.keys(modelList).forEach(modelName => {
  if (modelList[modelName].associate) {
    try {
      modelList[modelName].associate(modelList);
    } catch (ex) {
      console.log(ex);
    }
  }
});

export const db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
import { Sequelize, Model, DataTypes, Op, QueryTypes } from 'sequelize';
import config from 'config';

const mysqlConfig = config.get('mysql');

export const sequelizeCon = new Sequelize(
  mysqlConfig.database,
  mysqlConfig.username,
  mysqlConfig.password,
  {
    host: mysqlConfig.host,
    dialect: mysqlConfig.dialect,
    logging: mysqlConfig.logging,

    // ✅ Add connection pooling for stability
    pool: {
      max: 5,         // Maximum number of connections
      min: 0,         // Minimum number of connections
      acquire: 30000, // Maximum time (ms) to try getting a connection before throwing error
      idle: 10000,    // Time (ms) a connection can be idle before being released
      evict: 1000,    // How frequently idle connections are removed
    },

    dialectOptions: {
      connectTimeout: 10000, // Prevent long hangs if DB is slow
    }
  }
);


sequelizeCon.authenticate()
  .then(() => console.log('Database connection established successfully'))
  .catch((err) => console.error('Unable to connect to the database:', err.message));

export { Model, DataTypes, Op, QueryTypes };

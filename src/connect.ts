export const connectToDb = async (res: any) => {
  const { Sequelize } = require("sequelize");

  const connection = new Sequelize(process.env.DB_CONNECTION_URL);
  module.exports = connection;

  try {
    await connection.authenticate();

    console.log("Connection has been established successfully.");

    return 200;
  } catch (error) {
    console.error("Unable to connect to the database:", error);

    return 503;
  }
};

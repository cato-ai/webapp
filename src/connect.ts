import { Sequelize } from "sequelize";
require("dotenv").config();

export const connectToDb = async (res: any) => {
  const connection = new Sequelize(process.env.DB_CONNECTION_URL);
  try {
    await connection.authenticate();

    console.log("Connection has been established successfully.");

    return 200;
  } catch (error) {
    console.error("Unable to connect to the database:", error);

    return 503;
  }
};

export const sequelize = new Sequelize(process.env.DB_CONNECTION_URL, {
  dialect: "postgres",
});

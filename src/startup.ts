import { sequelize } from "./connect";

export const startup = async () => {
  try {
    await sequelize.sync({ force: false, logging: false }); // Set `force: true` to drop and recreate tables
    console.log("Database synced successfully");
  } catch (error) {
    console.log("Cannot startup DB", error);
  }
};

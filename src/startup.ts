import { sequelize } from "./connect";

export const startup = async () => {
  try {
    await sequelize.sync({ force: true, logging: false });
    console.log("Database synced successfully");
  } catch (error) {
    console.log("Cannot startup DB", error);
  }
};

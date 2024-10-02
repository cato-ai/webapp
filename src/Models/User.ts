import { DataTypes, Model, Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import { sequelize } from "../connect";

type User_Type = {
  id: typeof DataTypes.UUID;
  email: typeof DataTypes.STRING;
  password: typeof DataTypes.STRING;
  firstName: typeof DataTypes.STRING;
  lastName: typeof DataTypes.STRING;
  createdAt: typeof DataTypes.DATE;
  updatedAt: typeof DataTypes.DATE;
};

export const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      get() {
        return this.getDataValue("id");
      },
      set(value: string) {
        this.setDataValue("id", value);
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue("firstName");
      },
      set(value: string) {
        this.setDataValue("firstName", value);
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue("lastName");
      },
      set(value: string) {
        this.setDataValue("lastName", value);
      },
    },
    password: {
      type: DataTypes.STRING(64),
      allowNull: false,
      set(value: string) {
        const hashedPassword = bcrypt.hashSync(value, 10);
        this.setDataValue("password", hashedPassword);
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      get() {
        return this.getDataValue("email");
      },
      set(value: string) {
        this.setDataValue("email", value);
      },
    },
  },
  {
    timestamps: true,
    tableName: "User",
    freezeTableName: true,
    modelName: "User",
    updatedAt: "accountUpdated",
    createdAt: "accountCreated",
  }
);

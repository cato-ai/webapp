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
      validate: {
        is: /^[a-zA-Z]+$/,
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
      validate: {
        is: /^[a-zA-Z]+$/,
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
      validate: {
        is: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      },
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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

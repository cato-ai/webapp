import { DataTypes, Model, Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import { timeStamp } from "console";

const connection = require("../connect.ts");

type User_Type = {
  id: typeof DataTypes.UUID;
  email: typeof DataTypes.STRING;
  password: typeof DataTypes.STRING;
  firstName: typeof DataTypes.STRING;
  lastName: typeof DataTypes.STRING;
  createdAt: typeof DataTypes.DATE;
  updatedAt: typeof DataTypes.DATE;
};

const User = connection.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUID,
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
        this.setDataValue("firstname", value);
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
      validate: {
        is: /^[0-9a-f]{64}$/i,
      },
      set(value: string) {
        this.setDataValue(
          "password",
          bcrypt.hash(value, 10, () => {})
        );
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue("email");
      },
      set(value: string) {
        this.setDataValue("email", value);
      },
    },
    accountCreated: {},
  },
  {
    connection,
    timestamps: true,
    tableName: "User",
    freezeTableName: true,
    modelName: "User",
    updatedAt: "accountUpdated",
    createdAt: "accountCreated",
  }
);

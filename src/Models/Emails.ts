import bcrypt from "bcrypt";
import { sequelize } from "../connect";
import { DataTypes } from "sequelize";

export const Emails = sequelize.define(
  "Emails",
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
    verification_mail_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "Emails",
    freezeTableName: true,
    modelName: "Emails",
    updatedAt: "emailUpdated",
    createdAt: "emailCreated",
  }
);

import { DataTypes, Model, Sequelize } from "sequelize";
import bcrypt from "bcrypt";
import { sequelize } from "../connect";
import AWS from "aws-sdk";
const fs = require("fs");

var config = new AWS.Config();

const S3 = new AWS.S3();

export const S3_Bucket = sequelize.define(
  "S3_Bucket",
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
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      get() {
        return this.getDataValue("url");
      },
      set(value: string) {
        this.setDataValue("url", value);
      },
      validate: {
        is: /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/,
      },
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      get() {
        return this.getDataValue("file_name");
      },
      set(value: string) {
        this.setDataValue("file_name", value);
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: false,
      get() {
        return this.getDataValue("user_id");
      },
      set(value: string) {
        this.setDataValue("user_id", value);
      },
    },
  },
  {
    timestamps: true,
    tableName: "S3_Bucket",
    freezeTableName: true,
    modelName: "S3_Bucket",
    updatedAt: false,
    createdAt: "upload_date",
  }
);

export const S3_Bucket_Upload = async (user_id, key, value) => {
  try {
    let data = await S3.upload(
      {
        Key: `${user_id}/${key}`,
        Body: value,
        Bucket: process.env.S3_BUCKET_NAME,
      },
      (err, data) => {
        if (err) {
          console.error("ERROR MSG: ", err);
          return err;
        } else {
          console.info("Successfully uploaded data");
          return data;
        }
      }
    ).promise();
    return await data;
  } catch (err) {
    console.error(err);
  }
};

export const S3_Bucket_Fetch = (key) => {
  let data = undefined;
  S3.getObject(
    {
      Key: key,
      Bucket: process.env.S3_BUCKET_NAME,
    },
    (err, data) => {
      if (err) {
        console.error("ERROR MSG: ", err);
        return err;
      } else {
        console.info("Successfully retrieved object");
      }
    }
  );
  return data;
};

export const S3_Bucket_Delete = async (key) => {
  try {
    let data = await S3.deleteObject(
      {
        Key: key,
        Bucket: process.env.S3_BUCKET_NAME,
      },
      (err, data) => {
        if (err) {
          console.error("ERROR MSG: ", err);
          return err;
        } else {
          console.info("Successfully Deleted object");
        }
      }
    ).promise();
    return await data;
  } catch (err) {
    console.error(err);
  }
};

import AWS from "aws-sdk";
import { User } from "./Models/User";
import { DataTypes } from "sequelize";
import { logger } from ".";
import { PublishInput } from "aws-sdk/clients/sns";
import { GetTopicAttributesCommand } from "@aws-sdk/client-sns";

type email_notification = {
  user_id: string;
  email_message: string;
  target_email: string;
  email_created: Date;
  email_sent?: Date;
};

export const push_to_sns = async (user) => {
  AWS.config.update({ region: "us-east-1" });
  const SNS = new AWS.SNS();
  const verification_link = `https://demo.sampurna.xyz/v1/user/verify/self?token=${user.dataValues.token}&email=${user.dataValues.email}`; //create api endpoint here with required details, bcrypt for the hash of the username and password, a long with timestamp to cehck if it's expired or not
  try {
    if (user === null || user === undefined) {
      logger.error(
        "User passed to SNS is NULL | Undefined, cannot send email to empty user"
      );
      return -1;
    }

    const notification: email_notification = {
      user_id: user.dataValues.id,
      target_email: user.dataValues.email,
      email_message: `Use this link to verify your email address : ${verification_link}`,
      email_created: new Date(),
    };

    const publish_message: PublishInput = {
      TopicArn: "arn:aws:sns:us-east-1:762233751904:user_verification_trigger",
      Message: JSON.stringify(notification),
    };

    const publishTextPromise = new AWS.SNS({
      apiVersion: "2010-03-31",
    })
      .publish(publish_message)
      .promise();

    publishTextPromise
      .then((data) => {
        logger.info("Message published to SNS");
      })
      .catch((err) => {
        logger.error(err, "ERROR in publishing to SNS");
      });
  } catch (err) {
    logger.error(err, "ERROR IN push_to_sns method");
  }
};

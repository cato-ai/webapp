import url from "url";
import { connectToDb } from "./connect";
import process from "process";
import { User } from "./Models/User";
import { startup } from "./startup";
import bcrypt from "bcrypt";
import StatsD from "node-statsd";
import AWS from "aws-sdk";

require("dotenv").config();

import express from "express";
export const app = express();
import bodyParser from "body-parser";
import {
  S3_Bucket,
  S3_Bucket_Delete,
  S3_Bucket_Upload,
} from "./Models/S3_Bucket";
import path from "path";

const hostname: string = process.env.SERVER_HOSTNAME;
const port = process.env.SERVER_PORT_NUMBER;
const statsD = new StatsD({
  host: "localhost",
  port: 8125,
});

startup();

app.all("/healthz", (req, res) => {
  const startTime = Date.now();

  statsD.increment(`api.${req.path}.calls`);

  res.setHeader("cache-control", "no-cache");

  const urlParams = url.parse(req.url);

  if (urlParams.query !== null) {
    console.error("400, Query Params present");
    res.statusCode = 400;
    res.end();
  } else if (req.url === "/healthz" && req.method === "GET") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      if (body) {
        console.error("400, Req contains Body");
        res.statusCode = 400;
        res.end();
      } else {
        const statusCode = await connectToDb(res);
        res.statusCode = statusCode;
        switch (statusCode) {
          case 200:
            res.end();
            console.info("200, OK!");
            break;
          case 503:
            res.end();
            console.error("503, Cannot connect to DB!");
            break;
        }
      }
    });
  } else if (req.url === "/healthz" && req.method !== "GET") {
    console.error("405, Wrong Type of Request");
    res.statusCode = 405;
    res.end();
  } else {
    console.error("404,  Not found");
    res.statusCode = 404;
    res.end();
  }
  const responseTime = Date.now() - startTime;
  statsD.timing(`api.${req.path}.response_time`, responseTime);
});

app.get("/v1/user/self", bodyParser.json(), async (req, res) => {
  statsD.increment(`api.${req.path}.get.calls`);
  const apiResponseTime = Date.now();
  const urlParams = url.parse(req.url);
  if (req.headers["content-length"] !== undefined) {
    res.statusCode = 400;
    console.error("400, Get Request contains body");
    res.end();
  } else if (!Object.keys(req.headers).includes("authorization")) {
    res.statusCode = 401;
    console.error("401, No auth header present");
    res.end();
  } else if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.query === null && req.body !== undefined) {
    const authToken = req.headers.authorization;
    const [email, password] = atob(authToken.split(" ")[1]).split(":");
    const dbTiming = Date.now();
    await User.findOne({ where: { email: email } })
      .then(async (user) => {
        let matches = await bcrypt.compare(password, user.dataValues.password);
        if (matches) {
          let responseBody = user.dataValues;
          delete responseBody["password"];
          res.statusCode = 200;
          res.send({ data: responseBody });
          console.log("Found User Successfully");
        } else {
          res.statusCode = 401;
          res.end();
          console.log("401, Unauthorized user, credentials don't match");
        }
        statsD.timing(
          `db.retrieve.${req.path}.get.response_time`,
          Date.now() - dbTiming
        );
      })
      .catch((error) => {
        console.error("401, Could not find User");
        res.statusCode = 401;
        res.end();
      });
  } else if (urlParams.query !== null) {
    console.error("400, Query Params present");
    res.statusCode = 400;
    res.end();
  } else {
    console.error("400, Bad request");
    res.statusCode = 400;
    res.end();
  }
  statsD.timing(
    `api.${req.path}.get.response_time`,
    Date.now() - apiResponseTime
  );
});

app.put("/v1/user/self", bodyParser.json(), async (req, res) => {
  statsD.increment(`api.${req.path}.put.calls`);
  const apiResponseTime = Date.now();
  const urlParams = url.parse(req.url);
  if (!Object.keys(req.headers).includes("authorization")) {
    res.statusCode = 401;
    console.error("401, No auth header present");
    res.end();
  } else if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.query === null && req.body !== undefined) {
    //Req is correct
    const authToken = req.headers.authorization;
    const [email, password] = atob(authToken.split(" ")[1]).split(":");

    try {
      const dbTiming = Date.now();
      const user = await User.findOne({
        where: { email: email },
      });
      let matches = await bcrypt.compare(password, user.dataValues.password);
      if (matches && !Object.keys(req.body).includes("email")) {
        await user
          .update({
            firstName:
              req.body.first_name == ""
                ? user.dataValues.firstName
                : req.body.first_name,
            lastName:
              req.body.last_name == ""
                ? user.dataValues.lastName
                : req.body.last_name,
            password:
              req.body.password == ""
                ? user.dataValues.password
                : req.body.password,
          })
          .then((_user) => {
            res.statusCode = 204;
            res.end();
            console.log("Updated user Successfully");
          })
          .catch((error) => {
            res.statusCode = 409;
            console.error(
              "409, Conflict, could not find User with given credentials"
            );
            res.send({ message: error });
          });
        statsD.timing(
          `db.update.${req.path}.put.response_time`,
          Date.now() - dbTiming
        );
      } else if (Object.keys(req.body).includes("email")) {
        res.statusCode = 400;
        console.error("400, email cannot be updated");
        res.end();
      } else {
        res.statusCode = 401;
        console.error("401, Credentials don't match");
        res.send();
      }
    } catch (error) {
      res.statusCode = 401;
      console.error(
        "401, Error in Locating and Updating User, might have wrong credentials"
      );
      res.send({ message: error.message });
    }
  } else if (urlParams.query !== null) {
    console.error("400, Query Params present");
    res.statusCode = 400;
    res.end();
  } else {
    console.error("400, Bad request");
    res.statusCode = 400;
    res.end();
  }
  statsD.timing(
    `api.${req.path}.put.response_time`,
    Date.now() - apiResponseTime
  );
});

app.post("/v1/user", bodyParser.json(), async (req, res) => {
  statsD.increment(`api.${req.path}.post.calls`);

  const apiResponseTime = Date.now();
  res.setHeader("cache-control", "no-cache");
  const urlParams = url.parse(req.url);

  if (urlParams.query === null && req.body !== undefined) {
    //Req is correct
    try {
      const dbTiming = Date.now();
      await User.create({
        firstName: req.body.first_name,
        lastName: req.body.last_name,
        password: req.body.password,
        email: req.body.email,
      })
        .then((user) => {
          res.statusCode = 201;
          let responseBody = user.dataValues;
          delete responseBody["password"];
          res.send({ data: responseBody });
          console.log("Created User Successfully");
        })
        .catch((error) => {
          res.statusCode = 400;
          console.error(
            "400, error in creating user, constriant violation likely"
          );
          res.send({ message: error });
        });
      statsD.timing(
        `db.insert.${req.path}.post.response_time`,
        Date.now() - dbTiming
      );
    } catch (error) {
      res.statusCode = 409;
      res.send({ message: error });
    }
  } else if (urlParams.query !== null) {
    console.error("400, Query Params present");

    res.statusCode = 400;
    res.end();
  } else {
    console.error("400, Bad request");
    res.statusCode = 400;
    res.end();
  }

  statsD.timing(
    `api.${req.path}.post.response_time`,
    Date.now() - apiResponseTime
  );
});

app.post(
  "/v1/user/self/pic",
  bodyParser.raw({
    type: "image/png",
    limit: "10mb",
  }),
  async (req, res) => {
    statsD.increment(`api.${req.path}.post.calls`);
    const apiResponseTime = Date.now();
    res.setHeader("cache-control", "no-cache");
    console.log(req);
    const urlParams = url.parse(req.url);
    if (!Object.keys(req.headers).includes("authorization")) {
      res.statusCode = 401;
      console.error("401, No auth header present");
      res.end();
    } else if (
      req.headers.authorization === undefined ||
      req.headers.authorization === ""
    ) {
      res.statusCode = 400;
      res.end();
    } else if (urlParams.query === null && req.body !== undefined) {
      //Req is correct
      const authToken = req.headers.authorization;
      const [email, password] = atob(authToken.split(" ")[1]).split(":");
      try {
        const S3Timing = Date.now();
        await User.findOne({ where: { email: email } }).then(async (user) => {
          if (user === null) {
            res.statusCode = 400;
            res.statusMessage = "Bad Request - No such user found";
            res.end();
          }
          let matches = await bcrypt.compare(
            password,
            user.dataValues.password
          );
          let image_exists = await S3_Bucket.findOne({
            where: { user_id: user.dataValues.id },
          }).then((s3_data) =>
            s3_data === null || s3_data === undefined ? false : true
          );
          console.log(image_exists, "AAAA");
          if (matches && !image_exists) {
            await S3_Bucket_Upload(
              user.dataValues.id,
              `profile_pic.png`,
              req.body
            ).then((data) => {
              statsD.timing(
                `S3.Upload.${req.path}.post.response_time`,
                Date.now() - S3Timing
              );
              const dbTiming = Date.now();
              S3_Bucket.create({
                user_id: user.dataValues.id,
                url: data.Location,
                file_name: data.Key,
              }).then((s3_data) => {
                res.statusCode = 201;
                res.send({
                  data: { ...s3_data.dataValues, file_name: "profile_pic.png" },
                });
                res.end();
                statsD.timing(
                  `db.insert.${req.path}.post.response_time`,
                  Date.now() - dbTiming
                );
              });
            });
          } else {
            res.statusCode = 400;
            res.statusMessage = "Bad request - profile iamge already exists";
            res.end();
          }
        });
      } catch (err) {
        console.error(err);
        res.statusCode = 400;
        res.end();
      }
    }
    statsD.timing(
      `api.${req.path}.post.response_time`,
      Date.now() - apiResponseTime
    );
  }
);

app.get("/v1/user/self/pic", bodyParser.json(), async (req, res) => {
  statsD.increment(`api.${req.path}.get.calls`);
  const apiResponseTime = Date.now();
  const urlParams = url.parse(req.url);
  if (req.headers["content-length"] !== undefined) {
    res.statusCode = 400;
    console.error("400, Get Request contains body");
    res.end();
  } else if (!Object.keys(req.headers).includes("authorization")) {
    res.statusCode = 401;
    console.error("401, No auth header present");
    res.end();
  } else if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.query === null && req.body !== undefined) {
    const authToken = req.headers.authorization;
    const [email, password] = atob(authToken.split(" ")[1]).split(":");
    const dbTiming = Date.now();
    await User.findOne({ where: { email: email } })
      .then(async (user) => {
        let matches = await bcrypt.compare(password, user.dataValues.password);
        if (matches) {
          S3_Bucket.findOne({ where: { user_id: user.dataValues.id } }).then(
            async (s3_data) => {
              res.statusCode = 200;
              res.send({
                data: { ...s3_data.dataValues, file_name: "profile_pic.png" },
              });
              console.log("Found S3 Object Successfully");
            }
          );
        } else {
          res.statusCode = 401;
          res.end();
          console.log("401, Unauthorized user, credentials don't match");
        }
        statsD.timing(
          `db.retrieve.${req.path}.get.response_time`,
          Date.now() - dbTiming
        );
      })
      .catch((error) => {
        console.error("401, Could not find User");
        res.statusCode = 401;
        res.end();
      });
  } else if (urlParams.query !== null) {
    console.error("400, Query Params present");
    res.statusCode = 400;
    res.end();
  } else {
    console.error("400, Bad request");
    res.statusCode = 400;
    res.end();
  }
  statsD.timing(
    `api.${req.path}.get.response_time`,
    Date.now() - apiResponseTime
  );
});

app.delete("/v1/user/self/pic", bodyParser.json(), async (req, res) => {
  statsD.increment(`api.${req.path}.get.calls`);
  const apiResponseTime = Date.now();
  const urlParams = url.parse(req.url);
  if (!Object.keys(req.headers).includes("authorization")) {
    res.statusCode = 401;
    console.error("401, No auth header present");
    res.end();
  } else if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.query === null && req.body !== undefined) {
    const authToken = req.headers.authorization;
    const [email, password] = atob(authToken.split(" ")[1]).split(":");
    const dbTiming = Date.now();
    await User.findOne({ where: { email: email } })
      .then(async (user) => {
        let matches = await bcrypt.compare(password, user.dataValues.password);
        if (matches) {
          S3_Bucket.findOne({ where: { user_id: user.dataValues.id } }).then(
            async (s3_data) => {
              await S3_Bucket_Delete(s3_data.dataValues.file_name).then((_) => {
                s3_data.destroy().then((data) => {
                  res.statusCode = 204;
                  res.end();
                  console.log("Deleted s3 object successfully");
                });
              });
            }
          );
        } else {
          res.statusCode = 401;
          res.end();
          console.log("401, Unauthorized user, credentials don't match");
        }
        statsD.timing(
          `db.retrieve.${req.path}.get.response_time`,
          Date.now() - dbTiming
        );
      })
      .catch((error) => {
        console.error("401, Could not find User");
        res.statusCode = 401;
        res.end();
      });
  } else if (urlParams.query !== null) {
    console.error("400, Query Params present");
    res.statusCode = 400;
    res.end();
  } else {
    console.error("400, Bad request");
    res.statusCode = 400;
    res.end();
  }
  statsD.timing(
    `api.${req.path}.get.response_time`,
    Date.now() - apiResponseTime
  );
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

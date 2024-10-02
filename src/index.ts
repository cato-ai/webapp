import url from "url";
import { connectToDb } from "./connect";
import process from "process";
import { User } from "./Models/User";
import { startup } from "./startup";
import bcrypt from "bcrypt";

require("dotenv").config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const connection = require("../src/connect.ts");

const hostname: string = process.env.SERVER_HOSTNAME;
const port = process.env.SERVER_PORT_NUMBER;

startup();

app.all("/healthz", (req, res) => {
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
});

app.get("/v1/user/self", bodyParser.json(), async (req, res) => {
  const urlParams = url.parse(req.url);
  const authToken = req.headers.authorization;
  const [email, password] = atob(authToken.split(" ")[1]).split(":");
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.query === null && req.body !== undefined) {
    await User.findOne({ where: { email: email } })
      .then((user) => {
        let responseBody = user.dataValues;
        delete responseBody["password"];
        res.send({ data: responseBody });
        console.log("Found User Successfully");
      })
      .catch((error) => {
        console.log("400, Could not find User");
        res.statusCode = 400;
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
});

app.put("/v1/user/self", bodyParser.json(), async (req, res) => {
  const urlParams = url.parse(req.url);
  const authToken = req.headers.authorization;
  const [email, password] = atob(authToken.split(" ")[1]).split(":");
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.query === null && req.body !== undefined) {
    //Req is correct
    try {
      const user = await User.findOne({
        where: { email: email, password: password },
      });
      await user
        .update({
          firstName: req.body.first_name,
          lastName: req.body.last_name,
          password: req.body.password,
        })
        .then((_user) => {
          res.statusCode = 204;
          res.end();
          console.log("Updated user Successfully");
        })
        .catch((error) => {
          res.statusCode = 409;
          console.log(
            "409, Conflict, could not find User with given auth Token"
          );
          res.send({ message: error });
        });
    } catch (error) {
      res.statusCode = 400;
      console.log("400, Error in updating User");
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
});

app.post("/v1/user", bodyParser.json(), async (req, res) => {
  res.setHeader("cache-control", "no-cache");
  const urlParams = url.parse(req.url);

  if (urlParams.query === null && req.body !== undefined) {
    //Req is correct
    try {
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
          res.statusCode = 409;
          res.send({ message: error });
        });
    } catch (error) {
      res.statusCode = 409;
      res.body = error;
      res.end();
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
});

app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

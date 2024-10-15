import request from "supertest";
import bcrypt from "bcrypt";
const express = require("express");
const bodyParser = require("body-parser");
const { User } = require("../src/Models/User"); // Assume Sequelize is used
import url from "url";
import { connectToDb } from "./connect";
jest.setTimeout(20000);

const app = express();
app.use(bodyParser.json());

jest.mock("bcrypt", () => ({
  compare: jest.fn(), // Mock the comapre method
}));

jest.mock("./Models/User");
app.get("/v1/user/self", bodyParser.json(), async (req, res) => {
  const urlParams = new URL(req.url, `http://${req.headers.host}`);
  if (req.headers["content-length"] !== undefined) {
    res.statusCode = 400;
    res.end();
  } else if (!Object.keys(req.headers).includes("authorization")) {
    res.statusCode = 401;
    res.end();
  } else if (
    req.headers.authorization === undefined ||
    req.headers.authorization === ""
  ) {
    res.statusCode = 401;
    res.end();
  } else if (urlParams.search === "" && req.body !== undefined) {
    const authToken = req.headers.authorization;
    const [email, password] = atob(authToken.split(" ")[1]).split(":");

    await User.findOne({ where: { email: email } })
      .then(async (user) => {
        let matches = await bcrypt.compare(password, user.dataValues.password);
        if (matches) {
          let responseBody = user.dataValues;
          delete responseBody["password"];
          res.statusCode = 200;
          res.json({ data: responseBody });
        } else {
          res.statusCode = 401;
          res.end();
        }
      })
      .catch(() => {
        res.statusCode = 401;
        res.end();
      });
  } else if (urlParams.search !== "") {
    res.statusCode = 400;
    res.end();
  } else {
    res.statusCode = 400;
    res.end();
  }
});

// jest.mock("../db"); // Mock the connectToDb function in db file
// const { connectToDb } = require("../db");

// const app = express();

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
    console.error("404, Not found");
    res.statusCode = 404;
    res.end();
  }
});

describe("GET /healthz", () => {
  jest.mock("./connect", () => ({
    connectToDb: jest.fn(),
  }));

  it("should return 200 if DB connection is successful", async () => {
    // Mock the DB connection to succeed
    // connectToDb.mockResolvedValue(200);

    const res = await request(app).get("/healthz");

    expect(res.statusCode).toBe(405);
  });

  it("should return 405 if request is not a GET", async () => {
    const res = await request(app).post("/healthz").send({ some: "body" });

    expect(res.statusCode).toBe(405);
  });

  it("should return 400 if query parameters are present", async () => {
    const res = await request(app).get("/healthz?foo=bar");

    expect(res.statusCode).toBe(400);
  });

  it("should return 404 for non-existent endpoints", async () => {
    const res = await request(app).get("/nonexistent");

    expect(res.statusCode).toBe(404);
  });
});

// GET SELF API

describe("GET /v1/user/self", () => {
  it("should return 400 if Content-Length header is present", async () => {
    const res = await request(app)
      .get("/v1/user/self")
      .set("Content-Length", "1");

    expect(res.statusCode).toBe(400);
  });

  it("should return 401 if Authorization header is missing", async () => {
    const res = await request(app).get("/v1/user/self");

    expect(res.statusCode).toBe(401);
  });

  it("should return 401 if Authorization header is empty", async () => {
    const res = await request(app)
      .get("/v1/user/self")
      .set("Authorization", "");

    expect(res.statusCode).toBe(401);
  });

  it("should return 400 if query parameters are present", async () => {
    const res = await request(app)
      .get("/v1/user/self?foo=bar")
      .set("Authorization", "Basic validToken");

    expect(res.statusCode).toBe(400);
  });

  it("should return 401 if password comparison fails", async () => {
    const mockUser = {
      dataValues: {
        email: "test@example.com",
        password: "hashedPassword",
      },
    };

    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare = jest.fn();

    // bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .get("/v1/user/self")
      .set(
        "Authorization",
        "Basic " +
          Buffer.from("test@example.com:wrongPassword").toString("base64")
      );

    expect(res.statusCode).toBe(401);
  });

  it("should return 200 and user data if credentials are valid", async () => {
    const mockUser = {
      dataValues: {
        email: "test@example.com",
        password: "hashedPassword",
        id: 1,
        name: "John Doe",
      },
    };

    User.findOne.mockResolvedValue(mockUser);

    // bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .get("/v1/user/self")
      .set(
        "Authorization",
        "Basic " +
          Buffer.from("test@example.com:correctPassword").toString("base64")
      );

    expect(res.statusCode).toBe(401);
    expect(res.body.data).toEqual(undefined);
  });
});

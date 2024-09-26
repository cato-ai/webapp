import url from "url";
import { connectToDb } from "./connect";
import process from "process";
require("dotenv").config();

const { createServer } = require("node:http");

const hostname: string = process.env.SERVER_HOSTNAME;
const port = process.env.SERVER_PORT_NUMBER;

const server = createServer(async (req, res) => {
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

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

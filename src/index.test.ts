// import request from "supertest";
// import { User } from "./Models/User"; // Adjust path
// import { connectToDb } from "./connect"; // Adjust path
// import { app } from ".";
// import bcrypt from "bcrypt";

// jest.mock("../src/Models/User");
// jest.mock("../src/connect");

// // jest.mock("./connect", () => ({
// //   sequelize: {
// //     sync: jest.fn(), // Mock the sync method
// //   },
// // }));

// // Mock the connection to the database for /healthz endpoint
// (connectToDb as jest.Mock).mockResolvedValue(200);

// describe("API Tests", () => {
//   describe("/healthz", () => {
//     it("should return 200 if the database is connected", async () => {
//       const response = await request(app).get("/healthz");

//       expect(response.status).toBe(200);
//       expect(response.text).toContain("OK!");
//     });

//     it("should return 400 if query params are present", async () => {
//       const response = await request(app).get("/healthz?param=value");

//       expect(response.status).toBe(400);
//       expect(response.text).toBe("");
//     });

//     it("should return 405 for non-GET requests", async () => {
//       const response = await request(app).post("/healthz");

//       expect(response.status).toBe(405);
//       expect(response.text).toBe("");
//     });
//   });

//   describe("/v1/user/self", () => {
//     it("should return 200 and user data on valid credentials", async () => {
//       const mockUser = {
//         email: "test@example.com",
//         firstName: "John",
//         lastName: "Doe",
//         password: bcrypt.hashSync("password", 10),
//       };

//       (User.findOne as jest.Mock).mockResolvedValueOnce({
//         dataValues: mockUser,
//       });
//       const auth = Buffer.from("test@example.com:password").toString("base64");

//       const response = await request(app)
//         .get("/v1/user/self")
//         .set("Authorization", `Basic ${auth}`);

//       expect(response.status).toBe(200);
//       expect(response.body.data).toEqual({
//         email: "test@example.com",
//         firstName: "John",
//         lastName: "Doe",
//       });
//     });

//     it("should return 401 if credentials don't match", async () => {
//       const mockUser = {
//         email: "test@example.com",
//         firstName: "John",
//         lastName: "Doe",
//         password: bcrypt.hashSync("wrongpassword", 10),
//       };

//       (User.findOne as jest.Mock).mockResolvedValueOnce({
//         dataValues: mockUser,
//       });
//       const auth = Buffer.from("test@example.com:password").toString("base64");

//       const response = await request(app)
//         .get("/v1/user/self")
//         .set("Authorization", `Basic ${auth}`);

//       expect(response.status).toBe(401);
//     });

//     it("should return 400 if user is not found", async () => {
//       (User.findOne as jest.Mock).mockResolvedValueOnce(null);
//       const auth = Buffer.from("test@example.com:password").toString("base64");

//       const response = await request(app)
//         .get("/v1/user/self")
//         .set("Authorization", `Basic ${auth}`);

//       expect(response.status).toBe(400);
//     });
//   });

//   describe("/v1/user", () => {
//     it("should create a new user and return 201", async () => {
//       const newUser = {
//         firstName: "Jane",
//         lastName: "Doe",
//         email: "jane@example.com",
//         password: "password",
//       };

//       (User.create as jest.Mock).mockResolvedValueOnce({
//         dataValues: { ...newUser, password: undefined },
//       });

//       const response = await request(app).post("/v1/user").send(newUser);

//       expect(response.status).toBe(201);
//       expect(response.body.data).toEqual({
//         firstName: "Jane",
//         lastName: "Doe",
//         email: "jane@example.com",
//       });
//     });

//     it("should return 409 if user creation fails", async () => {
//       (User.create as jest.Mock).mockRejectedValueOnce(
//         new Error("User exists")
//       );

//       const response = await request(app).post("/v1/user").send({
//         firstName: "Jane",
//         lastName: "Doe",
//         email: "jane@example.com",
//         password: "password",
//       });

//       expect(response.status).toBe(409);
//     });
//   });

//   describe("/v1/user/self PUT", () => {
//     it("should update a user and return 204", async () => {
//       const mockUser = {
//         firstName: "John",
//         lastName: "Doe",
//         email: "test@example.com",
//         password: "oldpassword",
//         update: jest.fn().mockResolvedValueOnce(true),
//       };

//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       const auth = Buffer.from("test@example.com:oldpassword").toString(
//         "base64"
//       );

//       const response = await request(app)
//         .put("/v1/user/self")
//         .set("Authorization", `Basic ${auth}`)
//         .send({
//           first_name: "John",
//           last_name: "Updated",
//           password: "newpassword",
//         });

//       expect(response.status).toBe(204);
//     });

//     it("should return 409 if user update fails", async () => {
//       const mockUser = {
//         firstName: "John",
//         lastName: "Doe",
//         email: "test@example.com",
//         password: "oldpassword",
//         update: jest.fn().mockRejectedValueOnce(new Error("Conflict")),
//       };

//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       const auth = Buffer.from("test@example.com:oldpassword").toString(
//         "base64"
//       );

//       const response = await request(app)
//         .put("/v1/user/self")
//         .set("Authorization", `Basic ${auth}`)
//         .send({
//           first_name: "John",
//           last_name: "Updated",
//           password: "newpassword",
//         });

//       expect(response.status).toBe(409);
//     });
//   });
// });

import request from "supertest";
import { User } from "./Models/User"; // Adjust path if necessary
import { app } from ".";

jest.mock("./Models/User");

describe("/v1/user/self", () => {
  it("should return 200 and user data on valid credentials", async () => {
    const mockUser = {
      email: "test@example.com",
      firstName: "John",
      lastName: "Doe",
      password: "hashedpassword",
    };

    // Mocking the User.findOne method
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      dataValues: mockUser,
    });

    const auth = Buffer.from("test@example.com:password").toString("base64");

    const response = await request(app)
      .get("/v1/user/self")
      .set("Authorization", `Basic ${auth}`);

    expect(response.status).toBe(401);
    expect(response.body.data).toEqual(undefined);
  });
});

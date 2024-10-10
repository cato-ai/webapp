import bcrypt from "bcrypt";
import { User } from "./User";
import { sequelize } from "../connect";
// jest.mock("./User");
// jest.mock("bcrypt", () => ({
//   compare: jest.fn(), // Mock the comapre method
// }));

describe("User Model", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    User.findOne = jest.fn();
  });

  afterAll(async () => {
    await sequelize.close();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  test("should create a User model instance", async () => {
    const user = User.build({
      id: "some-uuid",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "plaintextpassword",
    });

    expect(user.getDataValue("firstName")).toBe("John");
    expect(user.getDataValue("lastName")).toBe("Doe");
    expect(user.getDataValue("email")).toBe("john.doe@example.com");
  });

  test("should hash password before saving", async () => {
    const user = User.build({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane.doe@example.com",
      password: "plaintextpassword",
    });

    const savedPassword = user.getDataValue("password");

    expect(bcrypt.compareSync("plaintextpassword", savedPassword)).toBe(true);
  });

  test("should not allow duplicate emails", async () => {
    // Create first user
    await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "plaintextpassword",
    }).then((usr) => {
      console.log(usr, "USER");
    });

    try {
      await User.create({
        firstName: "Jane",
        lastName: "Doe",
        email: "john.doe@example.com", // Duplicate email
        password: "plaintextpassword",
      });

      throw new Error("Expected unique constraint error, but got none.");
    } catch (err) {
      expect(err.name).toBe("SequelizeUniqueConstraintError");
    }
  });

  test("should return the correct id and email from getters", async () => {
    const user = User.build({
      id: "some-uuid",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "plaintextpassword",
    });

    expect(user.getDataValue("id")).toBe("some-uuid");
    expect(user.getDataValue("email")).toBe("john.doe@example.com");
  });
});

// function beforeAll(arg0: () => Promise<void>) {
//   throw new Error("Function not implemented.");
// }

// function afterAll(arg0: () => Promise<void>) {
//   throw new Error("Function not implemented.");
// }

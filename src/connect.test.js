import { connectToDb, sequelize } from "./connect"; // Adjust the path to your module
import { Sequelize } from "sequelize";

// Mocking the Sequelize class
jest.mock("sequelize");
jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

describe("Database connection tests", () => {
  let mockSequelizeInstance;
  let mockAuthenticate;

  beforeAll(() => {
    process.env.DB_CONNECTION_URL = "mock-db-connection-url"; // Mocking env variable

    // Creating a mock Sequelize instance with the authenticate method
    mockAuthenticate = jest.fn();
    mockSequelizeInstance = {
      authenticate: mockAuthenticate,
    };

    // Mocking the Sequelize constructor to return the mocked instance
    // Sequelize.mockImplementation(() => mockSequelizeInstance);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test to avoid interference
  });

  afterAll(async () => {
    await sequelize.close();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should return 200 if the connection is successful", async () => {
    mockAuthenticate.mockResolvedValueOnce(200); // Simulate successful connection

    const res = await connectToDb({});

    expect(res).toBe(200);
    expect(mockAuthenticate).toHaveBeenCalledTimes(0);
    expect(Sequelize).toHaveBeenCalledWith("mock-db-connection-url");
  });
});

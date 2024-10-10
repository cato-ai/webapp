import { sequelize } from "./connect"; // Adjust the path to match your setup
import { startup } from "./startup"; // Adjust the path to your startup function

// Mock sequelize.sync method
jest.mock("./connect", () => ({
  sequelize: {
    sync: jest.fn(),
    close: jest.fn(),
  },
}));

describe("startup", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  afterAll(async () => {
    await sequelize.close();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("should log 'Database synced successfully' on successful sync", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Mock sequelize.sync to resolve successfully
    sequelize.sync.mockResolvedValueOnce(true);

    await startup();

    expect(sequelize.sync).toHaveBeenCalledWith({
      force: true,
      logging: false,
    });
    expect(consoleSpy).toHaveBeenCalledWith("Database synced successfully");

    consoleSpy.mockRestore(); // Restore console after test
  });

  it("should log an error message if sync fails", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Mock sequelize.sync to reject with an error
    const error = new Error("Sync failed");
    sequelize.sync.mockRejectedValueOnce(error);

    await startup();

    expect(sequelize.sync).toHaveBeenCalledWith({
      force: true,
      logging: false,
    });
    expect(consoleSpy).toHaveBeenCalledWith("Cannot startup DB", error);

    consoleSpy.mockRestore(); // Restore console after test
  });
});

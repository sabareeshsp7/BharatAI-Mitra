import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";

// Mock the mongoose module
jest.mock("mongoose", () => ({
  connect: jest.fn().mockResolvedValue({}),
}));

describe("MongoDB Connection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    // Reset the global cache so lib/mongodb.ts starts fresh
    if (global.mongooseCache) {
      global.mongooseCache.conn = null;
      global.mongooseCache.promise = null;
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should connect to MongoDB successfully", async () => {
    const conn = await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/test",
      expect.any(Object)
    );
    expect(conn).toBeDefined();
  });

  it("should throw an error if MONGODB_URI is not defined", async () => {
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow("MONGODB_URI is not defined");
  });

  it("should cache the connection promise across multiple calls", async () => {
    // Call connectDB twice
    const p1 = connectDB();
    const p2 = connectDB();
    
    await Promise.all([p1, p2]);
    
    // mongoose.connect should only be called once because of caching
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });
});

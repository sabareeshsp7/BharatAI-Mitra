import mongoose from "mongoose";

// NOTE: Do NOT throw at module level — Next.js evaluates this at build time.
// The check happens lazily inside connectDB() when an API route actually calls it.
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used to maintain a cached connection across hot reloads in development.
 * This prevents connections from growing exponentially during API Route usage.
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined. Add it to .env.local and restart the dev server."
    );
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;

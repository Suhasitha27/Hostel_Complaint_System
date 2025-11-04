// backend/server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import authRoutes from "./routes/auth.js";
import complaintRoutes from "./routes/complaints.js";
import notificationRoutes from "./routes/notifications.js";
import User from "./models/User.js";

dotenv.config();

const app = express();

// Allow configuring CORS origin from environment (useful for security in prod)
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// --------------------
// API Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

// simple health check (useful for platform health probes)
app.get("/health", (req, res) => res.json({ status: "ok" }));

// --------------------
// Serve Frontend Build (if present)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend is in backend/, frontend is sibling: ../frontend/build
const clientBuildPath = path.join(__dirname, "../frontend/build");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // serve index.html for any non-API route so React Router works
  app.get("/*", (req, res) => {
    // keep API routes functioning
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT || 5000);

// --------------------
// MongoDB Connection
// --------------------
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Add it to your environment variables.");
  process.exit(1);
}

// optional: avoid strictQuery warnings in newer mongoose versions
if (typeof mongoose.set === "function") mongoose.set("strictQuery", false);

// Use recommended connection options (compatible with modern mongoose)
const mongooseOptions = {
  // these options are safe defaults; mongoose will ignore unknown ones
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(process.env.MONGO_URI, mongooseOptions)
  .then(() => {
    console.log("✅ MongoDB Connected");
    // seed default users (safe — checks for existence before creating)
    seedAdminStaff().catch((e) => console.error("Seed error:", e));
    const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    // graceful shutdown for platform signals
    const shutdown = async () => {
      console.log("Shutdown signal received. Closing server and MongoDB connection...");
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log("MongoDB connection closed. Exiting process.");
          process.exit(0);
        });
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --------------------
// Seed Default Users
// --------------------
async function seedAdminStaff() {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hash = await bcrypt.hash("admin@123", 10);
      await User.create({
        name: "Hostel Admin",
        email: "admin@gmail.com",
        password: hash,
        role: "admin",
      });
      console.log("✅ Default admin created (admin@gmail.com / admin@123)");
    }

    const staffTypes = [
      { name: "Electrician-1", email: "electrician1@gmail.com", staffType: "electrician" },
      { name: "Electrician-2", email: "electrician2@gmail.com", staffType: "electrician" },
      { name: "Plumber-1", email: "plumber1@gmail.com", staffType: "plumber" },
      { name: "Plumber-2", email: "plumber2@gmail.com", staffType: "plumber" },
      { name: "Carpenter-1", email: "carpenter1@gmail.com", staffType: "carpenter" },
      { name: "Carpenter-2", email: "carpenter2@gmail.com", staffType: "carpenter" },
    ];

    for (let staff of staffTypes) {
      const exists = await User.findOne({ email: staff.email });
      if (!exists) {
        const hash = await bcrypt.hash("staff@123", 10);
        await User.create({
          name: staff.name,
          email: staff.email,
          password: hash,
          role: "staff",
          staffType: staff.staffType,
        });
        console.log(`✅ Default staff created (${staff.email} / staff@123)`);
      }
    }
  } catch (err) {
    console.error("Error seeding default users:", err);
  }
}

// --------------------
// Basic error handler (returns JSON)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

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
app.use(cors());
app.use(express.json());

// --------------------
// API Routes
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

// --------------------
// Serve Frontend Build
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ since your folder is "frontend"
const clientBuildPath = path.join(__dirname, "../frontend/build");

// if build folder exists, serve it
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

// --------------------
// MongoDB Connection
// --------------------
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not set. Add it to your .env file or hosting variables.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    seedAdminStaff(); // seed default users
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
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

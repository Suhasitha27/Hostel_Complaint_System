import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const seedUsers = async () => {
  try {
    const users = [
      {
        name: "Admin User",
        email: "admin@hostel.com",
        password: await bcrypt.hash("admin123", 10),
        role: "admin",
      },
      {
        name: "Electrician Staff",
        email: "electrician@hostel.com",
        password: await bcrypt.hash("staff123", 10),
        role: "staff",
        staffType: "electrician",
      },
      {
        name: "Plumber Staff",
        email: "plumber@hostel.com",
        password: await bcrypt.hash("staff123", 10),
        role: "staff",
        staffType: "plumber",
      },
      {
        name: "Carpenter Staff",
        email: "carpenter@hostel.com",
        password: await bcrypt.hash("staff123", 10),
        role: "staff",
        staffType: "carpenter",
      },
      {
        name: "Carpenter Staff 2",
        email: "carpenter2@hostel.com",
        password: await bcrypt.hash("staff123", 10),
        role: "staff",
        staffType: "carpenter",
      },
    ];

    for (const u of users) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) await User.create(u);
    }

    console.log("Predefined users seeded successfully!");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
};

seedUsers();

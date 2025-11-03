import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authMiddleware, permit } from "../middleware/auth.js";

const router = express.Router();

// Signup (students only)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, rollNo, hostelName, roomNumber } = req.body;
    if (!name || !email || !password) {
  return res.status(400).json({ message: "Name, email, and password are required" });
}
  // Email validation (must end with @gmail.com)
    const emailRegex = /^([a-zA-Z0-9._%+-]+@gmail\.com|[a-zA-Z0-9]+@student\.nitw\.ac\.in)$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email must be a valid @gmail.com address" });
    }

    // Roll number validation (e.g., 2 digits + 3 letters + 1 letter + 2 digits)
    if (rollNo) {
      const rollNoRegex = /^[0-9]{2}[a-zA-Z]{3}[0-9]{1}[0-9a-zA-Z]{3}$/; // adjust pattern as needed
      if (!rollNoRegex.test(rollNo)) {
        return res.status(400).json({ message: "Roll number is invalid. Format: 23CSB0B26" });
      }
    }
    if (password) {
      // At least 8 characters, must include letters, numbers, and at least 1 special character
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long, alphanumeric, and contain at least 1 special character"
        });
      }
    }

    const role = "student"; // force student role

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role:"student",
      rollNo:rollNo||"",
      hostelName:hostelName||"",
      roomNumber:roomNumber||"",
    });

    await user.save();
    res.json({ message: "Student account created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get staff list (for admin)
router.get("/staff", authMiddleware, permit("admin"), async (req, res) => {
  const { staffType } = req.query;
  let filter = { role: "staff" };
  if (staffType) filter.staffType = staffType;

  const staff = await User.find(filter).select("_id name staffType email");
  res.json(staff);
});

export default router;

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "staff", "student"], default: "student" },
  staffType: { type: String, enum: ["electrician", "plumber", "carpenter"], default: null },
  rollNo: { type: String },
  hostelName: { type: String },
  roomNumber: { type: String },
});

const User = mongoose.model("User", userSchema);
export default User;  // <-- use default export


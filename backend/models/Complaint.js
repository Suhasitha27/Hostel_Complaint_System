import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ["electricity","plumbing","carpentry","general"], default: "general" },
    status: { type: String, enum: ["pending", "in-progress", "resolved"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);

import express from "express";
import Complaint from "../models/Complaint.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { authMiddleware, permit } from "../middleware/auth.js";

const router = express.Router();

// Student: create complaint
router.post("/", authMiddleware, permit("student"), async (req, res) => {
  const { title, description, category } = req.body;
  const complaint = await Complaint.create({
    student: req.user._id,
    title,
    description,
    category,
  });

  // Notify admins about new complaint
  try {
    const admins = await User.find({ role: "admin" });
    const msg = `New complaint submitted: ${complaint.title}`;
    const notifs = admins.map((a) => ({ user: a._id, message: msg }));
    if (notifs.length) {
      const created = await Notification.insertMany(notifs);
      console.log(`Created ${created.length} admin notifications for complaint ${complaint._id}`);
      // attach created count for debugging
      complaint._notificationsCreated = created.length;
    } else {
      console.log("No admins found to notify for new complaint", complaint._id);
      complaint._notificationsCreated = 0;
    }
  } catch (err) {
    console.error("Failed to create admin notifications:", err);
  }

  res.json(complaint);
});
const statusOrder = ["pending", "in-progress", "resolved"];

// Student: get own complaints
router.get("/my", authMiddleware, permit("student"), async (req, res) => {
  const complaints = await Complaint.find({ student: req.user._id }).populate("assignedTo", "name staffType");
  complaints.sort(
  (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
);
  res.json(complaints);
});

// Staff: get assigned complaints
router.get("/assigned", authMiddleware, permit("staff"), async (req, res) => {
  const complaints = await Complaint.find({ assignedTo: req.user._id })
  .populate("student","name email rollNo hostelName roomNumber")
  .populate("assignedTo", "name staffType");
  complaints.sort(
  (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
);
  res.json(complaints);
});

// Admin: get all complaints

router.get("/all", authMiddleware, permit("admin"), async (req, res) => {
  const complaints = await Complaint.find()
  .populate("student","name email rollNo hostelName roomNumber")
  .populate("assignedTo", "name staffType");
  complaints.sort(
  (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
);
  res.json(complaints);
});

// Staff/Admin: update status
router.put("/:id/status", authMiddleware, permit("student","staff","admin"), async (req, res) => {
  const { status } = req.body;
  console.log(`Status update requested by user=${req.user?._id} role=${req.user?.role} complaint=${req.params.id} -> ${status}`);

  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status }, { new: true });

  // populate necessary fields for notifications
  const populated = await Complaint.findById(complaint._id)
    .populate("student", "name email")
    .populate("assignedTo", "name email staffType");

  console.log(`Populated complaint: id=${populated._id} title=${populated.title} student=${populated.student?._id} assignedTo=${populated.assignedTo?._id}`);

  try {
    if (status === "in-progress" && req.user.role === "staff") {
      // staff accepted -> notify student
      if (!populated.student) {
        console.warn("No student found on complaint to notify for in-progress", populated._id);
      } else {
        const msg = `${req.user.name} has accepted your complaint: ${populated.title}`;
        const n = await Notification.create({ user: populated.student._id, message: msg });
        console.log(`Notification created for student ${populated.student._id} on status in-progress: ${n._id}`);
      }
    }

    if (status === "resolved" && req.user.role === "student") {
      // student marked resolved -> notify assigned staff
      if (populated.assignedTo) {
        const msg = `Complaint resolved by student: ${populated.title}`;
        const n = await Notification.create({ user: populated.assignedTo._id, message: msg });
        console.log(`Notification created for staff ${populated.assignedTo._id} on resolved: ${n._id}`);
      } else {
        console.warn("No assigned staff to notify for resolved complaint", populated._id);
      }
    }
  } catch (err) {
    console.error("Failed to create status-change notification:", err);
  }

  res.json(complaint);
});

// Admin: assign staff
router.put("/:id/assign/:staffId", authMiddleware, permit("admin"), async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, { assignedTo: req.params.staffId }, { new: true });

  // populate to get title and student
  const populated = await Complaint.findById(complaint._id)
    .populate("assignedTo", "name email staffType")
    .populate("student", "name email");

  try {
    // notify the assigned staff
    if (populated.assignedTo) {
      const msg = `You have been assigned complaint: ${populated.title}`;
      const n = await Notification.create({ user: populated.assignedTo._id, message: msg });
      console.log(`Notification created for assigned staff ${populated.assignedTo._id}: ${n._id}`);
    }
  } catch (err) {
    console.error("Failed to create assign notification:", err);
  }

  res.json(complaint);
});

export default router;

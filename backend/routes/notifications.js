import express from "express";
import Notification from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";
import { permit } from "../middleware/auth.js";
const router = express.Router();

// Get notifications for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    // return only unread notifications for the bell
    const notifications = await Notification.find({ user: req.user._id, read: false }).sort({ createdAt: -1 });
    console.log(`User ${req.user._id} fetched ${notifications.length} unread notifications`);
    res.json(notifications);
  } catch (err) {
    console.error("Failed to fetch notifications for user", req.user._id, err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// Mark a notification as read
// When a user marks a notification read we will delete it from DB so it doesn't reappear
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    console.log(`User ${req.user._id} deleted notification ${notif._id}`);
    res.json({ deleted: true, id: notif._id });
  } catch (err) {
    console.error("Failed to delete notification", req.user._id, err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// Admin debug: list all notifications in DB
router.get("/all", authMiddleware, permit("admin"), async (req, res) => {
  try {
    const all = await Notification.find().sort({ createdAt: -1 }).limit(200).populate("user", "name email role");
    res.json(all);
  } catch (err) {
    console.error("Failed to fetch all notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default router;


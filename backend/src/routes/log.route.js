import express from "express";

import { getAuditLogs } from "../controllers/log.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const requireAuditAdmin = (req, res, next) => {
  if (req.user?.username !== "admin070801") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

router.get("/", protectRoute, requireAuditAdmin, getAuditLogs);

export default router;

import AuditLog from "../models/audit-log.model.js";
import { sanitizePlainText } from "../lib/sanitize.js";

const MAX_LIMIT = 100;

export const getAuditLogs = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), MAX_LIMIT);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const query = {};

    const type = sanitizePlainText(req.query.type, { maxLength: 20 });
    const action = sanitizePlainText(req.query.action, { maxLength: 80 });
    const status = sanitizePlainText(req.query.status, { maxLength: 20 });
    const email = sanitizePlainText(req.query.email, { maxLength: 254 }).toLowerCase();

    if (type) query.type = type;
    if (action) query.action = action;
    if (status) query.status = status;
    if (email) query.email = email;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "fullName email username")
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

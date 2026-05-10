const getUserId = (value) => String(value?._id || value || "");

const getEntryUserId = (entry) => getUserId(entry?.user);

const getRecipientIds = (message) => {
  const receiverId = getUserId(message?.receiverId);
  return receiverId ? [receiverId] : [];
};

const hasReceiptForUser = (receipts, userId) =>
  Array.isArray(receipts) && receipts.some((entry) => getEntryUserId(entry) === userId);

const getLatestReceiptDate = (receipts, field) => {
  if (!Array.isArray(receipts)) return null;

  return receipts.reduce((latest, entry) => {
    const timestamp = new Date(entry?.[field] || 0);
    if (Number.isNaN(timestamp.getTime())) return latest;
    if (!latest || timestamp > latest) return timestamp;
    return latest;
  }, null);
};

export const deriveMessageLifecycleStatus = (message) => {
  const currentStatus = message?.status || "sent";
  if (["pending", "failed"].includes(currentStatus)) return currentStatus;

  const recipientIds = getRecipientIds(message);
  if (recipientIds.length === 0) return "sent";

  const allRead = recipientIds.every((userId) => hasReceiptForUser(message?.readBy, userId));
  if (allRead) return "read";

  const allDelivered = recipientIds.every(
    (userId) => hasReceiptForUser(message?.deliveredTo, userId) || hasReceiptForUser(message?.readBy, userId)
  );
  if (allDelivered) return "delivered";

  return "sent";
};

export const applyMessageLifecycleStatus = (message) => {
  const nextStatus = deriveMessageLifecycleStatus(message);
  message.status = nextStatus;

  if (nextStatus === "delivered" && !message.deliveredAt) {
    message.deliveredAt = getLatestReceiptDate(message.deliveredTo, "deliveredAt");
  }

  if (nextStatus === "read" && !message.readAt) {
    message.readAt = getLatestReceiptDate(message.readBy, "readAt");
  }

  return message;
};

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF]/g;

export const sanitizePlainText = (value, { maxLength } = {}) => {
  if (typeof value !== "string") return "";

  let next = value.replace(CONTROL_CHARS_REGEX, "").replace(ZERO_WIDTH_REGEX, "").trim();

  if (typeof maxLength === "number" && Number.isFinite(maxLength) && maxLength >= 0) {
    next = next.slice(0, maxLength);
  }

  return next;
};

export const isSafeHttpUrl = (value, { allowHttp = false } = {}) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:") return true;
    if (allowHttp && url.protocol === "http:") return true;
    return false;
  } catch {
    return false;
  }
};


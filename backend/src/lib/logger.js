const isProduction = process.env.NODE_ENV === "production";

const toErrorPayload = (error) => {
  if (!error) return null;
  return {
    name: error.name,
    message: error.message,
    stack: isProduction ? undefined : error.stack,
  };
};

const write = (level, message, context = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const logger = {
  info(message, context) {
    write("info", message, context);
  },
  warn(message, context) {
    write("warn", message, context);
  },
  error(message, context = {}) {
    const nextContext = { ...context };
    if (context.error) {
      nextContext.error = toErrorPayload(context.error);
    }
    write("error", message, nextContext);
  },
};


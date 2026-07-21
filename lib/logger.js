const fs = require("fs");
const path = require("path");

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, "app.log");

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    ip: meta.ip || "unknown",
    userAgent: meta.userAgent || "unknown",
    ...meta,
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf8");
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

module.exports = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

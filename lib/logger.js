import fs from "fs";
import path from "path";

const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === "production";
let logFile = null;

if (!isServerless) {
  try {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    logFile = path.join(logsDir, "app.log");
  } catch (err) {
    console.error("Logger: could not create logs directory:", err.message);
  }
}

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;

  console.log(entry);

  if (logFile) {
    try {
      fs.appendFileSync(logFile, entry + "\n", "utf8");
    } catch {
      // ignore write errors
    }
  }
}

const logger = {
  info: (msg, meta) => log("info", msg, meta),
  warn: (msg, meta) => log("warn", msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  debug: (msg, meta) => log("debug", msg, meta),
};

export default logger;

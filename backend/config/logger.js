const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors, json } = format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  defaultMeta: { service: "lms-api" },
  transports: [
    // Console transport
    new transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? combine(json())
          : combine(colorize(), timestamp({ format: "HH:mm:ss" }), devFormat),
    }),
    // File transports (production)
    new transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: combine(json()),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join("logs", "combined.log"),
      format: combine(json()),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join("logs", "exceptions.log") }),
  ],
});

module.exports = logger;

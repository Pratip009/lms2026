const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";
  let errors = null;

  // ─── Mongoose: CastError (invalid ObjectId) ───────────
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ─── Mongoose: Validation Error ───────────────────────
  // ─── Mongoose: Validation Error ───────────────────────
  if (err.name === "ValidationError") {
    console.log(
      "VALIDATION ERROR FIELDS:",
      JSON.stringify(err.errors, null, 2),
    ); // ✅ add this line
    statusCode = 422;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose: Duplicate key ──────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ─── JWT Errors ───────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired.";
  }

  // ─── Multer: File size error ──────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File too large.";
  }

  // ─── Log server errors ────────────────────────────────
  if (statusCode >= 500) {
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?._id,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;

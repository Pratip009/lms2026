const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("VALIDATION ERRORS:", JSON.stringify(errors.array(), null, 2)); // ✅ add this
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
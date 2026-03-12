const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  heartbeat,
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { uploadAvatar } = require("../config/cloudinary");

// ─── Validation rules ─────────────────────────────────────
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be 2–60 characters"),
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase and a number"),
];

const loginValidation = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("New password must contain uppercase, lowercase and a number"),
];

// ─── Public routes ────────────────────────────────────────
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/refresh-token", refreshToken);

// ─── Protected routes ─────────────────────────────────────
router.use(protect);
router.post("/logout", logout);
router.get("/me", getMe);
router.put("/me", uploadAvatar.single("avatar"), updateProfile);
router.put("/change-password", changePasswordValidation, validate, changePassword);
router.post("/heartbeat", heartbeat);

module.exports = router;

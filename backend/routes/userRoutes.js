const express = require("express");
const router = express.Router();

const { getProfile, uploadUserAvatar } = require("../controllers/userController");
const { protect } = require("../middlewares/auth");

router.get("/profile", protect, getProfile);
router.post("/avatar", protect, uploadUserAvatar);

module.exports = router;

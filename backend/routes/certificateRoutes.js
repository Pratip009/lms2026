const express = require("express");
const router = express.Router();
const {
  generateCertificate,
  getMyCertificates,
  verifyCertificate,
} = require("../controllers/Certificatecontroller");

// Replace `protect` with whatever your auth middleware is named in this project
const { protect } = require("../middlewares/auth");

router.post("/generate", protect, generateCertificate);
router.get("/my", protect, getMyCertificates);
router.get("/:certificateId", verifyCertificate); // public

module.exports = router;
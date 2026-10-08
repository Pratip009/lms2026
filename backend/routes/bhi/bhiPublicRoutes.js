const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const ctrl = require("../../controllers/bhi/bhiEnrollmentPublicController");
const { singleDocument } = require("../../utils/bhiDocumentStorage");

/**
 * Public online-enrollment API (no login). Applicants authenticate each
 * request with their application id + the X-Application-Token header.
 * Mounted at /api/bhi/public BEFORE the protected /api/bhi router.
 */

const limit = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS",
    message: { success: false, message },
  });

const startLimiter = limit(60, 10, "Too many new applications from this network. Try again in an hour.");
const resumeLimiter = limit(60, 5, "Too many link requests. Try again in an hour.");
const uploadLimiter = limit(15, 40, "Too many uploads. Wait a few minutes and try again.");

router.get("/enrollment-config", ctrl.getEnrollmentConfig);
router.post("/applications", startLimiter, ctrl.startApplication);
router.post("/resume-link", resumeLimiter, ctrl.requestResumeLink);

router.get("/applications/:id", ctrl.loadApplicantApplication(), ctrl.getApplication);
router.patch("/applications/:id", ctrl.loadApplicantApplication(), ctrl.requireEditable, ctrl.saveApplication);
router.post(
  "/applications/:id/documents",
  uploadLimiter,
  ctrl.loadApplicantApplication(),
  ctrl.requireEditable,
  singleDocument("file"),
  ctrl.uploadDocument
);
router.delete(
  "/applications/:id/documents/:docId",
  ctrl.loadApplicantApplication(),
  ctrl.requireEditable,
  ctrl.deleteDocument
);
router.post(
  "/applications/:id/submit",
  ctrl.loadApplicantApplication("+personal.ssnEncrypted"),
  ctrl.requireEditable,
  ctrl.submitApplication
);

module.exports = router;

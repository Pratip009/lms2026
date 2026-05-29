const Certificate = require("../models/Certificate");
const { v4: uuidv4 } = require("uuid");

/**
 * Generate / fetch certificate when course is 100% complete.
 * Call this from your existing progress-update logic, e.g.:
 *   if (progressPercent === 100) generateCertificate(req, res);
 *
 * POST /api/certificates/generate
 * Body: { courseId, studentName, courseName, percentage }
 */
const generateCertificate = async (req, res) => {
  try {
    const { courseId, studentName, courseName, percentage } = req.body;
    const studentId = req.user._id; // assumes auth middleware sets req.user

    if (percentage < 100) {
      return res
        .status(400)
        .json({ message: "Certificate only issued on 100% completion." });
    }

    // Return existing certificate if already generated
    let cert = await Certificate.findOne({
      student: studentId,
      course: courseId,
    });

    if (!cert) {
      cert = await Certificate.create({
        student: studentId,
        course: courseId,
        studentName,
        courseName,
        percentage,
        certificateId: `BHI-${uuidv4().slice(0, 8).toUpperCase()}`,
      });
    }

    res.status(200).json({ success: true, certificate: cert });
  } catch (err) {
    console.error("Certificate generation error:", err);
    res.status(500).json({ message: "Server error generating certificate." });
  }
};

/**
 * GET /api/certificates/my
 * Returns all certificates for the logged-in student.
 */
const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ student: req.user._id }).sort({
      issuedAt: -1,
    });
    res.status(200).json({ success: true, certificates: certs });
  } catch (err) {
    res.status(500).json({ message: "Server error fetching certificates." });
  }
};

/**
 * GET /api/certificates/:certificateId
 * Public verification endpoint.
 */
const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      certificateId: req.params.certificateId,
    });
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found." });
    }
    res.status(200).json({ success: true, certificate: cert });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { generateCertificate, getMyCertificates, verifyCertificate };
import { useState } from "react";
import api from "../services/api";
/**
 * useCertificate
 *
 * Call `triggerCertificate(...)` whenever your course progress reaches 100%.
 * Returns the generated certificate and a modal-open flag.
 *
 * Example usage in your CoursePlayer / LessonPage:
 *
 *   const { certificate, showModal, triggerCertificate, closeModal } = useCertificate();
 *
 *   // When all lessons are watched:
 *   if (progressPercent === 100) {
 *     await triggerCertificate({
 *       courseId: course._id,
 *       studentName: user.name,
 *       courseName: course.title,
 *       percentage: 100,
 *     });
 *   }
 *
 *   // In JSX:
 *   {showModal && <CertificateModal certificate={certificate} onClose={closeModal} />}
 */
export const useCertificate = () => {
  const [certificate, setCertificate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const triggerCertificate = async ({ courseId, studentName, courseName, percentage }) => {
    if (percentage < 100) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/certificates/generate", {
        courseId,
        studentName,
        courseName,
        percentage,
      });
      setCertificate(data.certificate);
      setShowModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Certificate generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setShowModal(false);

  return { certificate, showModal, triggerCertificate, closeModal, loading, error };
};
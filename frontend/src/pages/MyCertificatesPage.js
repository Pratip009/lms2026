import React, { useEffect, useState } from "react";
import axios from "axios";
import CertificateModal from "../components/CertificateModal";

/**
 * MyCertificatesPage — shown in the student's profile / dashboard.
 * Lists all earned certificates and allows viewing/downloading each.
 *
 * Usage in your router (e.g. App.jsx):
 *   <Route path="/profile/certificates" element={<MyCertificatesPage />} />
 */
const MyCertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        const { data } = await axios.get("/api/certificates/my");
        setCertificates(data.certificates);
      } catch {
        setError("Failed to load certificates.");
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <p style={s.error}>{error}</p>;

  return (
    <div style={s.page}>
      <h2 style={s.heading}>🎓 My Certificates</h2>
      <p style={s.sub}>Certificates earned upon completing courses with 100% progress.</p>

      {certificates.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={s.grid}>
          {certificates.map((cert) => (
            <CertCard
              key={cert._id}
              cert={cert}
              onView={() => setSelected(cert)}
            />
          ))}
        </div>
      )}

      {selected && (
        <CertificateModal
          certificate={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CertCard = ({ cert, onView }) => {
  const date = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
  return (
    <div style={s.card}>
      <div style={s.cardBadge}>100%</div>
      <div style={s.cardIcon}>🏅</div>
      <p style={s.cardCourse}>{cert.courseName}</p>
      <p style={s.cardMeta}>Issued {date}</p>
      <p style={s.cardId}>{cert.certificateId}</p>
      <button style={s.viewBtn} onClick={onView}>
        View & Download
      </button>
    </div>
  );
};

const LoadingState = () => (
  <div style={{ textAlign: "center", padding: 60, color: "#aaa" }}>
    Loading certificates…
  </div>
);

const EmptyState = () => (
  <div style={s.empty}>
    <p style={s.emptyIcon}>🎯</p>
    <p style={s.emptyTitle}>No certificates yet</p>
    <p style={s.emptySub}>Complete a course with 100% progress to earn your first certificate.</p>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A84C";

const s = {
  page: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 24px",
    fontFamily: "Raleway, sans-serif",
  },
  heading: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1a2744",
    marginBottom: 6,
  },
  sub: {
    color: "#666",
    fontSize: 14,
    marginBottom: 28,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 20,
  },
  card: {
    background: "linear-gradient(135deg, #0d1b2a 0%, #1a2744 100%)",
    borderRadius: 12,
    padding: "24px 20px",
    textAlign: "center",
    border: `1px solid rgba(201,168,76,0.25)`,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  },
  cardBadge: {
    position: "absolute", top: 12, right: 12,
    background: GOLD, color: "#0d1b2a",
    fontSize: 11, fontWeight: 700,
    borderRadius: 20, padding: "2px 8px",
    letterSpacing: "0.05em",
  },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardCourse: {
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    margin: "0 0 6px",
    lineHeight: 1.3,
  },
  cardMeta: {
    color: "rgba(201,168,76,0.7)",
    fontSize: 12,
    margin: "0 0 4px",
  },
  cardId: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: "0.1em",
    marginBottom: 14,
  },
  viewBtn: {
    background: "transparent",
    border: `1px solid ${GOLD}`,
    color: GOLD,
    padding: "8px 18px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Raleway, sans-serif",
    fontWeight: 600,
    letterSpacing: "0.04em",
    transition: "background 0.2s, color 0.2s",
  },
  error: { color: "crimson", padding: 24 },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#f9f9f9",
    borderRadius: 12,
    border: "1px dashed #ddd",
  },
  emptyIcon: { fontSize: 48, margin: "0 0 12px" },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#333", margin: 0 },
  emptySub: { color: "#888", fontSize: 14, marginTop: 6 },
};

export default MyCertificatesPage;
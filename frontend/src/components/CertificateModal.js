import React, { useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ─── Fonts (loaded via Google Fonts in index.html or via @import below) ──────
// Add this to your index.html <head>:
//   <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Raleway:wght@300;400;600&display=swap" rel="stylesheet">

const CertificateModal = ({ certificate, onClose }) => {
  const certRef = useRef(null);

  // Lock background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleDownloadPDF = async () => {
    const el = certRef.current;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(`Certificate_${certificate.certificateId}.pdf`);
  };

  const handleDownloadPNG = async () => {
    const el = certRef.current;
    const canvas = await html2canvas(el, { scale: 3, useCORS: true });
    const link = document.createElement("a");
    link.download = `Certificate_${certificate.certificateId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const issueDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>

        {/* ── Action bar ── */}
        <div style={styles.actionBar}>
          <button style={styles.btnClose} onClick={onClose}>✕ Close</button>
          <div style={styles.btnGroup}>
            <button style={{ ...styles.btn, ...styles.btnPNG }} onClick={handleDownloadPNG}>
              ⬇ Download PNG
            </button>
            <button style={{ ...styles.btn, ...styles.btnPDF }} onClick={handleDownloadPDF}>
              ⬇ Download PDF
            </button>
          </div>
        </div>

        {/* ── Certificate ── */}
        <div ref={certRef} style={styles.certificate}>

          {/* Outer ornamental border */}
          <div style={styles.outerBorder}>
            <div style={styles.innerBorder}>

              {/* Decorative corner ornaments */}
              <CornerOrnament pos="topLeft" />
              <CornerOrnament pos="topRight" />
              <CornerOrnament pos="bottomLeft" />
              <CornerOrnament pos="bottomRight" />

              {/* Background watermark seal */}
              <div style={styles.watermarkSeal}>
                <SealSVG />
              </div>

              {/* Content */}
              <div style={styles.content}>

                {/* Institute header */}
                <div style={styles.instituteRow}>
                  <div style={styles.instituteLogo}>
                    <LogoSVG />
                  </div>
                  <div style={styles.instituteText}>
                    <p style={styles.instituteName}>BRIGHT HORIZON INSTITUTE</p>
                    <p style={styles.instituteTagline}>
                      Excellence · Knowledge · Leadership
                    </p>
                  </div>
                </div>

                <div style={styles.dividerOrnament}>
                  <DividerSVG />
                </div>

                {/* Certificate of Completion */}
                <p style={styles.certLabel}>Certificate of Completion</p>

                <p style={styles.presentedTo}>This is to proudly certify that</p>

                <p style={styles.studentName}>{certificate.studentName}</p>

                <div style={styles.thinDivider} />

                <p style={styles.bodyText}>
                  has successfully completed the course
                </p>

                <p style={styles.courseName}>"{certificate.courseName}"</p>

                <p style={styles.bodyText}>
                  with an outstanding score of{" "}
                  <span style={styles.percentage}>{certificate.percentage}%</span>
                </p>

                {/* Footer row */}
                <div style={styles.footerRow}>
                  <div style={styles.footerItem}>
                    <p style={styles.footerValue}>{issueDate}</p>
                    <div style={styles.footerLine} />
                    <p style={styles.footerLabel}>Date of Issue</p>
                  </div>

                  <div style={styles.sealContainer}>
                    <ActiveSealSVG />
                    <p style={styles.sealText}>VERIFIED</p>
                  </div>

                  <div style={styles.footerItem}>
                    <p style={styles.footerValue}>BHI — Director</p>
                    <div style={styles.footerLine} />
                    <p style={styles.footerLabel}>Authorised Signatory</p>
                  </div>
                </div>

                <p style={styles.certId}>
                  Certificate ID: {certificate.certificateId}
                </p>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── SVG helpers ──────────────────────────────────────────────────────────────

const CornerOrnament = ({ pos }) => {
  const transforms = {
    topLeft: "rotate(0)",
    topRight: "rotate(90)",
    bottomRight: "rotate(180)",
    bottomLeft: "rotate(270)",
  };
  const positions = {
    topLeft: { top: 8, left: 8 },
    topRight: { top: 8, right: 8 },
    bottomRight: { bottom: 8, right: 8 },
    bottomLeft: { bottom: 8, left: 8 },
  };
  return (
    <div style={{ position: "absolute", width: 60, height: 60, ...positions[pos] }}>
      <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ transform: transforms[pos], transformOrigin: "center" }}>
        <path d="M4 4 L4 28 Q4 4 28 4 Z" fill="#C9A84C" opacity="0.9" />
        <path d="M4 4 L56 4 L56 12 Q4 12 4 56 L4 4 Z" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="3" fill="#C9A84C" />
        <circle cx="20" cy="8" r="1.5" fill="#C9A84C" opacity="0.6" />
        <circle cx="8" cy="20" r="1.5" fill="#C9A84C" opacity="0.6" />
      </svg>
    </div>
  );
};

const LogoSVG = () => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 56, height: 56 }}>
    <circle cx="30" cy="30" r="28" fill="none" stroke="#C9A84C" strokeWidth="2" />
    <circle cx="30" cy="30" r="22" fill="#1a2744" />
    <polygon points="30,10 35,25 50,25 38,34 43,49 30,40 17,49 22,34 10,25 25,25" fill="#C9A84C" opacity="0.9" />
    <circle cx="30" cy="30" r="5" fill="#fff" opacity="0.9" />
  </svg>
);

const DividerSVG = () => (
  <svg viewBox="0 0 400 20" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", maxWidth: 440 }}>
    <line x1="0" y1="10" x2="155" y2="10" stroke="#C9A84C" strokeWidth="1" opacity="0.6" />
    <polygon points="175,10 185,4 195,10 185,16" fill="#C9A84C" />
    <circle cx="200" cy="10" r="4" fill="#C9A84C" />
    <polygon points="205,10 215,4 225,10 215,16" fill="#C9A84C" />
    <line x1="245" y1="10" x2="400" y2="10" stroke="#C9A84C" strokeWidth="1" opacity="0.6" />
  </svg>
);

const SealSVG = () => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 280, height: 280 }}>
    {[...Array(18)].map((_, i) => (
      <line key={i} x1="100" y1="100" x2={100 + 90 * Math.cos((i * 20 * Math.PI) / 180)}
        y2={100 + 90 * Math.sin((i * 20 * Math.PI) / 180)}
        stroke="#C9A84C" strokeWidth="0.5" opacity="0.3" />
    ))}
    <circle cx="100" cy="100" r="85" stroke="#C9A84C" strokeWidth="1.5" opacity="0.3" />
    <circle cx="100" cy="100" r="70" stroke="#C9A84C" strokeWidth="0.8" opacity="0.25" />
    <circle cx="100" cy="100" r="55" stroke="#C9A84C" strokeWidth="0.5" opacity="0.2" />
  </svg>
);

const ActiveSealSVG = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 72, height: 72 }}>
    {[...Array(16)].map((_, i) => {
      const angle = (i * 22.5 * Math.PI) / 180;
      const x1 = 40 + 28 * Math.cos(angle);
      const y1 = 40 + 28 * Math.sin(angle);
      const x2 = 40 + 35 * Math.cos(angle);
      const y2 = 40 + 35 * Math.sin(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A84C" strokeWidth="2" />;
    })}
    <circle cx="40" cy="40" r="26" fill="#1a2744" stroke="#C9A84C" strokeWidth="2" />
    <circle cx="40" cy="40" r="20" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity="0.5" />
    <text x="40" y="38" textAnchor="middle" fill="#C9A84C"
      style={{ fontSize: 7, fontFamily: "Raleway, sans-serif", fontWeight: 600, letterSpacing: 1 }}>
      BHI
    </text>
    <text x="40" y="49" textAnchor="middle" fill="#C9A84C"
      style={{ fontSize: 5, fontFamily: "Raleway, sans-serif", letterSpacing: 0.5 }}>
      CERTIFIED
    </text>
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A84C";
const DARK_NAVY = "#0d1b2a";
const NAVY = "#1a2744";
const CREAM = "#fdf8ef";
const GOLD_LIGHT = "#e8c96a";

const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(5,10,20,0.88)",
    backdropFilter: "blur(8px)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "16px",
    overflowY: "auto",
  },
  modalContainer: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 16,
    width: "100%", maxWidth: 900,
  },
  actionBar: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", width: "100%",
    padding: "0 4px",
  },
  btnGroup: { display: "flex", gap: 10 },
  btn: {
    padding: "9px 20px", borderRadius: 6,
    border: "none", cursor: "pointer",
    fontFamily: "Raleway, sans-serif",
    fontWeight: 600, fontSize: 13, letterSpacing: 0.5,
    transition: "all 0.2s",
  },
  btnClose: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.25)",
    color: "#ccc", padding: "9px 18px",
    borderRadius: 6, cursor: "pointer",
    fontFamily: "Raleway, sans-serif", fontSize: 13,
  },
  btnPNG: {
    background: "rgba(201,168,76,0.15)",
    border: `1px solid ${GOLD}`,
    color: GOLD_LIGHT,
  },
  btnPDF: {
    background: GOLD,
    color: DARK_NAVY,
  },

  // Certificate card itself
  certificate: {
    width: "100%",
    background: CREAM,
    borderRadius: 4,
    boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.3)",
    overflow: "hidden",
  },
  outerBorder: {
    background: `linear-gradient(135deg, ${DARK_NAVY} 0%, ${NAVY} 50%, ${DARK_NAVY} 100%)`,
    padding: 16,
    position: "relative",
  },
  innerBorder: {
    border: `1px solid rgba(201,168,76,0.35)`,
    borderRadius: 2,
    padding: "28px 40px",
    position: "relative",
    overflow: "hidden",
    minHeight: 480,
    background: `radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)`,
  },

  watermarkSeal: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    opacity: 0.07, pointerEvents: "none", zIndex: 0,
  },

  content: {
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 10,
    fontFamily: "Cormorant Garamond, serif",
  },

  // Institute header
  instituteRow: {
    display: "flex", alignItems: "center",
    gap: 16, marginBottom: 2,
  },
  instituteLogo: { flexShrink: 0 },
  instituteText: { textAlign: "left" },
  instituteName: {
    fontFamily: "Cinzel Decorative, serif",
    fontSize: "clamp(11px, 2vw, 18px)",
    color: GOLD,
    letterSpacing: "0.12em",
    margin: 0, lineHeight: 1.2,
  },
  instituteTagline: {
    fontFamily: "Raleway, sans-serif",
    fontSize: "clamp(8px, 1vw, 11px)",
    color: "rgba(201,168,76,0.6)",
    letterSpacing: "0.25em",
    margin: "4px 0 0 0",
    textTransform: "uppercase",
  },

  dividerOrnament: {
    width: "100%", display: "flex", justifyContent: "center",
    margin: "2px 0",
  },

  certLabel: {
    fontFamily: "Cinzel Decorative, serif",
    fontSize: "clamp(18px, 3.5vw, 32px)",
    color: GOLD,
    letterSpacing: "0.06em",
    margin: "4px 0 0",
    textShadow: "0 0 30px rgba(201,168,76,0.3)",
  },

  presentedTo: {
    fontFamily: "Cormorant Garamond, serif",
    fontStyle: "italic",
    fontSize: "clamp(12px, 1.6vw, 16px)",
    color: "rgba(255,255,255,0.55)",
    margin: "2px 0",
    letterSpacing: "0.04em",
  },

  studentName: {
    fontFamily: "Cormorant Garamond, serif",
    fontSize: "clamp(24px, 4.5vw, 46px)",
    fontWeight: 600,
    color: "#fff",
    letterSpacing: "0.04em",
    margin: "0",
    lineHeight: 1.1,
    textShadow: `0 2px 20px rgba(201,168,76,0.25)`,
  },

  thinDivider: {
    width: 120, height: 1,
    background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
    margin: "4px 0",
  },

  bodyText: {
    fontFamily: "Cormorant Garamond, serif",
    fontStyle: "italic",
    fontSize: "clamp(11px, 1.4vw, 15px)",
    color: "rgba(255,255,255,0.55)",
    margin: "1px 0",
  },

  courseName: {
    fontFamily: "Cormorant Garamond, serif",
    fontSize: "clamp(16px, 2.5vw, 26px)",
    fontWeight: 600,
    color: GOLD_LIGHT,
    letterSpacing: "0.03em",
    margin: "2px 0",
    textAlign: "center",
  },

  percentage: {
    fontFamily: "Cinzel Decorative, serif",
    fontSize: "1.1em",
    color: GOLD,
    fontStyle: "normal",
  },

  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: "100%",
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid rgba(201,168,76,0.2)",
  },
  footerItem: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4, flex: 1,
  },
  footerValue: {
    fontFamily: "Cormorant Garamond, serif",
    fontSize: "clamp(11px, 1.3vw, 14px)",
    color: "#fff",
    margin: 0,
    letterSpacing: "0.04em",
  },
  footerLine: {
    width: 100, height: 1,
    background: `linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)`,
  },
  footerLabel: {
    fontFamily: "Raleway, sans-serif",
    fontSize: "clamp(8px, 0.9vw, 10px)",
    color: "rgba(201,168,76,0.55)",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    margin: 0,
  },

  sealContainer: {
    display: "flex", flexDirection: "column",
    alignItems: "center", flex: 1,
  },
  sealText: {
    fontFamily: "Raleway, sans-serif",
    fontSize: 8,
    color: GOLD,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    margin: "2px 0 0",
  },

  certId: {
    fontFamily: "Raleway, sans-serif",
    fontSize: "clamp(7px, 0.8vw, 9px)",
    color: "rgba(201,168,76,0.35)",
    letterSpacing: "0.12em",
    margin: "4px 0 0",
  },
};

export default CertificateModal;
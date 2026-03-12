import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    // TODO: dispatch an updateProfile thunk here
    setEditing(false);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Avatar */}
        <div style={styles.avatarWrap}>
          <div style={styles.avatar}>{initials}</div>
        </div>

        <h1 style={styles.name}>{user?.name || "Student"}</h1>
        <span style={styles.badge}>Student</span>

        <div style={styles.divider} />

        {/* Fields */}
        <div style={styles.fields}>
          <Field
            label="Full Name"
            name="name"
            value={form.name}
            editing={editing}
            onChange={handleChange}
          />
          <Field
            label="Email"
            name="email"
            value={form.email}
            editing={editing}
            onChange={handleChange}
          />
          <Field
            label="Role"
            name="role"
            value={user?.role || "student"}
            editing={false}
            onChange={() => {}}
          />
        </div>

        <div style={styles.divider} />

        {/* Actions */}
        <div style={styles.actions}>
          {editing ? (
            <>
              <button style={styles.btnPrimary} onClick={handleSave}>
                Save Changes
              </button>
              <button style={styles.btnGhost} onClick={() => setEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button style={styles.btnPrimary} onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button style={styles.btnGhost} onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, editing, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      {editing ? (
        <input
          style={styles.input}
          name={name}
          value={value}
          onChange={onChange}
        />
      ) : (
        <p style={styles.value}>{value || "—"}</p>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem 1rem",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatarWrap: {
    marginBottom: "1rem",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "0.05em",
  },
  name: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#1a1a2e",
    margin: "0 0 0.4rem",
  },
  badge: {
    background: "#ede9fe",
    color: "#7c3aed",
    fontSize: "0.75rem",
    fontWeight: "600",
    padding: "0.25rem 0.75rem",
    borderRadius: "999px",
    textTransform: "capitalize",
  },
  divider: {
    width: "100%",
    height: "1px",
    background: "#f0f0f0",
    margin: "1.5rem 0",
  },
  fields: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  value: {
    fontSize: "1rem",
    color: "#1a1a2e",
    margin: 0,
    padding: "0.5rem 0",
    borderBottom: "1px solid #f0f0f0",
  },
  input: {
    fontSize: "1rem",
    color: "#1a1a2e",
    padding: "0.5rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  actions: {
    width: "100%",
    display: "flex",
    gap: "0.75rem",
    flexDirection: "column",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
  },
  btnGhost: {
    background: "transparent",
    color: "#667eea",
    border: "1.5px solid #667eea",
    borderRadius: "10px",
    padding: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
  },
};
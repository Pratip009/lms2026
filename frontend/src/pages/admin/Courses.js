import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { LoadingCenter, Alert } from "../../components/common";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap');

  :root {
    --white:      #ffffff;
    --surface:    #f8f8f6;
    --surface-2:  #f2f1ee;
    --border:     #e5e3de;
    --border-2:   #d6d3cc;
    --ink:        #111110;
    --ink-2:      #3d3c39;
    --ink-3:      #6e6b64;
    --ink-4:      #a09d95;
    --ink-5:      #ccc9c1;
    --accent:     #1c4ed8;
    --accent-lt:  #eff4ff;
    --accent-mid: #bfcfff;
    --green:      #16a34a;
    --green-lt:   #f0fdf4;
    --green-mid:  #bbf7d0;
    --danger:     #be123c;
    --danger-lt:  #fff1f3;
    --danger-mid: #fecdd3;
    --amber:      #b45309;
    --amber-lt:   #fffbeb;
    --amber-mid:  #fde68a;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;
    --shadow-sm:  0 2px 8px rgba(17,17,16,0.07);
    --shadow-md:  0 8px 24px rgba(17,17,16,0.09);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ac-root {
    font-family: var(--font-sans);
    background: var(--surface);
    min-height: 100vh;
    color: var(--ink);
    padding: 40px;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HEADER ══ */
  .ac-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .ac-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 6px;
  }
  .ac-title {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.05;
  }
  .ac-subtitle { font-size: 13px; color: var(--ink-4); margin-top: 4px; }

  .ac-btn-new {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-sans); font-size: 14px; font-weight: 600;
    background: var(--ink); color: white; border: none;
    border-radius: 8px; padding: 10px 20px; cursor: pointer;
    letter-spacing: -.01em; white-space: nowrap;
    transition: background .15s, transform .12s;
  }
  .ac-btn-new:hover { background: var(--accent); transform: translateY(-1px); }

  /* ══ ALERTS ══ */
  .ac-alerts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

  /* ══ TABLE CARD ══ */
  .ac-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  /* Search / filter bar */
  .ac-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .ac-search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 280px; }
  .ac-search-icon {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    color: var(--ink-5); display: flex; align-items: center; pointer-events: none;
  }
  .ac-search {
    width: 100%; padding: 8px 12px 8px 33px;
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 8px; font-family: var(--font-sans);
    font-size: 13.5px; color: var(--ink); outline: none;
    transition: border-color .14s, box-shadow .14s;
  }
  .ac-search::placeholder { color: var(--ink-5); }
  .ac-search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-lt); background: var(--white); }

  .ac-count { font-size: 13px; color: var(--ink-4); margin-left: auto; white-space: nowrap; }
  .ac-count strong { color: var(--ink-2); font-weight: 600; }

  /* ── Table ── */
  .ac-table-wrap { overflow-x: auto; }
  .ac-table { width: 100%; border-collapse: collapse; }

  .ac-table thead tr { border-bottom: 1px solid var(--border); }
  .ac-table th {
    padding: 11px 16px; text-align: left;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .08em; color: var(--ink-4);
    white-space: nowrap;
  }

  .ac-table td {
    padding: 14px 16px; font-size: 13.5px; color: var(--ink-3);
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .ac-table tbody tr:last-child td { border-bottom: none; }
  .ac-table tbody tr:hover td { background: var(--surface); }

  /* Course title cell */
  .ac-course-title-cell { display: flex; align-items: center; gap: 11px; }
  .ac-course-thumb {
    width: 44px; height: 34px; border-radius: 7px; object-fit: cover;
    background: var(--surface-2); border: 1px solid var(--border);
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 16px; overflow: hidden;
  }
  .ac-course-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .ac-course-name {
    font-size: 13.5px; font-weight: 600; color: var(--ink);
    max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ac-course-cat { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

  /* Badges */
  .ac-badge {
    display: inline-flex; align-items: center;
    font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 6px;
    letter-spacing: .02em;
  }
  .ac-badge-green  { background: var(--green-lt);  color: var(--green);  border: 1px solid var(--green-mid); }
  .ac-badge-gray   { background: var(--surface-2); color: var(--ink-4);  border: 1px solid var(--border); }

  /* Action buttons */
  .ac-actions { display: flex; align-items: center; gap: 6px; flex-wrap: nowrap; }

  .ac-btn {
    font-family: var(--font-sans); font-size: 12.5px; font-weight: 600;
    border-radius: 7px; padding: 6px 13px; cursor: pointer;
    border: 1.5px solid var(--border); background: var(--white); color: var(--ink-3);
    transition: border-color .13s, color .13s, background .13s;
    white-space: nowrap; letter-spacing: -.01em;
  }
  .ac-btn:hover { border-color: var(--border-2); color: var(--ink); background: var(--surface); }

  .ac-btn-publish {
    border-color: var(--green-mid); color: var(--green); background: var(--green-lt);
  }
  .ac-btn-publish:hover { background: #dcfce7; border-color: var(--green); }

  .ac-btn-unpublish {
    border-color: var(--amber-mid); color: var(--amber); background: var(--amber-lt);
  }
  .ac-btn-unpublish:hover { background: #fef3c7; border-color: var(--amber); }

  .ac-btn-danger {
    border-color: var(--danger-mid); color: var(--danger); background: var(--danger-lt);
  }
  .ac-btn-danger:hover { background: #ffe4e6; border-color: var(--danger); }

  /* Empty */
  .ac-empty { text-align: center; padding: 72px 20px; }
  .ac-empty-icon { font-size: 40px; opacity: .2; margin-bottom: 14px; }
  .ac-empty-title {
    font-family: var(--font-serif); font-size: 20px; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 6px;
  }
  .ac-empty-sub { font-size: 13.5px; color: var(--ink-4); margin-bottom: 22px; }
  .ac-empty-btn {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: var(--font-sans); font-size: 14px; font-weight: 600;
    background: var(--ink); color: white; border: none;
    border-radius: 8px; padding: 10px 20px; cursor: pointer;
    transition: background .15s;
  }
  .ac-empty-btn:hover { background: var(--accent); }

  @media (max-width: 768px) {
    .ac-root { padding: 24px 16px; }
    .ac-course-name { max-width: 140px; }
  }
`;

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api
      .get("/courses/admin/all", { params: { limit: 50 } })
      .then((r) => {
        const list =
          r.data.courses ||
          r.data.data ||
          r.data.results ||
          (Array.isArray(r.data) ? r.data : []);
        setCourses(list);
      })
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleTogglePublish = async (id) => {
    setError(""); setMsg("");
    try {
      const res = await api.patch(`/courses/${id}/publish`);
      setMsg(res.data.message || "Status updated");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(""); setMsg("");
    try {
      await api.delete(`/courses/${id}`);
      setMsg("Course deleted");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return (
    <div style={{ background: 'var(--surface, #f8f8f6)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingCenter />
    </div>
  );

  const filtered = courses.filter(c =>
    !search ||
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{styles}</style>
      <div className="ac-root">

        {/* ── Header ── */}
        <div className="ac-header">
          <div>
            <div className="ac-eyebrow">Admin Panel</div>
            <div className="ac-title">Courses</div>
            <div className="ac-subtitle">{courses.length} course{courses.length !== 1 ? 's' : ''} total</div>
          </div>
          <button className="ac-btn-new" onClick={() => navigate("/admin/courses/new")}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Course
          </button>
        </div>

        {/* ── Alerts ── */}
        {(error || msg) && (
          <div className="ac-alerts">
            {error && <Alert type="error">{error}</Alert>}
            {msg   && <Alert type="success">{msg}</Alert>}
          </div>
        )}

        {/* ── Table Card ── */}
        <div className="ac-card">
          {/* Search bar */}
          <div className="ac-bar">
            <div className="ac-search-wrap">
              <span className="ac-search-icon">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                className="ac-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses…"
              />
            </div>
            <div className="ac-count">
              <strong>{filtered.length}</strong> of {courses.length} courses
            </div>
          </div>

          {/* Table */}
          <div className="ac-table-wrap">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Price</th>
                  <th>Enrollments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="ac-empty">
                        <div className="ac-empty-icon">📭</div>
                        <div className="ac-empty-title">
                          {search ? 'No courses match your search' : 'No courses yet'}
                        </div>
                        <div className="ac-empty-sub">
                          {search
                            ? 'Try a different search term.'
                            : 'Create your first course to get started.'}
                        </div>
                        {!search && (
                          <button className="ac-empty-btn" onClick={() => navigate("/admin/courses/new")}>
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M12 5v14M5 12h14"/>
                            </svg>
                            New Course
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr key={c._id}>
                    {/* Course title + category */}
                    <td>
                      <div className="ac-course-title-cell">
                        <div className="ac-course-thumb">
                          {c.thumbnail?.url
                            ? <img src={c.thumbnail.url} alt={c.title} />
                            : '📚'}
                        </div>
                        <div>
                          <div className="ac-course-name">{c.title}</div>
                          {c.category && <div className="ac-course-cat">{c.category}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td>
                      {c.discountPrice > 0 ? (
                        <span>
                          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>${c.discountPrice}</span>
                          <span style={{ fontSize: 12, color: 'var(--ink-5)', textDecoration: 'line-through', marginLeft: 6 }}>${c.price}</span>
                        </span>
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>${c.price}</span>
                      )}
                    </td>

                    {/* Enrollments */}
                    <td style={{ fontWeight: 500, color: 'var(--ink-2)' }}>
                      {c.enrollmentCount ?? 0}
                    </td>

                    {/* Status badge */}
                    <td>
                      <span className={`ac-badge ${c.isPublished ? 'ac-badge-green' : 'ac-badge-gray'}`}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ac-actions">
                        <button
                          className="ac-btn"
                          onClick={() => navigate(`/admin/courses/${c._id}/lessons`)}
                        >
                          Lessons
                        </button>
                        <button
                          className="ac-btn"
                          onClick={() => navigate(`/admin/courses/${c._id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className={`ac-btn ${c.isPublished ? 'ac-btn-unpublish' : 'ac-btn-publish'}`}
                          onClick={() => handleTogglePublish(c._id)}
                        >
                          {c.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          className="ac-btn ac-btn-danger"
                          onClick={() => handleDelete(c._id, c.title)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
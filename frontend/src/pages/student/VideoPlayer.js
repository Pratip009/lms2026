import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { LoadingCenter } from "../../components/common";
import LessonChat from "./Lessonchat";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:#eff6ff; --b100:#dbeafe; --b200:#bfdbfe; --b300:#93c5fd;
    --b400:#60a5fa; --b500:#3b82f6; --b600:#2563eb; --b700:#1d4ed8;
    --b800:#1e40af; --b900:#1e3a8a;
    --hero:#050f2b;
    --ink:#0f172a; --ink-2:#334155; --ink-3:#64748b; --ink-4:#94a3b8; --ink-5:#cbd5e1;
    --surface:#f8fafc; --surface-2:#f1f5f9;
    --border:rgba(15,23,42,0.08); --border-2:rgba(15,23,42,0.14);
    --white:#ffffff;
    --green:#16a34a; --green-lt:#f0fdf4; --green-mid:#bbf7d0;
    --amber:#d97706; --amber-lt:#fffbeb; --amber-mid:#fde68a;
    --rose:#e11d48; --rose-lt:#fff1f2; --rose-mid:#fecdd3;
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
    --sidebar-w: 280px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }

  .vp-root {
    font-family: var(--font-body);
    background: var(--surface);
    color: var(--ink);
    display: flex;
    min-height: calc(100vh - 60px);
    -webkit-font-smoothing: antialiased;
    position: relative;
  }

  .vp-root::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:radial-gradient(circle,rgba(37,99,235,0.04) 1px,transparent 1px);
    background-size:28px 28px;
  }

  /* ══ MOBILE TOPBAR ══ */
  .vp-mobile-bar {
    display: none;
    position: sticky; top: 0; z-index: 100;
    background: var(--hero);
    padding: 0 16px;
    height: 52px;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .vp-mobile-bar-left {
    display: flex; align-items: center; gap: 10px;
  }
  .vp-hamburger {
    width: 36px; height: 36px; border-radius: 9px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; cursor: pointer; flex-shrink: 0;
  }
  .vp-hamburger span {
    display: block; width: 16px; height: 1.5px;
    background: rgba(255,255,255,0.8); border-radius: 2px;
    transition: all .2s;
  }
  .vp-hamburger.open span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
  .vp-hamburger.open span:nth-child(2) { opacity: 0; }
  .vp-hamburger.open span:nth-child(3) { transform: rotate(-45deg) translate(4px, -4px); }

  .vp-mobile-title {
    font-family: var(--font-display);
    font-size: 13px; font-weight: 700;
    color: rgba(255,255,255,0.9);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 160px;
  }
  .vp-mobile-prog-pill {
    font-size: 10px; font-weight: 700;
    color: var(--b300); font-family: var(--font-display);
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.25);
    padding: 3px 10px; border-radius: 100px;
    white-space: nowrap;
  }

  /* ══ SIDEBAR OVERLAY (mobile) ══ */
  .vp-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 200;
    background: rgba(5,15,43,0.55);
    backdrop-filter: blur(2px);
    animation: overlayIn .2s ease;
  }
  .vp-overlay.open { display: block; }

  /* ══ SIDEBAR ══ */
  .vp-sidebar {
    width: var(--sidebar-w); min-width: var(--sidebar-w);
    background: var(--white); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow: hidden;
    position: relative; z-index: 1;
    transition: transform .25s ease;
  }

  .vp-sidebar-top {
    padding: 22px 20px 18px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(175deg,#050f2b 0%,#0d1f4a 60%,#112255 100%);
    position: relative; overflow: hidden; flex-shrink: 0;
  }
  .vp-sidebar-top::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(59,130,246,0.18) 1px,transparent 1px);
    background-size:22px 22px; pointer-events:none;
    mask-image:linear-gradient(180deg,rgba(0,0,0,.6) 0%,transparent 100%);
    -webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.6) 0%,transparent 100%);
  }
  .vp-sidebar-top::after {
    content:''; position:absolute; bottom:-20px; right:-20px;
    width:140px; height:120px;
    background:radial-gradient(ellipse,rgba(59,130,246,0.18) 0%,transparent 70%);
    pointer-events:none;
  }

  .vp-sidebar-close {
    display: none;
    position: absolute; top: 12px; right: 12px;
    width: 28px; height: 28px; border-radius: 7px;
    background: rgba(255,255,255,0.1); border: none; cursor: pointer;
    color: rgba(255,255,255,0.7); font-size: 16px;
    align-items: center; justify-content: center;
    z-index: 2; transition: background .15s;
  }
  .vp-sidebar-close:hover { background: rgba(255,255,255,0.18); }

  .vp-back-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: rgba(255,255,255,0.55); text-decoration: none;
    font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
    transition: color .15s; position: relative; font-family: var(--font-display);
  }
  .vp-back-link:hover { color: rgba(255,255,255,0.9); }

  .vp-prog-wrap { margin-top: 16px; position: relative; }
  .vp-prog-label-row {
    display: flex; justify-content: space-between;
    font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); margin-bottom: 8px; font-family: var(--font-display);
  }
  .vp-prog-label-row em { font-style: normal; color: var(--b400); }
  .vp-prog-track { height: 4px; background: rgba(255,255,255,0.12); border-radius: 100px; overflow: hidden; }
  .vp-prog-fill {
    height: 100%; background: linear-gradient(90deg,var(--b400),var(--b300));
    border-radius: 100px; transition: width .5s ease; position: relative;
  }
  .vp-prog-fill::after {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);
    animation:shimmer 2.4s ease-in-out infinite;
  }

  .vp-list-label {
    padding: 13px 20px 5px;
    font-size: 9.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-4); font-family: var(--font-display); flex-shrink: 0;
  }

  .vp-lesson-list {
    overflow-y: auto; flex: 1;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .vp-lesson-list::-webkit-scrollbar { width: 4px; }
  .vp-lesson-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .vp-lesson-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 20px; border-bottom: 1px solid var(--surface);
    cursor: pointer; transition: background .12s;
  }
  .vp-lesson-item:hover:not(.locked) { background: var(--surface); }
  .vp-lesson-item.active {
    background: var(--b50); border-left: 3px solid var(--b600); padding-left: 17px;
  }
  .vp-lesson-item.locked { cursor: not-allowed; opacity: .42; }

  .vp-lesson-num {
    font-size: 10px; font-weight: 800; color: var(--ink-4);
    min-width: 18px; text-align: center; font-family: var(--font-display);
  }
  .vp-lesson-item.active .vp-lesson-num { color: var(--b600); }

  .vp-lesson-dot {
    width: 26px; height: 26px; border-radius: 7px; background: var(--surface-2);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0; color: var(--ink-4); transition: all .15s;
  }
  .vp-lesson-item.active .vp-lesson-dot { background: var(--b100); color: var(--b600); }
  .vp-lesson-dot.ok   { background: var(--green-lt); color: var(--green); }
  .vp-lesson-dot.seen { background: var(--amber-lt); color: var(--amber); }

  .vp-lesson-info { flex: 1; min-width: 0; }
  .vp-lesson-name {
    font-size: 13px; font-weight: 500; color: var(--ink-2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;
    font-family: var(--font-body);
  }
  .vp-lesson-item.active .vp-lesson-name { color: var(--b700); font-weight: 600; }
  .vp-lesson-sub { font-size: 10px; color: var(--ink-4); margin-top: 2px; font-weight: 400; }
  .vp-lesson-sub.ok   { color: var(--green); font-weight: 600; }
  .vp-lesson-sub.seen { color: var(--amber); font-weight: 600; }

  /* ══ MAIN ══ */
  .vp-main { flex: 1; overflow-y: auto; position: relative; z-index: 1; min-width: 0; }
  .vp-content { width: 100%; padding: 36px 40px 72px; max-width: 960px; }

  .vp-main-hero {
    position: absolute; top: 0; left: 0; right: 0; height: 200px; z-index: 0; pointer-events: none;
    background: linear-gradient(180deg,rgba(5,15,43,0.04) 0%,transparent 100%);
  }

  .vp-crumb {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    font-size: 12px; color: var(--ink-4); margin-bottom: 18px;
    animation: fadeUp .35s ease both;
  }
  .vp-crumb a { color: var(--ink-4); text-decoration: none; }
  .vp-crumb a:hover { color: var(--b600); }
  .vp-crumb-sep { opacity: .35; }

  .vp-title-row {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
    margin-bottom: 24px; flex-wrap: wrap;
    animation: fadeUp .4s ease both .05s;
  }
  .vp-title {
    font-family: var(--font-display);
    font-size: clamp(20px,3vw,32px); font-weight: 800;
    color: var(--ink); margin: 0; line-height: 1.15; letter-spacing: -.04em;
  }
  .vp-badges { display: flex; gap: 8px; padding-top: 5px; flex-shrink: 0; flex-wrap: wrap; }
  .vp-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px; border-radius: 100px;
    font-size: 10.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase;
    font-family: var(--font-display);
  }
  .vp-badge-watched { background: var(--amber-lt); color: var(--amber); border: 1px solid var(--amber-mid); }
  .vp-badge-passed  {
    background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid);
    box-shadow: 0 2px 8px rgba(22,163,74,0.12);
  }

  .vp-alert {
    display: flex; align-items: center; gap: 10px;
    background: var(--rose-lt); border: 1px solid var(--rose-mid);
    color: var(--rose); border-radius: var(--r);
    padding: 12px 16px; font-size: 13px; margin-bottom: 22px;
    animation: fadeIn .3s ease;
  }

  /* ── Video ── */
  .vp-video-shell {
    position: relative; padding-bottom: 56.25%; height: 0;
    margin-bottom: 24px; border-radius: var(--r-lg); overflow: hidden;
    background: #050f2b;
    box-shadow: 0 4px 28px rgba(5,15,43,0.18), 0 0 0 1px rgba(15,23,42,0.08);
    animation: fadeUp .45s ease both .1s;
  }
  .vp-video-shell iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

  .vp-video-placeholder {
    position: relative; padding-bottom: 56.25%; height: 0;
    margin-bottom: 24px; border-radius: var(--r-lg); overflow: hidden;
    background: var(--white); border: 1px solid var(--border);
    box-shadow: 0 2px 12px rgba(15,23,42,0.06);
    animation: fadeUp .45s ease both .1s;
  }
  .vp-video-placeholder-in {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  }
  .vp-ph-icon {
    width: 56px; height: 56px; border-radius: 14px;
    background: var(--surface-2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center; font-size: 22px;
    box-shadow: 0 2px 8px rgba(15,23,42,0.06);
  }
  .vp-ph-text { font-size: 14px; color: var(--ink-4); }
  .vp-spinner {
    width: 28px; height: 28px; border: 2.5px solid var(--border); border-top-color: var(--b500);
    border-radius: 50%; animation: spin .75s linear infinite;
  }

  /* ── Actions ── */
  .vp-actions {
    display: flex; gap: 10px; margin-bottom: 26px; flex-wrap: wrap;
    animation: fadeUp .4s ease both .15s;
  }
  .vp-btn {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: var(--r);
    font-family: var(--font-display); font-size: 12px; font-weight: 700;
    cursor: pointer; border: none; transition: all .15s; white-space: nowrap;
    letter-spacing: .04em; text-transform: uppercase;
  }
  .vp-btn-primary {
    background: linear-gradient(135deg,var(--b500),var(--b700)); color: #fff;
    box-shadow: 0 3px 14px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .vp-btn-primary::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .vp-btn-primary:hover { box-shadow:0 6px 22px rgba(37,99,235,0.36); transform:translateY(-1px); }

  .vp-btn-outline {
    background: var(--white); color: var(--ink-2); border: 1px solid var(--border-2);
  }
  .vp-btn-outline:hover { background: var(--surface); border-color: var(--ink-4); box-shadow: 0 2px 8px rgba(15,23,42,0.07); }

  .vp-btn-success {
    background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid);
    box-shadow: 0 2px 8px rgba(22,163,74,0.1);
  }
  .vp-btn-success::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .vp-btn-success:hover { background:#e0f7f0; box-shadow:0 4px 14px rgba(22,163,74,0.15); }

  .vp-btn-ghost {
    background: transparent; color: var(--ink-3); border: 1px solid var(--border);
  }
  .vp-btn-ghost:hover { color: var(--ink-2); border-color: var(--border-2); background: var(--white); }

  /* ── Card ── */
  .vp-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-xl); padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    transition: border-color .2s, box-shadow .25s;
    animation: fadeUp .45s ease both .2s;
    position: relative; overflow: hidden;
  }
  .vp-card::after {
    content:''; position:absolute; top:0; right:0; width:180px; height:180px;
    background:radial-gradient(ellipse at 100% 0%,rgba(37,99,235,0.04) 0%,transparent 70%);
    pointer-events:none;
  }
  .vp-card:hover {
    border-color: rgba(37,99,235,0.14);
    box-shadow: 0 6px 22px rgba(37,99,235,0.08);
  }
  .vp-card-heading {
    font-size: 9.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-4); margin-bottom: 14px;
    display: flex; align-items: center; gap: 9px;
    font-family: var(--font-display);
  }
  .vp-card-heading::before {
    content:''; display:block; width:3px; height:14px;
    background:linear-gradient(180deg,var(--b500),var(--b400)); border-radius:2px;
  }
  .vp-card p { color: var(--ink-2); line-height: 1.85; font-size: 14px; font-weight: 400; margin: 0; }
  .vp-hr { border: none; border-top: 1px solid var(--border); margin: 22px 0; }

  /* ── Chat ── */
  .vp-chat-section { margin-top: 24px; animation: fadeUp .45s ease both .25s; }
  .vp-chat-label {
    font-size: 9.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    color: var(--ink-4); margin-bottom: 12px;
    display: flex; align-items: center; gap: 9px;
    font-family: var(--font-display);
  }
  .vp-chat-label::before {
    content:''; display:block; width:3px; height:14px;
    background:linear-gradient(180deg,var(--b500),var(--b400)); border-radius:2px;
  }
  .vp-chat-wrap { height: 560px; display: flex; flex-direction: column; }

  /* ══ TABLET: 768px–1024px ══ */
  @media (max-width: 1024px) {
    :root { --sidebar-w: 240px; }
    .vp-content { padding: 28px 28px 60px; }
  }

  /* ══ MOBILE: ≤768px ══ */
  @media (max-width: 768px) {
    .vp-root { flex-direction: column; min-height: calc(100vh - 60px); }

    /* Show mobile topbar */
    .vp-mobile-bar { display: flex; }

    /* Sidebar becomes a drawer */
    .vp-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      z-index: 300; width: 300px; min-width: 0;
      transform: translateX(-100%);
      box-shadow: 4px 0 32px rgba(5,15,43,0.25);
    }
    .vp-sidebar.open {
      transform: translateX(0);
      animation: slideIn .25s ease;
    }
    .vp-sidebar-close { display: flex; }

    /* Main takes full width */
    .vp-main { width: 100%; overflow-y: visible; }
    .vp-content { padding: 20px 16px 48px; }
    .vp-main-hero { display: none; }

    /* Crumb wraps nicely */
    .vp-crumb { font-size: 11px; gap: 4px; }

    /* Title */
    .vp-title { font-size: 20px; }
    .vp-title-row { margin-bottom: 16px; gap: 10px; }

    /* Buttons full-width on very small screens */
    .vp-actions { gap: 8px; }
    .vp-btn { padding: 10px 14px; font-size: 11px; }

    /* Card padding tighter */
    .vp-card { padding: 20px 18px; border-radius: var(--r-lg); }

    /* Chat shorter on mobile */
    .vp-chat-wrap { height: 420px; }
  }

  /* ══ SMALL MOBILE: ≤480px ══ */
  @media (max-width: 480px) {
    .vp-content { padding: 16px 12px 40px; }
    .vp-title { font-size: 18px; }
    .vp-actions { flex-direction: column; }
    .vp-btn { width: 100%; justify-content: center; }
    .vp-card { padding: 16px 14px; }
    .vp-chat-wrap { height: 360px; }
    .vp-mobile-title { max-width: 120px; }
    .vp-badge { font-size: 9.5px; padding: 4px 9px; }
  }
`;

export default function VideoPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [lesson,       setLesson]       = useState(null);
  const [lessons,      setLessons]      = useState([]);
  const [otpData,      setOtpData]      = useState(null);
  const [progress,     setProgress]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error,        setError]        = useState("");
  const [watched,      setWatched]      = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);

  const currentUser = useSelector(s => s.auth.user);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [lessonId]);

  // Close sidebar on ESC key
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => {
    setLoading(true); setError(""); setOtpData(null);
    Promise.all([
      api.get(`/lessons/${lessonId}`),
      api.get(`/courses/${courseId}/lessons`),
      api.get(`/progress/${courseId}`).catch(() => ({ data: { data: { progress: null } } })),
    ])
      .then(([l, ll, p]) => {
        setLesson(l.data.data?.lesson || l.data.lesson);
        setLessons(ll.data.data?.lessons || ll.data.lessons || []);
        setProgress(p.data.data?.progress || p.data.progress);
      })
      .catch(err => setError(err.response?.data?.message || "Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!lesson?.video?.vdoCipherId) return;
    setOtpData(null); setVideoLoading(true);
    api.get(`/lessons/${lessonId}/video-otp`)
      .then(r => setOtpData(r.data.data || r.data))
      .catch(err => setError(err.response?.data?.message || "Failed to load video"))
      .finally(() => setVideoLoading(false));
  }, [lesson, lessonId]);

  const handleMarkWatched = async () => {
    try { await api.post(`/progress/${courseId}/lessons/${lessonId}/watch`); setWatched(true); }
    catch (err) { console.error(err); }
  };

  const getLessonProgress = lid =>
    progress?.lessons?.find(l => l.lesson?._id === lid || l.lesson === lid);

  const currentIndex          = lessons.findIndex(l => l._id === lessonId);
  const nextLesson            = lessons[currentIndex + 1];
  const prevLesson            = lessons[currentIndex - 1];
  const currentLessonProgress = getLessonProgress(lessonId);
  const isUserAdmin           = currentUser?.role === 'admin' || currentUser?.role === 'instructor';
  const isWatched             = isUserAdmin || watched || currentLessonProgress?.isWatched;
  const isPassed              = isUserAdmin || currentLessonProgress?.examPassed;
  const completedCount        = progress?.lessons?.filter(l => l.examPassed).length || 0;
  const progressPct           = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) return <LoadingCenter />;

  const SidebarContent = (
    <>
      <div className="vp-sidebar-top">
        <button className="vp-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        <Link to={`/courses/${courseId}`} className="vp-back-link">
          ← Back to course
        </Link>
        <div className="vp-prog-wrap">
          <div className="vp-prog-label-row">
            <span>Course Progress</span>
            <em>{progressPct}%</em>
          </div>
          <div className="vp-prog-track">
            <div className="vp-prog-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="vp-list-label">Lessons · {lessons.length}</div>

      <div className="vp-lesson-list">
        {lessons.map((l, i) => {
          const lp       = getLessonProgress(l._id);
          const isActive = l._id === lessonId;
          const isAdmin  = currentUser?.role === 'admin' || currentUser?.role === 'instructor';
          const isLocked = !isAdmin && !l.isFreePreview && !lp?.isUnlocked;
          const dotClass = lp?.examPassed ? "ok" : lp?.isWatched ? "seen" : "";
          const icon     = lp?.examPassed ? "✓" : lp?.isWatched ? "◉" : isLocked ? "⊘" : "▷";
          const subLabel = lp?.examPassed ? "Passed" : lp?.isWatched ? "Watched" : isLocked ? "Locked" : "Available";
          return (
            <div key={l._id}
              className={`vp-lesson-item${isActive ? " active" : ""}${isLocked ? " locked" : ""}`}
              onClick={() => { if (!isLocked) { navigate(`/learn/${courseId}/lesson/${l._id}`); setSidebarOpen(false); } }}>
              <span className="vp-lesson-num">{i + 1}</span>
              <div className={`vp-lesson-dot ${dotClass}`}>{icon}</div>
              <div className="vp-lesson-info">
                <div className="vp-lesson-name">{l.title}</div>
                <div className={`vp-lesson-sub ${dotClass}`}>{subLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="vp-root">

        {/* ── Mobile topbar ── */}
        <div className="vp-mobile-bar">
          <div className="vp-mobile-bar-left">
            <button
              className={`vp-hamburger${sidebarOpen ? ' open' : ''}`}
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle lesson list"
            >
              <span /><span /><span />
            </button>
            <span className="vp-mobile-title">{lesson?.title}</span>
          </div>
          <span className="vp-mobile-prog-pill">{progressPct}% done</span>
        </div>

        {/* ── Overlay (mobile) ── */}
        <div
          className={`vp-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* ── Sidebar ── */}
        <div className={`vp-sidebar${sidebarOpen ? ' open' : ''}`}>
          {SidebarContent}
        </div>

        {/* ── Main ── */}
        <div className="vp-main">
          <div className="vp-main-hero" />
          <div className="vp-content">

            <div className="vp-crumb">
              <Link to={`/courses/${courseId}`}>Course</Link>
              <span className="vp-crumb-sep">›</span>
              <span>Lesson {currentIndex + 1}</span>
              <span className="vp-crumb-sep">›</span>
              <span style={{ color: "var(--ink-2)" }}>{lesson?.title}</span>
            </div>

            <div className="vp-title-row">
              <h1 className="vp-title">{lesson?.title}</h1>
              <div className="vp-badges">
                {isWatched && !isPassed && <span className="vp-badge vp-badge-watched">Watched</span>}
                {isPassed && <span className="vp-badge vp-badge-passed">✓ Passed</span>}
              </div>
            </div>

            {error && <div className="vp-alert"><span>⚠</span> {error}</div>}

            {otpData?.otp && otpData?.playbackInfo ? (
              <div className="vp-video-shell">
                <iframe ref={iframeRef} title={lesson?.title}
                  src={`https://player.vdocipher.com/v2/?otp=${otpData.otp}&playbackInfo=${otpData.playbackInfo}`}
                  allowFullScreen allow="encrypted-media" />
              </div>
            ) : (
              <div className="vp-video-placeholder">
                <div className="vp-video-placeholder-in">
                  {videoLoading ? (
                    <><div className="vp-spinner" /><span className="vp-ph-text">Loading video…</span></>
                  ) : (
                    <><div className="vp-ph-icon">🎬</div>
                    <span className="vp-ph-text">{error ? "Video unavailable" : "No video attached"}</span></>
                  )}
                </div>
              </div>
            )}

            <div className="vp-actions">
              {prevLesson && (
                <button className="vp-btn vp-btn-ghost"
                  onClick={() => navigate(`/learn/${courseId}/lesson/${prevLesson._id}`)}>
                  ← Previous
                </button>
              )}
              {!isWatched && (
                <button className="vp-btn vp-btn-outline" onClick={handleMarkWatched}>
                  ✓ Mark as Watched
                </button>
              )}
              {isWatched && !isPassed && (
                <button className="vp-btn vp-btn-primary"
                  onClick={() => navigate(`/learn/${courseId}/lesson/${lessonId}/exam`)}>
                  Take Exam →
                </button>
              )}
              {isPassed && nextLesson && (
                <button className="vp-btn vp-btn-success"
                  onClick={() => navigate(`/learn/${courseId}/lesson/${nextLesson._id}`)}>
                  Next Lesson →
                </button>
              )}
            </div>

            <div className="vp-card">
              <div className="vp-card-heading">About this lesson</div>
              <p>{lesson?.description}</p>
              {lesson?.notes && (
                <>
                  <hr className="vp-hr" />
                  <div className="vp-card-heading">Notes</div>
                  <p style={{ whiteSpace: "pre-wrap" }}>{lesson.notes}</p>
                </>
              )}
            </div>

            <div className="vp-chat-section">
              <div className="vp-chat-label">Discussion</div>
              <div className="vp-chat-wrap">
                <LessonChat courseId={courseId} lessonId={lessonId} currentUser={currentUser} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
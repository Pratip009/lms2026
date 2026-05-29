import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { LoadingCenter } from "../../components/common";
import LessonChat from "./Lessonchat";
import {useCertificate} from "../../components/useCertificate";
import CertificateModal from "../../components/CertificateModal";

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
    --gold:#C9A84C; --gold-lt:rgba(201,168,76,0.12); --gold-mid:rgba(201,168,76,0.3);
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
    --sidebar-w: 272px;
    --topbar-h: 60px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes shimmer   { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes slideLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes certPop   { 0%{opacity:0;transform:scale(0.88) translateY(20px)} 60%{transform:scale(1.03) translateY(-2px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes certGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0)} 50%{box-shadow:0 0 32px 8px rgba(201,168,76,0.25)} }

  /* ══ ROOT SHELL ══ */
  .vp-root {
    font-family: var(--font-body);
    background: var(--surface);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - var(--topbar-h));
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow: hidden;
  }
  .vp-root::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:radial-gradient(circle,rgba(37,99,235,0.035) 1px,transparent 1px);
    background-size:28px 28px;
  }

  /* ══ TOP STRIP ══ */
  .vp-topstrip {
    background: linear-gradient(135deg, #050f2b 0%, #0d1f4a 55%, #112255 100%);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center;
    padding: 0 20px; height: 52px; flex-shrink: 0;
    position: sticky; top: 0; z-index: 100;
    gap: 0;
  }
  .vp-topstrip::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(59,130,246,0.15) 1px,transparent 1px);
    background-size:22px 22px; pointer-events:none;
    mask-image:linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 100%);
    -webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 100%);
  }

  .vp-toggle-sidebar-btn {
    width: 34px; height: 34px; border-radius: 9px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; color: rgba(255,255,255,0.7);
    transition: all .18s; position: relative; z-index: 1; margin-right: 12px;
  }
  .vp-toggle-sidebar-btn:hover { background:rgba(255,255,255,0.15); color:#fff; }
  .vp-toggle-sidebar-btn svg { width:16px; height:16px; fill:currentColor; }

  .vp-topstrip-back {
    display: inline-flex; align-items: center; gap: 5px;
    color: rgba(255,255,255,0.5); text-decoration: none;
    font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    transition: color .15s; position: relative; font-family: var(--font-display);
    margin-right: 14px; flex-shrink: 0;
  }
  .vp-topstrip-back:hover { color: rgba(255,255,255,0.9); }

  .vp-topstrip-divider {
    width: 1px; height: 22px; background: rgba(255,255,255,0.12);
    margin-right: 14px; flex-shrink: 0;
  }

  .vp-topstrip-lesson-info { flex: 1; min-width: 0; position: relative; }
  .vp-topstrip-num {
    font-size: 9.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
    color: var(--b400); font-family: var(--font-display); margin-bottom: 1px;
  }
  .vp-topstrip-title {
    font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.92);
    font-family: var(--font-display); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; max-width: 400px;
  }

  .vp-topstrip-right {
    display: flex; align-items: center; gap: 10px;
    position: relative; flex-shrink: 0; margin-left: auto;
  }

  .vp-prog-pill {
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px; padding: 5px 12px; min-width: 130px;
  }
  .vp-prog-pill-track {
    flex: 1; height: 3px; background: rgba(255,255,255,0.12);
    border-radius: 100px; overflow: hidden;
  }
  .vp-prog-pill-fill {
    height: 100%; background: linear-gradient(90deg, var(--b400), var(--b300));
    border-radius: 100px; transition: width .5s ease;
  }
  .vp-prog-pill-fill.complete {
    background: linear-gradient(90deg, var(--gold), #e8c96a);
    animation: certGlow 1.8s ease-in-out 3;
  }
  .vp-prog-pill-label {
    font-size: 10.5px; font-weight: 800; color: var(--b300);
    font-family: var(--font-display); white-space: nowrap;
  }
  .vp-prog-pill-label.complete { color: var(--gold); }

  .vp-topstrip-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 100px;
    font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    font-family: var(--font-display); flex-shrink: 0;
  }
  .vp-badge-watched { background: rgba(217,119,6,0.2); color: #fbbf24; border: 1px solid rgba(217,119,6,0.3); }
  .vp-badge-passed  { background: rgba(22,163,74,0.2); color: #4ade80; border: 1px solid rgba(22,163,74,0.3); }
  .vp-badge-cert    { background: rgba(201,168,76,0.2); color: var(--gold); border: 1px solid rgba(201,168,76,0.35); cursor: pointer; transition: background .15s; }
  .vp-badge-cert:hover { background: rgba(201,168,76,0.32); }

  /* ══ BODY ══ */
  .vp-body {
    flex: 1; display: flex; overflow: hidden; position: relative; z-index: 1;
    height: calc(100vh - var(--topbar-h) - 52px);
  }

  /* ══ SIDEBAR ══ */
  .vp-sidebar {
    width: var(--sidebar-w); flex-shrink: 0;
    background: var(--white); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow: hidden;
    transition: width .28s cubic-bezier(.4,0,.2,1), min-width .28s cubic-bezier(.4,0,.2,1);
    position: relative; z-index: 2;
    min-width: var(--sidebar-w);
  }
  .vp-sidebar.collapsed { width: 0; min-width: 0; border-right: none; }

  .vp-sidebar-top {
    padding: 20px 18px 16px;
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
    width:120px; height:100px;
    background:radial-gradient(ellipse,rgba(59,130,246,0.18) 0%,transparent 70%);
    pointer-events:none;
  }

  .vp-sidebar-prog-label {
    font-size: 9.5px; font-weight: 800; letter-spacing:.14em; text-transform: uppercase;
    color: rgba(255,255,255,0.4); font-family: var(--font-display);
    margin-bottom: 8px; display:flex; justify-content:space-between; position: relative;
  }
  .vp-sidebar-prog-label em { font-style:normal; color: var(--b400); }
  .vp-sidebar-prog-label em.complete { color: var(--gold); }

  .vp-sidebar-prog-track { height:4px; background:rgba(255,255,255,0.12); border-radius:100px; overflow:hidden; position: relative; }
  .vp-sidebar-prog-fill {
    height:100%; background:linear-gradient(90deg,var(--b400),var(--b300));
    border-radius:100px; transition:width .5s ease; position:relative;
  }
  .vp-sidebar-prog-fill.complete {
    background: linear-gradient(90deg, var(--gold), #e8c96a);
  }
  .vp-sidebar-prog-fill::after {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);
    animation:shimmer 2.4s ease-in-out infinite;
  }

  .vp-sidebar-stats {
    display: flex; gap: 8px; margin-top: 12px; position: relative;
  }
  .vp-sidebar-stat {
    flex: 1; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px; padding: 8px 10px; text-align: center;
  }
  .vp-sidebar-stat-val {
    font-size: 18px; font-weight: 800; color: #fff;
    font-family: var(--font-display); line-height: 1;
  }
  .vp-sidebar-stat-label {
    font-size: 9px; color: rgba(255,255,255,0.38); margin-top: 3px;
    text-transform: uppercase; letter-spacing: .08em; font-weight: 700;
    font-family: var(--font-display);
  }

  /* Certificate button inside sidebar */
  .vp-sidebar-cert-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 12px; padding: 9px 14px; border-radius: 10px;
    background: linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08));
    border: 1px solid rgba(201,168,76,0.35);
    cursor: pointer; width: 100%; position: relative;
    font-family: var(--font-display); font-size: 10.5px; font-weight: 700;
    letter-spacing: .08em; text-transform: uppercase; color: var(--gold);
    transition: all .18s; animation: certPop .5s ease both;
  }
  .vp-sidebar-cert-btn:hover { background: linear-gradient(135deg, rgba(201,168,76,0.28), rgba(201,168,76,0.14)); transform: translateY(-1px); }
  .vp-sidebar-cert-btn-icon { font-size: 16px; }

  .vp-list-label {
    padding: 11px 18px 4px;
    font-size: 9px; font-weight: 800; letter-spacing: .15em; text-transform: uppercase;
    color: var(--ink-4); font-family: var(--font-display); flex-shrink: 0;
  }

  .vp-lesson-list {
    overflow-y: auto; flex: 1;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
    padding: 4px 0 8px;
  }
  .vp-lesson-list::-webkit-scrollbar { width: 3px; }
  .vp-lesson-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  .vp-lesson-item {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 18px; cursor: pointer; transition: background .12s;
    border-left: 3px solid transparent; position: relative;
  }
  .vp-lesson-item:hover:not(.locked) { background: var(--surface); }
  .vp-lesson-item.active { background: var(--b50); border-left-color: var(--b600); }
  .vp-lesson-item.locked { cursor: not-allowed; opacity: .38; }

  .vp-lesson-num {
    font-size: 9.5px; font-weight: 800; color: var(--ink-5);
    min-width: 16px; text-align: center; font-family: var(--font-display);
  }
  .vp-lesson-item.active .vp-lesson-num { color: var(--b500); }

  .vp-lesson-dot {
    width: 24px; height: 24px; border-radius: 6px; background: var(--surface-2);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; flex-shrink: 0; color: var(--ink-4); transition: all .15s;
    border: 1px solid transparent;
  }
  .vp-lesson-item.active .vp-lesson-dot { background: var(--b100); color: var(--b600); border-color: var(--b200); }
  .vp-lesson-dot.ok   { background: var(--green-lt); color: var(--green); border-color: var(--green-mid); }
  .vp-lesson-dot.seen { background: var(--amber-lt); color: var(--amber); border-color: var(--amber-mid); }

  .vp-lesson-info { flex: 1; min-width: 0; }
  .vp-lesson-name {
    font-size: 12.5px; font-weight: 500; color: var(--ink-2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;
  }
  .vp-lesson-item.active .vp-lesson-name { color: var(--b700); font-weight: 600; }
  .vp-lesson-sub { font-size: 9.5px; color: var(--ink-4); margin-top: 2px; font-weight: 500; }
  .vp-lesson-sub.ok   { color: var(--green); }
  .vp-lesson-sub.seen { color: var(--amber); }

  /* ══ MAIN AREA ══ */
  .vp-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  .vp-content-row { flex: 1; display: flex; overflow: hidden; gap: 0; }

  /* ── Video Panel ── */
  .vp-video-panel {
    display: flex; flex-direction: column; overflow: hidden;
    flex: 0 0 58%; min-width: 0;
    border-right: 1px solid var(--border);
    background: var(--white);
  }

  .vp-video-header {
    padding: 14px 20px 12px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 12px; flex-shrink: 0; flex-wrap: wrap;
  }

  .vp-crumb {
    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
    font-size: 11px; color: var(--ink-4); margin-bottom: 5px;
  }
  .vp-crumb a { color: var(--ink-4); text-decoration: none; transition: color .14s; }
  .vp-crumb a:hover { color: var(--b600); }
  .vp-crumb-sep { opacity: .35; }

  .vp-title {
    font-family: var(--font-display);
    font-size: clamp(15px, 2vw, 22px); font-weight: 800;
    color: var(--ink); line-height: 1.2; letter-spacing: -.03em;
  }

  .vp-badges { display: flex; gap: 7px; padding-top: 2px; flex-shrink: 0; }
  .vp-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 100px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    font-family: var(--font-display);
  }
  .vp-badge-watched { background: var(--amber-lt); color: var(--amber); border: 1px solid var(--amber-mid); }
  .vp-badge-passed  { background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid); }

  /* ── Completion Banner ── */
  .vp-completion-banner {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap;
    background: linear-gradient(135deg, #0d1b2a 0%, #1a2744 100%);
    border: 1px solid rgba(201,168,76,0.35);
    border-radius: var(--r-lg);
    padding: 14px 18px;
    margin-bottom: 14px;
    animation: certPop .5s ease both;
    position: relative; overflow: hidden;
  }
  .vp-completion-banner::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 0% 50%, rgba(201,168,76,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .vp-completion-banner-left { display: flex; align-items: center; gap: 12px; }
  .vp-completion-banner-icon { font-size: 28px; flex-shrink: 0; }
  .vp-completion-banner-title {
    font-family: var(--font-display); font-size: 14px; font-weight: 800;
    color: var(--gold); letter-spacing: .02em; margin-bottom: 2px;
  }
  .vp-completion-banner-sub {
    font-size: 11.5px; color: rgba(255,255,255,0.5);
  }
  .vp-completion-banner-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: var(--r);
    background: var(--gold); color: #0d1b2a;
    font-family: var(--font-display); font-size: 11px; font-weight: 800;
    letter-spacing: .06em; text-transform: uppercase;
    cursor: pointer; border: none; transition: all .15s; flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(201,168,76,0.3);
  }
  .vp-completion-banner-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(201,168,76,0.4); }

  /* Video area */
  .vp-video-body {
    flex: 1; overflow-y: auto; padding: 16px 20px 20px;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .vp-video-body::-webkit-scrollbar { width: 4px; }
  .vp-video-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .vp-video-shell {
    position: relative; padding-bottom: 56.25%; height: 0;
    border-radius: var(--r-lg); overflow: hidden;
    background: #050f2b;
    box-shadow: 0 4px 28px rgba(5,15,43,0.16), 0 0 0 1px rgba(15,23,42,0.07);
    animation: fadeUp .4s ease both;
  }
  .vp-video-shell iframe { position:absolute; top:0; left:0; width:100%; height:100%; border:none; }

  .vp-video-placeholder {
    position: relative; padding-bottom: 56.25%; height: 0;
    border-radius: var(--r-lg); overflow: hidden;
    background: var(--surface); border: 1px solid var(--border);
    animation: fadeUp .4s ease both;
  }
  .vp-video-placeholder-in {
    position:absolute; inset:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
  }
  .vp-ph-icon {
    width:52px; height:52px; border-radius:13px;
    background:var(--surface-2); border:1px solid var(--border);
    display:flex; align-items:center; justify-content:center; font-size:20px;
    box-shadow:0 2px 8px rgba(15,23,42,0.06);
  }
  .vp-ph-text { font-size:13px; color:var(--ink-4); }
  .vp-spinner {
    width:26px; height:26px; border:2.5px solid var(--border); border-top-color:var(--b500);
    border-radius:50%; animation:spin .75s linear infinite;
  }

  .vp-actions {
    display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;
    animation: fadeUp .4s ease both .1s;
  }
  .vp-btn {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: var(--r);
    font-family: var(--font-display); font-size: 11px; font-weight: 700;
    cursor: pointer; border: none; transition: all .15s; white-space: nowrap;
    letter-spacing: .05em; text-transform: uppercase;
  }
  .vp-btn-primary {
    background: linear-gradient(135deg,var(--b500),var(--b700)); color: #fff;
    box-shadow: 0 3px 12px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .vp-btn-primary::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .vp-btn-primary:hover { box-shadow:0 6px 20px rgba(37,99,235,0.36); transform:translateY(-1px); }
  .vp-btn-outline {
    background: var(--white); color: var(--ink-2); border: 1px solid var(--border-2);
  }
  .vp-btn-outline:hover { background:var(--surface); border-color:var(--ink-4); }
  .vp-btn-success {
    background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid);
  }
  .vp-btn-success:hover { background:#dcfce7; }
  .vp-btn-ghost {
    background: transparent; color: var(--ink-3); border: 1px solid var(--border);
  }
  .vp-btn-ghost:hover { background:var(--white); border-color:var(--border-2); }
  .vp-btn-cert {
    background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.08));
    color: var(--gold); border: 1px solid rgba(201,168,76,0.4);
  }
  .vp-btn-cert:hover { background: rgba(201,168,76,0.22); }

  .vp-about-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); padding: 18px 20px; margin-top: 16px;
    animation: fadeUp .4s ease both .15s;
  }
  .vp-about-heading {
    font-size: 9px; font-weight: 800; letter-spacing:.15em; text-transform:uppercase;
    color: var(--ink-4); margin-bottom: 10px;
    display:flex; align-items:center; gap:8px; font-family:var(--font-display);
  }
  .vp-about-heading::before {
    content:''; display:block; width:3px; height:13px;
    background:linear-gradient(180deg,var(--b500),var(--b400)); border-radius:2px;
  }
  .vp-about-card p { color:var(--ink-2); line-height:1.8; font-size:13px; }
  .vp-hr { border:none; border-top:1px solid var(--border); margin:14px 0; }

  .vp-alert {
    display:flex; align-items:center; gap:8px;
    background:var(--rose-lt); border:1px solid var(--rose-mid);
    color:var(--rose); border-radius:var(--r);
    padding:10px 14px; font-size:12px; margin-bottom:14px;
    animation:fadeIn .3s ease;
  }

  .lc-emoji-picker {
    position: absolute; bottom: 56px; left: 0;
    background: var(--c-surface); border: 1px solid var(--c-border2);
    border-radius: var(--r-lg); padding: 10px;
    box-shadow: 0 8px 32px rgba(15,23,42,0.15);
    z-index: 50; width: 300px;
    animation: lc-fadeUp .18s ease both;
  }
  .lc-emoji-cats { display: flex; gap: 2px; margin-bottom: 8px; border-bottom: 1px solid var(--c-border); padding-bottom: 8px; }
  .lc-emoji-cat-btn { flex: 1; padding: 5px; border: none; background: none; cursor: pointer; font-size: 15px; border-radius: var(--r-sm); transition: background .12s; }
  .lc-emoji-cat-btn:hover, .lc-emoji-cat-btn.active { background: var(--c-surface2); }
  .lc-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; max-height: 180px; overflow-y: auto; scrollbar-width: thin; }
  .lc-emoji-btn { border: none; background: none; cursor: pointer; font-size: 20px; padding: 4px; border-radius: 6px; transition: background .1s; text-align: center; line-height: 1.4; }
  .lc-emoji-btn:hover { background: var(--c-surface2); }

  /* ── Chat Panel ── */
  .vp-chat-panel {
    flex: 1; min-width: 0; display: flex; flex-direction: column;
    overflow: hidden;
    background: var(--white);
    height: calc(100vh - var(--topbar-h) - 52px);
    max-height: calc(100vh - var(--topbar-h) - 52px);
  }

  /* ══ MOBILE OVERLAY ══ */
  .vp-overlay {
    display: none;
    position: fixed; inset: 0; z-index: 200;
    background: rgba(5,15,43,0.5);
    backdrop-filter: blur(2px);
    animation: overlayIn .2s ease;
  }
  .vp-overlay.open { display: block; }

  @media (max-width: 1024px) {
    :root { --sidebar-w: 248px; }
    .vp-video-panel { flex: 0 0 54%; }
    .vp-topstrip-title { max-width: 260px; }
  }

  @media (max-width: 820px) {
    .vp-body { height: auto; flex-direction: column; overflow: visible; }
    .vp-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      z-index: 300; width: 288px !important; min-width: 288px !important;
      transform: translateX(-100%);
      box-shadow: 4px 0 32px rgba(5,15,43,0.28);
      transition: transform .25s ease;
    }
    .vp-sidebar.open-mobile { transform: translateX(0); }
    .vp-sidebar.collapsed { width: 288px !important; min-width: 288px !important; }
    .vp-overlay { display: block; }
    .vp-overlay:not(.open) { display: none; }
    .vp-content-row { flex-direction: column; overflow: visible; height: auto; }
    .vp-video-panel  { flex: none; border-right: none; border-bottom: 1px solid var(--border); height: auto; }
    .vp-chat-panel   { flex: none; height: 520px; }
    .vp-video-body   { overflow: visible; }
    .vp-main { overflow: auto; }
    .vp-prog-pill { display: none; }
    .vp-topstrip-title { max-width: 180px; }
  }

  @media (max-width: 540px) {
    .vp-topstrip { padding: 0 12px; }
    .vp-topstrip-title { max-width: 130px; font-size: 12px; }
    .vp-topstrip-num { display: none; }
    .vp-video-header { padding: 12px 14px 10px; }
    .vp-title { font-size: 15px; }
    .vp-video-body { padding: 12px 14px 16px; }
    .vp-actions { gap: 6px; }
    .vp-btn { padding: 8px 12px; font-size: 10px; }
    .vp-chat-panel { height: 440px; }
  }

  @media (max-width: 380px) {
    .vp-actions { flex-direction: column; }
    .vp-btn { width: 100%; justify-content: center; }
    .vp-chat-panel { height: 380px; }
  }
`;

export default function VideoPlayer() {
  const { certificate, showModal, triggerCertificate, closeModal } = useCertificate();
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [course, setCourse] = useState(null);
  const [otpData, setOtpData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState("");
  const [watched, setWatched] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Track if we've already triggered the cert for this session to avoid re-firing
  const certTriggeredRef = useRef(false);

  const currentUser = useSelector((s) => s.auth.user);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [lessonId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setMobileSidebarOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  // ── Load lesson, lessons list, progress, and course title ──
  useEffect(() => {
    setLoading(true);
    setError("");
    setOtpData(null);
    certTriggeredRef.current = false;

    Promise.all([
      api.get(`/lessons/${lessonId}`),
      api.get(`/courses/${courseId}/lessons`),
      api.get(`/progress/${courseId}`).catch(() => ({ data: { data: { progress: null } } })),
      api.get(`/courses/${courseId}`).catch(() => ({ data: { data: { course: null } } })),
    ])
      .then(([l, ll, p, c]) => {
        setLesson(l.data.data?.lesson || l.data.lesson);
        setLessons(ll.data.data?.lessons || ll.data.lessons || []);
        setProgress(p.data.data?.progress || p.data.progress);
        setCourse(c.data.data?.course || c.data.course);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!lesson?.video?.vdoCipherId) return;
    setOtpData(null);
    setVideoLoading(true);
    api
      .get(`/lessons/${lessonId}/video-otp`)
      .then((r) => setOtpData(r.data.data || r.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load video"))
      .finally(() => setVideoLoading(false));
  }, [lesson, lessonId]);

  // ── Derived state ──
  const getLessonProgress = (lid) =>
    progress?.lessons?.find((l) => l.lesson?._id === lid || l.lesson === lid);

  const currentIndex = lessons.findIndex((l) => l._id === lessonId);
  const nextLesson = lessons[currentIndex + 1];
  const prevLesson = lessons[currentIndex - 1];
  const currentLessonProgress = getLessonProgress(lessonId);
  const isUserAdmin = currentUser?.role === "admin" || currentUser?.role === "instructor";
  const isWatched = isUserAdmin || watched || currentLessonProgress?.isWatched;
  const isPassed = isUserAdmin || currentLessonProgress?.examPassed;

  const completedCount = progress?.lessons?.filter((l) => l.examPassed).length || 0;
  const progressPct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  // ── Course completion: check after progress loads ──
  // Also fires when ExamPage navigates back here after passing the final exam.
  useEffect(() => {
    if (
      progressPct === 100 &&
      lessons.length > 0 &&
      currentUser &&
      course &&
      !certTriggeredRef.current
    ) {
      certTriggeredRef.current = true;
      triggerCertificate({
        courseId,
        studentName: currentUser.name,
        courseName: course.title,
        percentage: 100,
      });
    }
  }, [progressPct, lessons.length, currentUser, course, courseId, triggerCertificate]);

  // ── Mark lesson watched ──
  const handleMarkWatched = async () => {
    try {
      const res = await api.post(`/progress/${courseId}/lessons/${lessonId}/watch`);
      setWatched(true);

      // Refresh progress so completion check runs
      const p = await api.get(`/progress/${courseId}`).catch(() => null);
      if (p) setProgress(p.data.data?.progress || p.data.progress);
    } catch (err) {
      console.error("Mark watched error:", err);
    }
  };

  if (loading) return <LoadingCenter />;

  const handleSidebarToggle = () => {
    if (isMobile) setMobileSidebarOpen((v) => !v);
    else setSidebarCollapsed((v) => !v);
  };

  const sidebarCls = [
    "vp-sidebar",
    !isMobile && sidebarCollapsed ? "collapsed" : "",
    isMobile && mobileSidebarOpen ? "open-mobile" : "",
  ].filter(Boolean).join(" ");

  const isComplete = progressPct === 100 && lessons.length > 0;

  // ── Sidebar content ──
  const SidebarContent = (
    <>
      <div className="vp-sidebar-top">
        <div className="vp-sidebar-prog-label">
          <span>Progress</span>
          <em className={isComplete ? "complete" : ""}>{progressPct}%</em>
        </div>
        <div className="vp-sidebar-prog-track">
          <div
            className={`vp-sidebar-prog-fill${isComplete ? " complete" : ""}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="vp-sidebar-stats">
          <div className="vp-sidebar-stat">
            <div className="vp-sidebar-stat-val">{completedCount}</div>
            <div className="vp-sidebar-stat-label">Passed</div>
          </div>
          <div className="vp-sidebar-stat">
            <div className="vp-sidebar-stat-val">{lessons.length}</div>
            <div className="vp-sidebar-stat-label">Total</div>
          </div>
          <div className="vp-sidebar-stat">
            <div className="vp-sidebar-stat-val">{lessons.length - completedCount}</div>
            <div className="vp-sidebar-stat-label">Left</div>
          </div>
        </div>

        {/* Certificate button — only shown when course is complete */}
        {isComplete && certificate && (
          <button
            className="vp-sidebar-cert-btn"
            onClick={() => triggerCertificate({
              courseId,
              studentName: currentUser?.name,
              courseName: course?.title,
              percentage: 100,
            })}
          >
            <span className="vp-sidebar-cert-btn-icon">🎓</span>
            View Certificate
          </button>
        )}
      </div>

      <div className="vp-list-label">Lessons · {lessons.length}</div>

      <div className="vp-lesson-list">
        {lessons.map((l, i) => {
          const lp = getLessonProgress(l._id);
          const isActive = l._id === lessonId;
          const isAdmin = currentUser?.role === "admin" || currentUser?.role === "instructor";
          const isLocked = !isAdmin && !l.isFreePreview && !lp?.isUnlocked;
          const dotClass = lp?.examPassed ? "ok" : lp?.isWatched ? "seen" : "";
          const icon = lp?.examPassed ? "✓" : lp?.isWatched ? "◉" : isLocked ? "⊘" : "▷";
          const subLabel = lp?.examPassed ? "Passed" : lp?.isWatched ? "Watched" : isLocked ? "Locked" : "Available";
          return (
            <div
              key={l._id}
              className={`vp-lesson-item${isActive ? " active" : ""}${isLocked ? " locked" : ""}`}
              onClick={() => {
                if (!isLocked) {
                  navigate(`/learn/${courseId}/lesson/${l._id}`);
                  setMobileSidebarOpen(false);
                }
              }}
            >
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

        {/* ── Top strip ── */}
        <div className="vp-topstrip">
          <button
            className="vp-toggle-sidebar-btn"
            onClick={handleSidebarToggle}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Show lessons" : "Hide lessons"}
          >
            <svg viewBox="0 0 16 16">
              {sidebarCollapsed || (isMobile && !mobileSidebarOpen) ? (
                <path d="M2 4h12v1.5H2V4zm0 3.25h12v1.5H2v-1.5zm0 3.25h12v1.5H2v-1.5z" />
              ) : (
                <path d="M6 2h1.5v12H6V2zm-4 0h2.5v1.5H2V2zm0 3.25h2.5v1.5H2v-1.5zm0 3.25h2.5v1.5H2v-1.5zm0 3.25h2.5V13H2v-1.25zM8.5 2H14v1.5H8.5V2zm0 3.25H14v1.5H8.5v-1.5zm0 3.25H14v1.5H8.5v-1.5zm0 3.25H14V13H8.5v-1.25z" />
              )}
            </svg>
          </button>

          <Link to={`/courses/${courseId}`} className="vp-topstrip-back">
            ← Course
          </Link>
          <div className="vp-topstrip-divider" />

          <div className="vp-topstrip-lesson-info">
            <div className="vp-topstrip-num">Lesson {currentIndex + 1}</div>
            <div className="vp-topstrip-title">{lesson?.title}</div>
          </div>

          <div className="vp-topstrip-right">
            <div className="vp-prog-pill">
              <div className="vp-prog-pill-track">
                <div
                  className={`vp-prog-pill-fill${isComplete ? " complete" : ""}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className={`vp-prog-pill-label${isComplete ? " complete" : ""}`}>
                {isComplete ? "🎓 Complete!" : `${progressPct}% done`}
              </span>
            </div>

            {/* Certificate badge in topstrip when complete */}
            {isComplete && certificate && (
              <button
                className="vp-topstrip-badge vp-badge-cert"
                onClick={() => triggerCertificate({
                  courseId,
                  studentName: currentUser?.name,
                  courseName: course?.title,
                  percentage: 100,
                })}
              >
                🎓 Certificate
              </button>
            )}

            {isWatched && !isPassed && (
              <span className="vp-topstrip-badge vp-badge-watched">Watched</span>
            )}
            {isPassed && (
              <span className="vp-topstrip-badge vp-badge-passed">✓ Passed</span>
            )}
          </div>
        </div>

        {/* ── Mobile overlay ── */}
        <div
          className={`vp-overlay${mobileSidebarOpen ? " open" : ""}`}
          onClick={() => setMobileSidebarOpen(false)}
        />

        {/* ── Body ── */}
        <div className="vp-body">
          <div className={sidebarCls}>{SidebarContent}</div>

          <div className="vp-main">
            <div className="vp-content-row">

              {/* ── Video Panel ── */}
              <div className="vp-video-panel">
                <div className="vp-video-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="vp-crumb">
                      <Link to={`/courses/${courseId}`}>Course</Link>
                      <span className="vp-crumb-sep">›</span>
                      <span>Lesson {currentIndex + 1}</span>
                      <span className="vp-crumb-sep">›</span>
                      <span style={{ color: "var(--ink-2)" }}>{lesson?.title}</span>
                    </div>
                    <h1 className="vp-title">{lesson?.title}</h1>
                  </div>
                  <div className="vp-badges">
                    {isWatched && !isPassed && (
                      <span className="vp-badge vp-badge-watched">Watched</span>
                    )}
                    {isPassed && (
                      <span className="vp-badge vp-badge-passed">✓ Passed</span>
                    )}
                  </div>
                </div>

                <div className="vp-video-body">
                  {error && (
                    <div className="vp-alert"><span>⚠</span> {error}</div>
                  )}

                  {/* ── Course completion banner ── */}
                  {isComplete && (
                    <div className="vp-completion-banner">
                      <div className="vp-completion-banner-left">
                        <span className="vp-completion-banner-icon">🏆</span>
                        <div>
                          <div className="vp-completion-banner-title">
                            Course Complete — Congratulations!
                          </div>
                          <div className="vp-completion-banner-sub">
                            You've passed all lessons in{" "}
                            <strong style={{ color: "rgba(255,255,255,0.75)" }}>
                              {course?.title}
                            </strong>
                          </div>
                        </div>
                      </div>
                      <button
                        className="vp-completion-banner-btn"
                        onClick={() => triggerCertificate({
                          courseId,
                          studentName: currentUser?.name,
                          courseName: course?.title,
                          percentage: 100,
                        })}
                      >
                        🎓 View Certificate
                      </button>
                    </div>
                  )}

                  {otpData?.otp && otpData?.playbackInfo ? (
                    <div className="vp-video-shell">
                      <iframe
                        ref={iframeRef}
                        title={lesson?.title}
                        src={`https://player.vdocipher.com/v2/?otp=${otpData.otp}&playbackInfo=${otpData.playbackInfo}`}
                        allowFullScreen
                        allow="encrypted-media"
                      />
                    </div>
                  ) : (
                    <div className="vp-video-placeholder">
                      <div className="vp-video-placeholder-in">
                        {videoLoading ? (
                          <>
                            <div className="vp-spinner" />
                            <span className="vp-ph-text">Loading video…</span>
                          </>
                        ) : (
                          <>
                            <div className="vp-ph-icon">🎬</div>
                            <span className="vp-ph-text">
                              {error ? "Video unavailable" : "No video attached"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="vp-actions">
                    {prevLesson && (
                      <button
                        className="vp-btn vp-btn-ghost"
                        onClick={() => navigate(`/learn/${courseId}/lesson/${prevLesson._id}`)}
                      >
                        ← Prev
                      </button>
                    )}
                    {!isWatched && (
                      <button
                        className="vp-btn vp-btn-outline"
                        onClick={handleMarkWatched}
                      >
                        ✓ Mark Watched
                      </button>
                    )}
                    {isWatched && !isPassed && (
                      <button
                        className="vp-btn vp-btn-primary"
                        onClick={() => navigate(`/learn/${courseId}/lesson/${lessonId}/exam`)}
                      >
                        Take Exam →
                      </button>
                    )}
                    {isPassed && nextLesson && (
                      <button
                        className="vp-btn vp-btn-success"
                        onClick={() => navigate(`/learn/${courseId}/lesson/${nextLesson._id}`)}
                      >
                        Next Lesson →
                      </button>
                    )}
                    {isComplete && certificate && (
                      <button
                        className="vp-btn vp-btn-cert"
                        onClick={() => triggerCertificate({
                          courseId,
                          studentName: currentUser?.name,
                          courseName: course?.title,
                          percentage: 100,
                        })}
                      >
                        🎓 View Certificate
                      </button>
                    )}
                  </div>

                  <div className="vp-about-card">
                    <div className="vp-about-heading">About this lesson</div>
                    <p>{lesson?.description}</p>
                    {lesson?.notes && (
                      <>
                        <div className="vp-hr" />
                        <div className="vp-about-heading">Notes</div>
                        <p style={{ whiteSpace: "pre-wrap" }}>{lesson.notes}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Chat Panel ── */}
              <div className="vp-chat-panel">
                <LessonChat
                  courseId={courseId}
                  lessonId={lessonId}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Certificate Modal (renders on top of everything) ── */}
      {showModal && certificate && (
        <CertificateModal certificate={certificate} onClose={closeModal} />
      )}
    </>
  );
}
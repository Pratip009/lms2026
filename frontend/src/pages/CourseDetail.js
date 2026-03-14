import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { LoadingCenter, Alert } from '../components/common';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  :root {
    /* Blues */
    --b50:  #e8f0fe;
    --b100: #c5d8fc;
    --b200: #93b8fa;
    --b300: #5c94f5;
    --b400: #4285f4;
    --b500: #1a6bf0;
    --b600: #1558d0;
    --b800: #0a3580;
    --b900: #061e54;
    --hero-bg: #050f2b;

    /* Light surfaces */
    --white:     #ffffff;
    --surface:   #f8f8f6;
    --surface-2: #f2f1ee;
    --border:    #e5e3de;
    --border-2:  #d6d3cc;
    --ink:       #111110;
    --ink-2:     #3d3c39;
    --ink-3:     #6e6b64;
    --ink-4:     #a09d95;
    --ink-5:     #ccc9c1;

    --green:     #16a34a;
    --green-lt:  #f0fdf4;
    --green-mid: #bbf7d0;
    --amber:     #b45309;
    --amber-lt:  #fffbeb;
    --amber-mid: #fde68a;
    --danger:    #be123c;
    --danger-lt: #fff1f3;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 20px;
    --shadow-sm: 0 2px 8px rgba(17,17,16,0.07);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.12);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cd {
    font-family: var(--font-body);
    color: var(--ink);
    min-height: 100vh;
    background: var(--white);
    -webkit-font-smoothing: antialiased;
  }

  /* ════════════════════════════════
     KEYFRAMES
  ════════════════════════════════ */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes gradShift {
    0%,100% { background-position: 0%   50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes shimmerSlide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%);  }
  }
  @keyframes blink {
    0%,100% { opacity: 1;  }
    50%      { opacity: .3; }
  }

  .cd-anim-1 { animation: fadeUp .45s ease both; }
  .cd-anim-2 { animation: fadeUp .45s .08s ease both; }
  .cd-anim-3 { animation: fadeUp .45s .16s ease both; }
  .cd-anim-4 { animation: fadeUp .45s .22s ease both; }

  /* ════════════════════════════════
     ERROR ALERT
  ════════════════════════════════ */
  .cd-alert {
    max-width: 1280px; margin: 0 auto;
    padding: 12px 64px;
    font-size: 13.5px; color: var(--danger);
    background: var(--danger-lt); border-bottom: 1px solid #fecdd3;
    display: flex; align-items: center; gap: 9px;
  }

  /* ════════════════════════════════
     HERO — dark blue banner
  ════════════════════════════════ */
  .cd-hero {
    background: var(--hero-bg);
    position: relative;
    overflow: hidden;
  }
  /* grid texture */
  .cd-hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(66,133,244,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(66,133,244,.05) 1px, transparent 1px);
    background-size: 52px 52px;
    pointer-events: none;
  }
  /* radial glow */
  .cd-hero::after {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 55% 80% at 0% 50%, rgba(66,133,244,.15) 0%, transparent 55%),
      radial-gradient(ellipse 40% 60% at 100% 30%, rgba(21,88,208,.12) 0%, transparent 50%);
    pointer-events: none;
  }

  .cd-hero-inner {
    position: relative; z-index: 2;
    max-width: 1280px; margin: 0 auto;
    padding: 0 64px;
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 0; align-items: end;
  }

  /* ── Hero Left ── */
  .cd-hero-content { padding: 44px 56px 44px 0; }

  /* Breadcrumb */
  .cd-nav {
    display: flex; align-items: center; gap: 6px;
    font-size: 12.5px; color: rgba(255,255,255,.28);
    margin-bottom: 22px; flex-wrap: wrap;
  }
  .cd-nav-btn {
    color: rgba(255,255,255,.28); cursor: pointer;
    background: none; border: none; font: inherit; padding: 0;
    display: flex; align-items: center; gap: 5px;
    transition: color .15s;
  }
  .cd-nav-btn:hover { color: var(--b200); }
  .cd-nav-sep     { color: rgba(255,255,255,.15); }
  .cd-nav-current { color: rgba(255,255,255,.35); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Tags */
  .cd-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .cd-tag {
    font-family: var(--font-display);
    font-size: 10.5px; font-weight: 700; letter-spacing: .07em;
    padding: 4px 10px; border-radius: 6px; text-transform: uppercase;
  }
  .cd-tag-bestseller { background: rgba(254,243,199,.15); color: #fcd34d; border: 1px solid rgba(252,211,77,.2); }
  .cd-tag-new        { background: rgba(220,252,231,.12); color: #6ee7b7; border: 1px solid rgba(110,231,183,.2); }
  .cd-tag-admin      { background: rgba(237,233,254,.12); color: #c4b5fd; border: 1px solid rgba(196,181,253,.2); }

  /* Title */
  .cd-hero-title {
    font-family: var(--font-display);
    font-size: clamp(26px, 3vw, 44px);
    font-weight: 800; letter-spacing: -.035em; line-height: .96;
    color: var(--white); margin-bottom: 16px;
  }
  .cd-hero-title-grad {
    display: block;
    background: linear-gradient(100deg, var(--b100) 0%, var(--b300) 50%, var(--b200) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradShift 5s ease-in-out infinite;
  }

  .cd-hero-sub {
    font-size: 15px; font-weight: 300; font-style: italic;
    color: rgba(255,255,255,.38);
    line-height: 1.8; margin-bottom: 28px; max-width: 540px;
  }

  /* Meta row */
  .cd-hero-meta {
    display: flex; flex-wrap: wrap; align-items: center; gap: 20px;
    font-size: 13px; color: rgba(255,255,255,.35);
  }
  .cd-hero-meta-item { display: flex; align-items: center; gap: 6px; }
  .cd-hero-meta-item strong { color: rgba(255,255,255,.7); font-weight: 500; font-family: var(--font-display); }
  .cd-stars { display: flex; align-items: center; gap: 2px; }
  .cd-star { color: #fbbf24; font-size: 12px; }
  .cd-rating-num { color: #fbbf24; font-weight: 600; font-size: 13px; margin-left: 4px; font-family: var(--font-display); }

  /* ── Hero Right: thumbnail ── */
  .cd-hero-thumb-col {
    display: flex; align-items: flex-end; justify-content: center;
    border-left: 1px solid rgba(66,133,244,.1);
    padding: 32px 0 0 40px;
  }
  .cd-hero-thumb {
    width: 100%; aspect-ratio: 16/10;
    border-radius: var(--r-lg) var(--r-lg) 0 0;
    overflow: hidden;
    position: relative;
    box-shadow: 0 -12px 40px rgba(0,0,0,.4);
    border: 1px solid rgba(66,133,244,.15);
    border-bottom: none;
  }
  .cd-hero-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-hero-thumb-ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 60px;
    background: linear-gradient(135deg, rgba(66,133,244,.2), rgba(21,88,208,.15));
  }
  .cd-play-btn {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(255,255,255,.95); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--b600);
    box-shadow: 0 6px 24px rgba(0,0,0,.35);
    transition: transform .2s, background .2s, box-shadow .2s;
  }
  .cd-play-btn:hover {
    transform: translate(-50%,-50%) scale(1.1);
    background: var(--white);
    box-shadow: 0 8px 32px rgba(66,133,244,.4);
  }

  /* Gradient fade hero→body */
  .cd-hero-fade {
    height: 28px;
    background: linear-gradient(to bottom, var(--hero-bg), var(--white));
  }

  /* ════════════════════════════════
     BODY  — two-column grid
  ════════════════════════════════ */
  .cd-body {
    max-width: 1280px; margin: 0 auto;
    padding: 28px 64px 96px;
    display: grid;
    grid-template-columns: 1fr 368px;
    gap: 40px; align-items: start;
  }

  /* ── Section wrapper ── */
  .cd-section { margin-bottom: 36px; }
  .cd-section-title {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 800; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.1;
    margin-bottom: 18px; padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }
  .cd-desc-text {
    font-size: 14.5px; color: var(--ink-3);
    line-height: 1.85; font-weight: 300;
  }

  /* ── What you'll learn ── */
  .cd-learn-box {
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 26px 28px;
    background: var(--surface);
    position: relative; overflow: hidden;
  }
  .cd-learn-box::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--b500), var(--b300));
  }
  .cd-learn-box-title {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 800; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 20px;
  }
  .cd-learn-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 11px 32px;
  }
  .cd-learn-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13.5px; color: var(--ink-3); line-height: 1.55;
  }
  .cd-learn-check {
    flex-shrink: 0; margin-top: 1px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--green-lt); border: 1.5px solid var(--green-mid);
    display: flex; align-items: center; justify-content: center;
    color: var(--green); font-size: 10px; font-weight: 700;
  }

  /* ── Curriculum ── */
  .cd-curriculum {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }
  .cd-curriculum-head {
    padding: 14px 22px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .cd-curriculum-head-title {
    font-family: var(--font-display);
    font-size: 13.5px; font-weight: 700; color: var(--ink);
    letter-spacing: -.01em;
  }
  .cd-curriculum-head-meta {
    font-size: 12.5px; color: var(--ink-4); font-weight: 400;
  }

  .cd-lesson {
    display: flex; align-items: center; gap: 13px;
    padding: 12px 22px; border-bottom: 1px solid var(--border);
    transition: background .14s; cursor: default;
  }
  .cd-lesson:last-child { border-bottom: none; }
  .cd-lesson:hover { background: var(--surface); }

  .cd-lesson-num {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--surface-2); border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 10.5px; font-weight: 700; color: var(--ink-4); flex-shrink: 0;
    transition: background .14s, border-color .14s;
  }
  .cd-lesson-num-done {
    background: var(--green-lt); border-color: var(--green-mid); color: var(--green);
  }

  .cd-lesson-icon {
    width: 28px; height: 28px; border-radius: var(--r);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 11px;
  }
  .cd-lesson-icon-locked { background: var(--surface-2); color: var(--ink-5); }
  .cd-lesson-icon-free   { background: var(--b50); color: var(--b500); }
  .cd-lesson-icon-admin  { background: #ede9fe; color: #6d28d9; }

  .cd-lesson-info { flex: 1; min-width: 0; }
  .cd-lesson-title {
    font-size: 13.5px; font-weight: 500; color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;
    font-family: var(--font-body);
  }
  .cd-lesson-sub { font-size: 11.5px; color: var(--ink-5); margin-top: 2px; }

  .cd-progress-bar-wrap {
    height: 2px; background: var(--border); border-radius: 2px; margin-top: 5px;
  }
  .cd-progress-bar { height: 100%; background: var(--green); border-radius: 2px; }

  .cd-lesson-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cd-preview-badge {
    font-family: var(--font-display);
    font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 5px;
    background: var(--b50); color: var(--b500); border: 1px solid var(--b100);
  }
  .cd-admin-badge {
    font-family: var(--font-display);
    font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 5px;
    background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe;
  }
  .cd-lesson-dur { font-size: 12px; color: var(--ink-5); font-weight: 400; }

  /* ════════════════════════════════
     PURCHASE CARD  — right sticky
  ════════════════════════════════ */
  .cd-body-right { position: sticky; top: 24px; }

  .cd-price-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: box-shadow .2s;
  }
  .cd-price-card:hover {
    box-shadow: 0 12px 40px rgba(66,133,244,.1), 0 4px 12px rgba(17,17,16,.07);
  }

  /* Thumbnail inside card (mobile / tablet) */
  .cd-card-thumb {
    display: none; width: 100%; aspect-ratio: 16/9; overflow: hidden;
    position: relative;
  }
  .cd-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-card-thumb-ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 44px;
    background: linear-gradient(135deg, rgba(66,133,244,.15), rgba(21,88,208,.1));
  }

  /* Blue accent strip at top of card */
  .cd-card-strip {
    height: 4px;
    background: linear-gradient(90deg, var(--b500), var(--b300));
    position: relative; overflow: hidden;
  }
  .cd-card-strip::after {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 35%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
    animation: shimmerSlide 3s ease-in-out infinite;
  }

  .cd-card-body { padding: 24px 24px 26px; }

  /* Price row */
  .cd-card-price-row {
    display: flex; align-items: baseline; gap: 10px;
    flex-wrap: wrap; margin-bottom: 18px;
  }
  .cd-card-price {
    font-family: var(--font-display);
    font-size: 34px; font-weight: 800; color: var(--ink); letter-spacing: -.03em; line-height: 1;
  }
  .cd-card-price-orig {
    font-size: 15px; color: var(--ink-5); text-decoration: line-through;
    font-family: var(--font-body);
  }
  .cd-discount-badge {
    font-family: var(--font-display);
    font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 6px;
    background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid);
  }

  /* Timer */
  .cd-timer {
    display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; font-weight: 500; color: var(--amber);
    background: var(--amber-lt); border: 1px solid var(--amber-mid);
    border-radius: var(--r); padding: 9px 13px; margin-bottom: 18px;
    font-family: var(--font-body);
  }

  /* Admin banner */
  .cd-admin-access {
    display: flex; align-items: center; gap: 10px;
    background: #f5f3ff; border: 1px solid #ddd6fe;
    border-radius: var(--r); padding: 12px 14px;
    margin-bottom: 16px;
    font-size: 13px; color: #6d28d9; font-weight: 500;
    font-family: var(--font-body);
  }

  /* Buttons */
  .cd-btn-enroll {
    width: 100%; padding: 15px 20px; border-radius: var(--r); border: none;
    background: var(--b500); color: white; cursor: pointer;
    font-family: var(--font-display); font-size: 14px; font-weight: 700;
    letter-spacing: .04em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    position: relative; overflow: hidden;
    box-shadow: 0 6px 24px rgba(26,107,240,.3);
    transition: background .18s, transform .14s, box-shadow .2s;
    margin-bottom: 10px;
  }
  .cd-btn-enroll::after {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 35%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
    animation: shimmerSlide 3s ease-in-out infinite 1s;
  }
  .cd-btn-enroll:hover:not(:disabled) {
    background: var(--b600);
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(26,107,240,.42);
  }
  .cd-btn-enroll:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  .cd-btn-continue {
    width: 100%; padding: 15px 20px; border-radius: var(--r); border: none;
    background: var(--green); color: white; cursor: pointer;
    font-family: var(--font-display); font-size: 14px; font-weight: 700;
    letter-spacing: .04em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(22,163,74,.25);
    transition: background .18s, transform .14s;
    margin-bottom: 10px;
  }
  .cd-btn-continue:hover { background: #15803d; transform: translateY(-2px); }

  .cd-btn-admin {
    width: 100%; padding: 15px 20px; border-radius: var(--r); border: none;
    background: #7c3aed; color: white; cursor: pointer;
    font-family: var(--font-display); font-size: 14px; font-weight: 700;
    letter-spacing: .04em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(124,58,237,.25);
    transition: background .18s, transform .14s;
    margin-bottom: 10px;
  }
  .cd-btn-admin:hover { background: #6d28d9; transform: translateY(-2px); }

  .cd-btn-wishlist {
    width: 100%; padding: 12px 20px; border-radius: var(--r);
    border: 1.5px solid var(--border); background: transparent; color: var(--ink-3);
    font-family: var(--font-body); font-size: 14px; font-weight: 400; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: border-color .14s, color .14s, background .14s;
    margin-bottom: 20px;
  }
  .cd-btn-wishlist:hover { border-color: var(--border-2); color: var(--ink); background: var(--surface); }

  .cd-card-divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }

  .cd-includes-title {
    font-family: var(--font-display);
    font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: var(--ink-4); margin-bottom: 14px;
  }
  .cd-includes-list { display: flex; flex-direction: column; gap: 10px; }
  .cd-include-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: var(--ink-3); font-family: var(--font-body);
  }
  .cd-include-icon {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--b50); border: 1px solid var(--b100);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .cd-include-icon svg { color: var(--b500); }

  /* Mobile thumbnail */
  .cd-mobile-thumb {
    display: none; width: 100%; aspect-ratio: 16/9;
    border-radius: var(--r-lg); overflow: hidden; margin-bottom: 28px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border);
  }
  .cd-mobile-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-mobile-thumb-ph {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    font-size: 52px;
    background: linear-gradient(135deg, rgba(66,133,244,.12), rgba(21,88,208,.08));
  }

  /* ════════════════════════════════
     RESPONSIVE
  ════════════════════════════════ */
  @media (max-width: 960px) {
    .cd-hero-inner { grid-template-columns: 1fr; padding: 0 40px; }
    .cd-hero-thumb-col { display: none; }
    .cd-hero-content { padding: 40px 0 36px; }
    .cd-body { grid-template-columns: 1fr; padding: 24px 40px 64px; }
    .cd-body-right { order: -1; }
    .cd-card-thumb { display: block; }
    .cd-mobile-thumb { display: block; }
  }
  @media (max-width: 640px) {
    .cd-hero-inner, .cd-body { padding-left: 20px; padding-right: 20px; }
    .cd-learn-grid { grid-template-columns: 1fr; }
    .cd-alert { padding: 12px 20px; }
  }
`;

/* ── Include items config ── */
const INCLUDES = [
  {
    icon: (
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
        viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    label: (totalHours, totalLessons) =>
      `${totalHours > 0 ? totalHours + 'h' : totalLessons + ' lessons'} of on-demand video`,
  },
  {
    icon: (
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
        viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    label: () => 'Downloadable resources',
  },
  {
    icon: (
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
        viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    ),
    label: () => 'Access on mobile & desktop',
  },
  {
    icon: (
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
        viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
    label: () => 'Certificate of completion',
  },
  {
    icon: (
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
        viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    label: () => 'Full lifetime access',
  },
];

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user }  = useSelector(s => s.auth);
  const [course, setCourse]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying]   = useState(false);
  const [error, setError]     = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'instructor';

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data.course))
      .catch(() => setError('Course not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!user) { navigate('/login'); return; }
    setBuying(true);
    try {
      const res = await api.post('/orders/checkout', { courseId: id });
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setBuying(false);
    }
  };

  const handleStartLearning = () => {
    const first = course.lessons?.[0];
    if (first) navigate(`/learn/${id}/lesson/${first._id}`);
  };

  if (loading) return <LoadingCenter />;
  if (!course) return (
    <div className="cd">
      <style>{css}</style>
      <div style={{ padding: 32 }}><Alert type="error">Course not found.</Alert></div>
    </div>
  );

  const price      = course.discountPrice > 0 ? course.discountPrice : course.price;
  const savePct    = course.discountPrice > 0 ? Math.round((1 - course.discountPrice / course.price) * 100) : null;
  const totalHours = Math.round((course.totalDuration || 0) / 60);

  /* Split title into first word(s) + rest for gradient treatment */
  const titleWords = course.title?.split(' ') || [];
  const titleFirst = titleWords.slice(0, Math.ceil(titleWords.length / 2)).join(' ');
  const titleRest  = titleWords.slice(Math.ceil(titleWords.length / 2)).join(' ');

  return (
    <div className="cd">
      <style>{css}</style>

      {error && (
        <div className="cd-alert">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
        </div>
      )}

      {/* ════════ HERO ════════ */}
      <div className="cd-hero">
        <div className="cd-hero-inner">

          {/* Left */}
          <div className="cd-hero-content cd-anim-1">

            <nav className="cd-nav">
              <button className="cd-nav-btn" onClick={() => navigate(-1)}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Courses
              </button>
              {course.category && (
                <><span className="cd-nav-sep">›</span><span className="cd-nav-current">{course.category}</span></>
              )}
              <span className="cd-nav-sep">›</span>
              <span className="cd-nav-current">{course.title}</span>
            </nav>

            {(course.isBestseller || course.isNew || isAdmin) && (
              <div className="cd-hero-tags">
                {course.isBestseller && <span className="cd-tag cd-tag-bestseller">Bestseller</span>}
                {course.isNew        && <span className="cd-tag cd-tag-new">New</span>}
                {isAdmin             && <span className="cd-tag cd-tag-admin">Admin Access</span>}
              </div>
            )}

            <h1 className="cd-hero-title">
              {titleFirst}
              {titleRest && (
                <span className="cd-hero-title-grad"> {titleRest}</span>
              )}
            </h1>

            <p className="cd-hero-sub">
              {course.shortDescription || course.description?.slice(0, 180)}
            </p>

            <div className="cd-hero-meta">
              <div className="cd-hero-meta-item cd-stars">
                {[1,2,3,4,5].map(s => <span key={s} className="cd-star">★</span>)}
                <span className="cd-rating-num">4.8</span>
              </div>
              {course.instructor?.name && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <strong>{course.instructor.name}</strong>
                </div>
              )}
              {course.totalLessons > 0 && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <strong>{course.totalLessons}</strong> lessons
                </div>
              )}
              {totalHours > 0 && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <strong>{totalHours}h</strong> total
                </div>
              )}
              {course.level && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                  <strong>{course.level}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Right: thumbnail */}
          <div className="cd-hero-thumb-col cd-anim-2">
            <div className="cd-hero-thumb">
              {course.thumbnail?.url
                ? <img src={course.thumbnail.url} alt={course.title} />
                : <div className="cd-hero-thumb-ph">📚</div>}
              <button className="cd-play-btn" aria-label="Preview">
                <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dark → light fade */}
      <div className="cd-hero-fade" />

      {/* ════════ BODY ════════ */}
      <div className="cd-body">

        {/* ── Left column ── */}
        <div>
          {/* Mobile thumbnail */}
          <div className="cd-mobile-thumb cd-anim-3">
            {course.thumbnail?.url
              ? <img src={course.thumbnail.url} alt={course.title} />
              : <div className="cd-mobile-thumb-ph">📚</div>}
          </div>

          {/* What you'll learn */}
          {course.whatYouWillLearn?.length > 0 && (
            <div className="cd-section cd-anim-3">
              <div className="cd-learn-box">
                <div className="cd-learn-box-title">What you'll learn</div>
                <div className="cd-learn-grid">
                  {course.whatYouWillLearn.map((item, i) => (
                    <div key={i} className="cd-learn-item">
                      <div className="cd-learn-check">✓</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="cd-section cd-anim-4">
            <div className="cd-section-title">Course description</div>
            <p className="cd-desc-text">{course.description}</p>
          </div>

          {/* Curriculum */}
          {course.lessons?.length > 0 && (
            <div className="cd-section cd-anim-4">
              <div className="cd-section-title">Course content</div>
              <div className="cd-curriculum">
                <div className="cd-curriculum-head">
                  <span className="cd-curriculum-head-title">
                    {course.lessons.length} lesson{course.lessons.length !== 1 ? 's' : ''}
                  </span>
                  {totalHours > 0 && (
                    <span className="cd-curriculum-head-meta">{totalHours}h total</span>
                  )}
                </div>
                {course.lessons.map((lesson, i) => {
                  const mins = Math.round((lesson.video?.duration || 0) / 60);
                  const iconCls = isAdmin
                    ? 'cd-lesson-icon-admin'
                    : lesson.isFreePreview
                      ? 'cd-lesson-icon-free'
                      : 'cd-lesson-icon-locked';

                  return (
                    <div key={lesson._id} className="cd-lesson">
                      <div className={`cd-lesson-num ${lesson.completed ? 'cd-lesson-num-done' : ''}`}>
                        {lesson.completed ? '✓' : i + 1}
                      </div>

                      <div className={`cd-lesson-icon ${iconCls}`}>
                        {isAdmin ? (
                          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4zm-1 13l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
                          </svg>
                        ) : lesson.isFreePreview ? (
                          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        )}
                      </div>

                      <div className="cd-lesson-info">
                        <div className="cd-lesson-title">{lesson.title}</div>
                        {lesson.completed && (
                          <div className="cd-progress-bar-wrap">
                            <div className="cd-progress-bar" style={{ width: '100%' }} />
                          </div>
                        )}
                      </div>

                      <div className="cd-lesson-right">
                        {isAdmin
                          ? <span className="cd-admin-badge">Admin</span>
                          : lesson.isFreePreview
                            ? <span className="cd-preview-badge">Preview</span>
                            : null}
                        {mins > 0 && <span className="cd-lesson-dur">{mins}m</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: purchase card ── */}
        <div className="cd-body-right cd-anim-2">
          <div className="cd-price-card">

            {/* Tablet/mobile thumbnail inside card */}
            <div className="cd-card-thumb">
              {course.thumbnail?.url
                ? <img src={course.thumbnail.url} alt={course.title} />
                : <div className="cd-card-thumb-ph">📚</div>}
            </div>

            {/* Blue shimmer strip */}
            <div className="cd-card-strip" />

            <div className="cd-card-body">

              {/* ── ADMIN bypass ── */}
              {isAdmin ? (
                <>
                  <div className="cd-admin-access">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4zm-1 13l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
                    </svg>
                    Admin access — no payment required
                  </div>
                  <button className="cd-btn-admin" onClick={handleStartLearning}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Go to course
                  </button>
                </>
              ) : (
                /* ── STUDENT flow ── */
                <>
                  <div className="cd-card-price-row">
                    <span className="cd-card-price">${price}</span>
                    {course.discountPrice > 0 && (
                      <>
                        <span className="cd-card-price-orig">${course.price}</span>
                        <span className="cd-discount-badge">{savePct}% off</span>
                      </>
                    )}
                  </div>

                  {course.discountPrice > 0 && (
                    <div className="cd-timer">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                      </svg>
                      <span><strong>2 days</strong> left at this price</span>
                    </div>
                  )}

                  {course.isEnrolled ? (
                    <button className="cd-btn-continue" onClick={handleStartLearning}>
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Go to course
                    </button>
                  ) : (
                    <>
                      <button className="cd-btn-enroll" onClick={handleBuy} disabled={buying}>
                        {buying ? (
                          <>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                              style={{ animation: 'spin .8s linear infinite' }}>
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                            Processing…
                          </>
                        ) : 'Enroll now'}
                      </button>
                      <button className="cd-btn-wishlist">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        Add to wishlist
                      </button>
                    </>
                  )}
                </>
              )}

              <hr className="cd-card-divider" />

              <div className="cd-includes-title">This course includes</div>
              <div className="cd-includes-list">
                {INCLUDES.map((inc, i) => (
                  <div key={i} className="cd-include-item">
                    <div className="cd-include-icon">{inc.icon}</div>
                    <span>{inc.label(totalHours, course.totalLessons)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
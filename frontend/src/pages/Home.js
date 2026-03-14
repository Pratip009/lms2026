import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoadingCenter } from '../components/common';

/* ── Real Unsplash images ─────────────────────────────────────────────── */
const STUDENT_IMG =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85&auto=format&fit=crop';
const STUDENT_IMG_2 =
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=400&q=80&auto=format&fit=crop';
const AV_1 =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&auto=format&fit=crop&crop=face';
const AV_2 =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&auto=format&fit=crop&crop=face';
const AV_3 =
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80&auto=format&fit=crop&crop=face';

const styles = `
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

    /* Light surface palette (courses / CTA sections) */
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

    /* Hero dark */
    --hero-bg:   #050f2b;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 20px;
    --shadow-sm: 0 2px 8px rgba(17,17,16,0.08);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.11);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .home {
    font-family: var(--font-body);
    background: var(--white);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ══════════════════════════════════════════════
     KEYFRAMES
  ══════════════════════════════════════════════ */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes blobMorph {
    0%,100% { border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; transform: rotate(0deg)   scale(1);    }
    25%      { border-radius: 40% 60% 45% 55% / 60% 40% 55% 45%; transform: rotate(90deg)  scale(1.05); }
    50%      { border-radius: 55% 45% 60% 40% / 45% 55% 50% 50%; transform: rotate(180deg) scale(0.97); }
    75%      { border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%; transform: rotate(270deg) scale(1.03); }
  }
  @keyframes blobMorph2 {
    0%,100% { border-radius: 40% 60% 50% 50% / 55% 45% 55% 45%; transform: rotate(0deg)   scale(1);    }
    33%      { border-radius: 60% 40% 45% 55% / 45% 55% 45% 55%; transform: rotate(120deg) scale(1.08); }
    66%      { border-radius: 50% 50% 60% 40% / 40% 60% 50% 50%; transform: rotate(240deg) scale(0.95); }
  }
  @keyframes floatUp {
    0%,100% { transform: translateY(0px);   }
    50%      { transform: translateY(-12px); }
  }
  @keyframes floatUp2 {
    0%,100% { transform: translateY(0px);  }
    50%      { transform: translateY(-8px); }
  }
  @keyframes pulseRing {
    0%   { transform: scale(1);   opacity: .5; }
    100% { transform: scale(2.6); opacity: 0;  }
  }
  @keyframes blink {
    0%,100% { opacity: 1;  }
    50%      { opacity: .2; }
  }
  @keyframes gradShift {
    0%,100% { background-position: 0%   50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes marquee {
    from { transform: translateX(0);    }
    to   { transform: translateX(-50%); }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%);  }
  }
  @keyframes cardFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }

  /* ══════════════════════════════════════════════
     HERO — dark blue, student photo + blob
  ══════════════════════════════════════════════ */
  .hero {
    background: var(--hero-bg);
    position: relative;
    overflow: hidden;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Background layers */
  .hero-bg-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(66,133,244,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(66,133,244,.05) 1px, transparent 1px);
    background-size: 56px 56px;
    pointer-events: none;
  }
  .hero-bg-glow {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 70% 60% at 80% 10%,  rgba(66,133,244,.18) 0%, transparent 60%),
      radial-gradient(ellipse 50% 70% at 10% 90%,  rgba(21,88,208,.22)  0%, transparent 55%),
      radial-gradient(ellipse 40% 50% at 50% 50%,  rgba(5,15,43,.5)     0%, transparent 100%);
    pointer-events: none;
  }
  .hero-bg-vignette {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, var(--hero-bg) 100%);
    pointer-events: none;
  }

  /* Nav */
  .h-nav {
    position: relative; z-index: 20;
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 64px;
    border-bottom: 1px solid rgba(66,133,244,.1);
    animation: fadeIn .4s ease both;
  }
  .h-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-display);
    font-size: 21px; font-weight: 800; letter-spacing: -.025em;
    color: var(--white); cursor: pointer; user-select: none;
  }
  .h-logo-mark {
    width: 34px; height: 34px; border-radius: 10px;
    background: linear-gradient(135deg, var(--b400), var(--b600));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px rgba(66,133,244,.4); flex-shrink: 0;
  }
  .h-logo-mark svg { width: 16px; height: 16px; }
  .h-nav-links { display: flex; gap: 2px; }
  .h-nav-link {
    font-size: 14px; font-weight: 400; color: rgba(255,255,255,.42);
    background: none; border: none; cursor: pointer;
    padding: 7px 16px; border-radius: 8px;
    font-family: var(--font-body);
    transition: color .2s, background .2s;
  }
  .h-nav-link:hover { color: rgba(255,255,255,.9); background: rgba(255,255,255,.05); }
  .h-nav-actions { display: flex; gap: 10px; align-items: center; }
  .h-btn-ghost {
    font-size: 13.5px; color: rgba(255,255,255,.5);
    background: none; border: 1px solid rgba(255,255,255,.12);
    border-radius: 9px; padding: 8px 22px; cursor: pointer;
    font-family: var(--font-body);
    transition: border-color .2s, color .2s;
  }
  .h-btn-ghost:hover { border-color: rgba(255,255,255,.35); color: var(--white); }
  .h-btn-solid {
    font-size: 13.5px; font-weight: 500; color: var(--hero-bg);
    background: var(--white); border: none;
    border-radius: 9px; padding: 8px 22px; cursor: pointer;
    font-family: var(--font-body);
    transition: background .2s, transform .14s;
  }
  .h-btn-solid:hover { background: var(--b50); transform: translateY(-1px); }

  /* Hero inner */
  .hero-inner {
    position: relative; z-index: 5;
    flex: 1;
    max-width: 1280px; width: 100%; margin: 0 auto;
    padding: 60px 64px 80px;
    display: grid;
    grid-template-columns: 1fr 520px;
    gap: 0;
    align-items: center;
  }

  /* ── Hero Left ── */
  .hero-left { padding-right: 72px; }

  .hero-kicker {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(66,133,244,.1);
    border: 1px solid rgba(66,133,244,.22);
    border-radius: 100px; padding: 6px 14px 6px 10px;
    margin-bottom: 36px;
    animation: fadeUp .5s ease both .05s;
  }
  .hero-kicker-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--b400); position: relative;
    animation: blink 2s ease-in-out infinite; flex-shrink: 0;
  }
  .hero-kicker-dot::after {
    content: '';
    position: absolute; inset: -4px;
    border-radius: 50%; border: 1.5px solid rgba(66,133,244,.45);
    animation: pulseRing 2s ease-out infinite;
  }
  .hero-kicker-text {
    font-size: 12px; font-weight: 500;
    color: var(--b200); letter-spacing: .05em;
    font-family: var(--font-display);
  }

  .hero-headline {
    font-family: var(--font-display);
    font-size: clamp(50px, 5.2vw, 76px);
    line-height: .93;
    letter-spacing: -.04em;
    margin-bottom: 28px;
    animation: fadeUp .7s ease both .15s;
  }
  .hl-muted { display: block; color: rgba(255,255,255,.2); }
  .hl-grad  {
    display: block;
    background: linear-gradient(100deg, var(--b100) 0%, var(--b300) 45%, var(--b200) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradShift 5s ease-in-out infinite;
  }
  .hl-white { display: block; color: var(--white); }

  .hero-sub {
    font-size: 16px; font-weight: 300; font-style: italic;
    color: rgba(255,255,255,.4);
    line-height: 1.9; max-width: 380px;
    margin-bottom: 44px;
    animation: fadeUp .7s ease both .25s;
  }

  /* CTA */
  .hero-cta-row {
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 52px;
    animation: fadeUp .7s ease both .35s;
  }
  .btn-hero-primary {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--font-display); font-size: 13px; font-weight: 700;
    background: var(--b400); color: var(--white);
    border: none; border-radius: 12px;
    padding: 15px 30px; cursor: pointer;
    letter-spacing: .07em; text-transform: uppercase;
    position: relative; overflow: hidden;
    box-shadow: 0 8px 32px rgba(66,133,244,.35);
    transition: background .2s, transform .16s, box-shadow .25s;
  }
  .btn-hero-primary::after {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 35%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.16), transparent);
    animation: shimmer 3.5s ease-in-out infinite 1.2s;
  }
  .btn-hero-primary:hover {
    background: var(--b500);
    transform: translateY(-2px);
    box-shadow: 0 14px 44px rgba(66,133,244,.5);
  }
  .btn-hero-secondary {
    font-family: var(--font-body); font-size: 15px; font-weight: 400;
    color: rgba(255,255,255,.35); background: none; border: none;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    transition: color .2s;
  }
  .btn-hero-secondary:hover { color: rgba(255,255,255,.75); }
  .bhs-arr { display: inline-block; transition: transform .25s; }
  .btn-hero-secondary:hover .bhs-arr { transform: translateX(5px); }

  /* Social proof */
  .hero-proof {
    display: flex; align-items: center; gap: 20px;
    margin-bottom: 34px;
    animation: fadeUp .7s ease both .44s;
  }
  .hero-avatars { display: flex; }
  .hero-av-img {
    width: 34px; height: 34px; border-radius: 50%;
    border: 2.5px solid var(--hero-bg);
    object-fit: cover; margin-left: -10px;
  }
  .hero-av-img:first-child { margin-left: 0; }
  .hero-proof-text { font-size: 13px; color: rgba(255,255,255,.32); line-height: 1.55; }
  .hero-proof-text strong { color: rgba(255,255,255,.65); font-weight: 500; }

  /* Stats strip */
  .hero-stats {
    display: flex; gap: 0;
    border: 1px solid rgba(66,133,244,.14);
    border-radius: 14px; overflow: hidden;
    animation: fadeUp .7s ease both .52s;
  }
  .hero-stat {
    flex: 1; padding: 17px 20px;
    background: rgba(6,30,84,.5);
    border-right: 1px solid rgba(66,133,244,.1);
    transition: background .2s; cursor: default;
  }
  .hero-stat:last-child { border-right: none; }
  .hero-stat:hover { background: rgba(66,133,244,.09); }
  .hero-stat-val {
    font-family: var(--font-display);
    font-size: 25px; font-weight: 800; color: var(--white);
    line-height: 1; letter-spacing: -.03em; margin-bottom: 4px;
  }
  .hero-stat-val span { color: var(--b400); }
  .hero-stat-label {
    font-size: 10px; font-weight: 400; color: rgba(255,255,255,.28);
    letter-spacing: .1em; text-transform: uppercase;
  }

  /* ── Hero Right — image + blobs ── */
  .hero-right {
    position: relative;
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn .9s ease both .4s;
    height: 540px;
  }

  /* Blob 1 — large background blob */
  .blob-1 {
    position: absolute;
    width: 420px; height: 420px;
    background: linear-gradient(135deg, rgba(66,133,244,.35) 0%, rgba(21,88,208,.25) 50%, rgba(147,184,250,.15) 100%);
    border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%;
    animation: blobMorph 10s ease-in-out infinite;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    filter: blur(2px);
  }
  /* Blob 2 — accent blob */
  .blob-2 {
    position: absolute;
    width: 260px; height: 260px;
    background: linear-gradient(135deg, rgba(92,148,245,.4) 0%, rgba(66,133,244,.15) 100%);
    border-radius: 40% 60% 50% 50% / 55% 45% 55% 45%;
    animation: blobMorph2 14s ease-in-out infinite;
    top: 15%; right: 5%;
    filter: blur(1px);
  }
  /* Blob 3 — small accent */
  .blob-3 {
    position: absolute;
    width: 140px; height: 140px;
    background: linear-gradient(135deg, rgba(147,184,250,.3) 0%, rgba(66,133,244,.1) 100%);
    border-radius: 55% 45% 40% 60% / 45% 55% 50% 50%;
    animation: blobMorph 8s ease-in-out infinite reverse;
    bottom: 12%; left: 8%;
    filter: blur(1px);
  }

  /* Student photo frame */
  .hero-photo-frame {
    position: relative; z-index: 3;
    width: 340px; height: 420px;
    border-radius: 28px; overflow: hidden;
    border: 1px solid rgba(66,133,244,.25);
    box-shadow:
      0 40px 80px rgba(0,0,0,.55),
      0 0 0 1px rgba(66,133,244,.08) inset;
    animation: floatUp 6s ease-in-out infinite;
  }
  .hero-photo-frame img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .hero-photo-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(5,15,43,.1) 0%, rgba(5,15,43,.5) 100%);
  }

  /* Floating mini card on photo */
  .hero-photo-card {
    position: absolute; bottom: 20px; left: -32px; z-index: 5;
    background: rgba(255,255,255,.97);
    border: 1px solid rgba(66,133,244,.15);
    border-radius: 14px; padding: 12px 16px;
    box-shadow: 0 12px 36px rgba(0,0,0,.3);
    display: flex; align-items: center; gap: 10px;
    animation: floatUp2 5.5s ease-in-out infinite 1s;
    white-space: nowrap;
  }
  .hero-photo-card-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: var(--b50);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hero-photo-card-icon svg { width: 18px; height: 18px; }
  .hero-photo-card-val {
    font-family: var(--font-display); font-size: 14px; font-weight: 700;
    color: var(--ink); line-height: 1.2;
  }
  .hero-photo-card-sub { font-size: 11px; color: var(--ink-3); margin-top: 1px; }

  /* Floating chip top-right */
  .hero-chip-tr {
    position: absolute; top: 28px; right: -20px; z-index: 5;
    background: rgba(5,15,43,.92);
    border: 1px solid rgba(66,133,244,.25);
    border-radius: 14px; padding: 11px 14px;
    backdrop-filter: blur(12px);
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 28px rgba(0,0,0,.35);
    animation: floatUp2 4.8s ease-in-out infinite .5s;
    white-space: nowrap;
  }
  .chip-av-row { display: flex; }
  .chip-av {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid rgba(5,15,43,.92);
    object-fit: cover; margin-left: -7px;
  }
  .chip-av:first-child { margin-left: 0; }
  .chip-tr-val {
    font-family: var(--font-display); font-size: 12px; font-weight: 700;
    color: var(--white);
  }
  .chip-tr-sub { font-size: 10.5px; color: rgba(255,255,255,.35); margin-top: 1px; }

  /* Decorative spinning ring */
  .hero-ring {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%);
    width: 500px; height: 500px; border-radius: 50%;
    border: 1px dashed rgba(66,133,244,.1);
    animation: spinSlow 30s linear infinite;
    pointer-events: none; z-index: 1;
  }

  /* ══════════════════════════════════════════════
     MARQUEE
  ══════════════════════════════════════════════ */
  .marquee-wrap {
    border-top: 1px solid rgba(66,133,244,.08);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    overflow: hidden; padding: 13px 0;
  }
  .marquee-track {
    display: flex; width: max-content;
    animation: marquee 32s linear infinite;
  }
  .marquee-item {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 0 28px; white-space: nowrap;
    font-family: var(--font-display);
    font-size: 11px; font-weight: 500; letter-spacing: .1em;
    text-transform: uppercase; color: var(--ink-3);
    border-right: 1px solid var(--border);
  }
  .marquee-sep { color: var(--b400); font-size: 7px; }

  /* ══════════════════════════════════════════════
     COURSES  — light theme, unchanged layout
  ══════════════════════════════════════════════ */
  .courses-section {
    max-width: 1200px; margin: 0 auto;
    padding: 80px 40px 88px;
  }
  .sec-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 24px; margin-bottom: 44px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }
  .sec-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--b500); margin-bottom: 8px;
    font-family: var(--font-display);
  }
  .sec-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.5vw, 40px); color: var(--ink);
    letter-spacing: -.025em; line-height: 1.05; font-weight: 800;
  }
  .sec-title em { font-style: italic; color: var(--ink-3); font-weight: 400; }
  .btn-outline {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13.5px; font-weight: 500; color: var(--ink-2);
    background: white; border: 1.5px solid var(--border-2);
    border-radius: var(--r); padding: 9px 20px; cursor: pointer;
    font-family: var(--font-body); letter-spacing: -.01em; white-space: nowrap;
    transition: border-color .14s, color .14s, background .14s;
  }
  .btn-outline:hover { border-color: var(--ink); color: var(--ink); background: var(--surface); }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 18px;
  }

  /* Course card — LIGHT */
  .ccard {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden; cursor: pointer;
    display: flex; flex-direction: column;
    transition: border-color .2s, box-shadow .2s, transform .2s;
    animation: cardFadeUp .4s ease both;
  }
  .ccard:hover {
    border-color: var(--border-2);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
  .ccard-img { width: 100%; height: 172px; object-fit: cover; display: block; }
  .ccard-img-ph {
    width: 100%; height: 172px;
    display: flex; align-items: center; justify-content: center;
    font-size: 44px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .ccard-body { padding: 20px 22px 22px; flex: 1; display: flex; flex-direction: column; }
  .ccard-meta { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
  .ccard-cat {
    font-size: 11px; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 6px;
    font-family: var(--font-display);
  }
  .ccard-lvl {
    font-size: 11px; font-weight: 500; color: var(--ink-4);
    padding: 4px 10px; border-radius: 6px;
    background: var(--surface); border: 1px solid var(--border);
  }
  .ccard-title {
    font-family: var(--font-display);
    font-size: 17px; color: var(--ink); line-height: 1.3;
    margin-bottom: 8px; letter-spacing: -.015em; font-weight: 700;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .ccard-desc {
    font-size: 13px; color: var(--ink-4); line-height: 1.6;
    margin-bottom: 14px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .ccard-instructor { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .ccard-av {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 9.5px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
  }
  .ccard-instructor-name { font-size: 12.5px; font-weight: 500; color: var(--ink-3); }
  .ccard-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--border); gap: 8px;
  }
  .ccard-price {
    font-family: var(--font-display);
    font-size: 22px; color: var(--ink); letter-spacing: -.02em; font-weight: 800;
  }
  .ccard-orig { font-size: 13px; color: var(--ink-5); text-decoration: line-through; margin-left: 6px; }
  .ccard-enroll-btn {
    font-family: var(--font-display); font-size: 13px; font-weight: 600;
    color: white; background: var(--b500); border: none;
    border-radius: var(--r); padding: 8px 18px; cursor: pointer;
    letter-spacing: -.01em;
    transition: opacity .14s, transform .12s;
  }
  .ccard-enroll-btn:hover { opacity: .88; transform: translateY(-1px); }

  /* Empty */
  .empty { grid-column: 1/-1; text-align: center; padding: 80px 20px; }
  .empty-icon { font-size: 48px; margin-bottom: 14px; opacity: .25; }
  .empty-title {
    font-family: var(--font-display); font-size: 22px; color: var(--ink);
    margin-bottom: 6px; letter-spacing: -.02em;
  }
  .empty-sub { font-size: 14px; color: var(--ink-4); }

  /* ══════════════════════════════════════════════
     CTA BAND
  ══════════════════════════════════════════════ */
  .cta-band {
    background: var(--hero-bg);
    padding: 80px 40px;
    position: relative; overflow: hidden;
  }
  .cta-band::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 50% 70% at 0% 50%,   rgba(66,133,244,.14) 0%, transparent 60%),
      radial-gradient(ellipse 40% 50% at 100% 50%,  rgba(21,88,208,.1)  0%, transparent 55%);
    pointer-events: none;
  }
  .cta-band-grid {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr auto;
    align-items: center; gap: 60px;
  }
  .cta-eyebrow {
    font-family: var(--font-display);
    font-size: 11px; font-weight: 600; letter-spacing: .14em;
    text-transform: uppercase; color: var(--b300); margin-bottom: 14px;
  }
  .cta-title {
    font-family: var(--font-display);
    font-size: clamp(30px, 4vw, 52px);
    color: white; letter-spacing: -.03em; line-height: 1.05;
    margin-bottom: 16px; font-weight: 800;
  }
  .cta-title em { font-style: italic; color: var(--b200); font-weight: 400; }
  .cta-sub { font-size: 16px; color: rgba(255,255,255,.35); line-height: 1.7; max-width: 520px; }
  .cta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 28px; }
  .cta-pill {
    display: inline-flex; align-items: center; gap: 7px;
    border: 1px solid rgba(66,133,244,.2); border-radius: 100px;
    padding: 6px 14px; font-size: 12px; color: rgba(255,255,255,.4);
  }
  .cta-pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .cta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
  .btn-cta {
    font-family: var(--font-display); font-size: 15px; font-weight: 700;
    padding: 15px 36px; border-radius: var(--r); border: none; cursor: pointer;
    background: white; color: var(--ink); letter-spacing: -.01em; white-space: nowrap;
    transition: background .16s, transform .12s;
    box-shadow: 0 4px 20px rgba(0,0,0,.25);
  }
  .btn-cta:hover { background: var(--b100); transform: translateY(-1px); }
  .cta-footnote { font-size: 12px; color: rgba(255,255,255,.18); }

  /* ══════════════════════════════════════════════
     RESPONSIVE
  ══════════════════════════════════════════════ */
  @media (max-width: 1060px) {
    .hero-inner { grid-template-columns: 1fr; padding: 48px 40px 64px; }
    .hero-left  { padding-right: 0; margin-bottom: 56px; }
    .hero-right { height: 400px; max-width: 420px; }
    .hero-chip-tr { display: none; }
    .cta-band-grid { grid-template-columns: 1fr; gap: 32px; }
    .cta-right { align-items: flex-start; }
  }
  @media (max-width: 680px) {
    .h-nav { padding: 18px 24px; }
    .h-nav-links, .h-btn-ghost { display: none; }
    .hero-inner { padding: 36px 24px 52px; }
    .hero-stats { flex-wrap: wrap; }
    .hero-stat { min-width: 46%; }
    .hero-right { height: 340px; }
    .hero-photo-frame { width: 260px; height: 320px; }
    .hero-photo-card { display: none; }
    .courses-section { padding: 56px 20px 64px; }
    .cta-band { padding: 56px 20px; }
  }
`;

/* ── Category palette ── */
const CAT_CONFIG = {
  'Web Development': { ph: '#eef4ff', emoji: '💻', cat: { color: '#1a4dc8', bg: '#eff3ff' }, av: '#1a4dc8' },
  'Design':          { ph: '#f5f0ff', emoji: '🎨', cat: { color: '#6d28d9', bg: '#f4f0fe' }, av: '#6d28d9' },
  'Data Science':    { ph: '#edfdf5', emoji: '📊', cat: { color: '#047857', bg: '#ecfdf5' }, av: '#047857' },
  'Marketing':       { ph: '#fffbeb', emoji: '📣', cat: { color: '#b45309', bg: '#fffbeb' }, av: '#b45309' },
  'Photography':     { ph: '#fff1f2', emoji: '📷', cat: { color: '#be123c', bg: '#fff1f3' }, av: '#be123c' },
};
const getC = cat =>
  CAT_CONFIG[cat] || { ph: '#f4f3f0', emoji: '📚', cat: { color: '#1558d0', bg: '#eff4ff' }, av: '#1558d0' };

function CourseCard({ course, onClick, index }) {
  const c = getC(course.category);
  const initials = course.instructor?.name
    ? course.instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="ccard" onClick={onClick} style={{ animationDelay: `${index * 0.05}s` }}>
      {course.thumbnail?.url
        ? <img src={course.thumbnail.url} alt={course.title} className="ccard-img" />
        : <div className="ccard-img-ph" style={{ background: c.ph }}>{c.emoji}</div>}

      <div className="ccard-body">
        <div className="ccard-meta">
          {course.category && (
            <span className="ccard-cat" style={{ color: c.cat.color, background: c.cat.bg }}>
              {course.category}
            </span>
          )}
          {course.level && <span className="ccard-lvl">{course.level}</span>}
        </div>

        <div className="ccard-title">{course.title}</div>
        {course.shortDescription && <div className="ccard-desc">{course.shortDescription}</div>}

        {course.instructor?.name && (
          <div className="ccard-instructor">
            <div className="ccard-av" style={{ background: c.av }}>{initials}</div>
            <span className="ccard-instructor-name">{course.instructor.name}</span>
          </div>
        )}

        <div className="ccard-footer">
          <div>
            <span className="ccard-price">
              ${course.discountPrice > 0 ? course.discountPrice : course.price}
            </span>
            {course.discountPrice > 0 && (
              <span className="ccard-orig">${course.price}</span>
            )}
          </div>
          <button
            className="ccard-enroll-btn"
            onClick={e => { e.stopPropagation(); onClick(); }}
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
}

const MARQUEE = [
  'Expert Instructors', 'Lifetime Access', 'Real-World Projects', 'Career Focused',
  'Certificate Included', 'Learn Anywhere', 'Community Access', 'New Courses Weekly',
  'Expert Instructors', 'Lifetime Access', 'Real-World Projects', 'Career Focused',
  'Certificate Included', 'Learn Anywhere', 'Community Access', 'New Courses Weekly',
];

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/courses', { params: { limit: 50 } })
      .then(r => setCourses(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="home">

        {/* ════════════ HERO ════════════ */}
        <section className="hero">
          <div className="hero-bg-grid"    aria-hidden />
          <div className="hero-bg-glow"    aria-hidden />
          <div className="hero-bg-vignette" aria-hidden />

         

          {/* Body */}
          <div className="hero-inner">

            {/* LEFT */}
            <div className="hero-left">
              <div className="hero-kicker">
                <div className="hero-kicker-dot" />
                <span className="hero-kicker-text">New courses added every week</span>
              </div>

              <h1 className="hero-headline">
                <span className="hl-muted">Shape your</span>
                <span className="hl-grad">future</span>
                <span className="hl-white">through learning.</span>
              </h1>

              <p className="hero-sub">
                Expert-led courses built for real outcomes — practical skills,
                zero fluff, designed for people who want to actually get somewhere.
              </p>

              <div className="hero-cta-row">
                <button className="btn-hero-primary" onClick={() => navigate('/courses')}>
                  Explore courses
                  <svg width="13" height="13" fill="none" stroke="currentColor"
                    strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className="btn-hero-secondary" onClick={() => navigate('/register')}>
                  Free to join <span className="bhs-arr">→</span>
                </button>
              </div>

              {/* Social proof */}
              <div className="hero-proof">
                <div className="hero-avatars">
                  {[AV_1, AV_2, AV_3].map((src, i) => (
                    <img key={i} src={src} alt="learner" className="hero-av-img" />
                  ))}
                </div>
                <div className="hero-proof-text">
                  Joined by <strong>500+ learners</strong><br />
                  ★★★★★&nbsp; 4.9 avg rating
                </div>
              </div>

              {/* Stats */}
              <div className="hero-stats">
                {[
                  { val: `${courses.length || '14'}`, unit: '+', lbl: 'Live courses' },
                  { val: '500',  unit: '+', lbl: 'Learners'    },
                  { val: '4.9',  unit: '★', lbl: 'Avg rating'  },
                  { val: '142',  unit: '',  lbl: 'Certs issued' },
                ].map(s => (
                  <div key={s.lbl} className="hero-stat">
                    <div className="hero-stat-val">{s.val}<span>{s.unit}</span></div>
                    <div className="hero-stat-label">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — blobs + student photo */}
            <div className="hero-right">
              {/* Animated blobs */}
              <div className="blob-1" aria-hidden />
              <div className="blob-2" aria-hidden />
              <div className="blob-3" aria-hidden />
              <div className="hero-ring" aria-hidden />

              {/* Student photo */}
              <div className="hero-photo-frame">
                <img src={STUDENT_IMG} alt="Students learning together" />
                <div className="hero-photo-overlay" />
              </div>

              {/* Floating mini card — bottom left of photo */}
              <div className="hero-photo-card">
                <div className="hero-photo-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div>
                  <div className="hero-photo-card-val">142 certs issued</div>
                  <div className="hero-photo-card-sub">This month</div>
                </div>
              </div>

              {/* Floating chip — top right */}
              <div className="hero-chip-tr">
                <div>
                  <div className="chip-av-row">
                    {[AV_1, AV_2, AV_3].map((src, i) => (
                      <img key={i} src={src} alt="" className="chip-av" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="chip-tr-val">500+ learners</div>
                  <div className="chip-tr-sub">joined this week</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════ MARQUEE ════════════ */}
        <div className="marquee-wrap">
          <div className="marquee-track">
            {MARQUEE.map((item, i) => (
              <div key={i} className="marquee-item">
                <span className="marquee-sep">●</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* ════════════ COURSES ════════════ */}
        <div className="courses-section">
          <div className="sec-head">
            <div>
              <div className="sec-eyebrow">Course Catalog</div>
              <div className="sec-title">All courses,<br /><em>one place.</em></div>
            </div>
            <button className="btn-outline" onClick={() => navigate('/courses')}>
              Browse all
              <svg width="11" height="11" fill="none" stroke="currentColor"
                strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {loading ? <LoadingCenter /> : (
            <div className="courses-grid">
              {courses.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📭</div>
                  <div className="empty-title">No courses yet</div>
                  <div className="empty-sub">New courses are on the way — check back soon.</div>
                </div>
              ) : courses.map((c, i) => (
                <CourseCard
                  key={c._id} course={c} index={i}
                  onClick={() => navigate(`/courses/${c._id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ════════════ CTA BAND ════════════ */}
        <div className="cta-band">
          <div className="cta-band-grid">
            <div>
              <div className="cta-eyebrow">Start today</div>
              <div className="cta-title">
                Ready to <em>level up</em><br />your career?
              </div>
              <div className="cta-sub">
                Join hundreds of learners already building real, career-changing skills.
                Structured, practical, and built around your schedule.
              </div>
              <div className="cta-pills">
                {[
                  { color: '#5c94f5', text: 'No credit card required' },
                  { color: '#34d399', text: 'Cancel anytime'          },
                  { color: '#93b8fa', text: 'Lifetime access'         },
                ].map(p => (
                  <div key={p.text} className="cta-pill">
                    <div className="cta-pill-dot" style={{ background: p.color }} />
                    {p.text}
                  </div>
                ))}
              </div>
            </div>
            <div className="cta-right">
              <button className="btn-cta" onClick={() => navigate('/register')}>
                Get started free →
              </button>
              <div className="cta-footnote">Takes less than 60 seconds</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoadingCenter } from '../components/common';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&display=swap');

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

    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 20px;

    --shadow-xs: 0 1px 3px rgba(17,17,16,0.07);
    --shadow-sm: 0 2px 8px rgba(17,17,16,0.08);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.11);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .home {
    font-family: var(--font-sans);
    background: var(--white);
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* ═══════════════════════════════════════
     NAV
  ═══════════════════════════════════════ */
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .nav-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 40px; height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo {
    display: flex; align-items: baseline; gap: 2px;
    font-family: var(--font-serif); font-size: 20px; color: var(--ink);
    cursor: pointer; letter-spacing: -.01em;
    user-select: none;
  }
  .nav-logo-dot { color: var(--accent); font-size: 24px; line-height: 0; }
  .nav-links { display: flex; align-items: center; gap: 2px; }
  .nav-link {
    font-size: 14px; font-weight: 500; color: var(--ink-3);
    background: none; border: none; cursor: pointer;
    padding: 7px 14px; border-radius: var(--r);
    transition: color .14s, background .14s;
    font-family: var(--font-sans);
    letter-spacing: -.01em;
  }
  .nav-link:hover { color: var(--ink); background: var(--surface); }
  .nav-actions { display: flex; align-items: center; gap: 10px; }
  .nav-btn-ghost {
    font-size: 14px; font-weight: 500; color: var(--ink-2);
    background: none; border: 1.5px solid var(--border-2); cursor: pointer;
    padding: 7px 18px; border-radius: var(--r);
    font-family: var(--font-sans); letter-spacing: -.01em;
    transition: border-color .14s, color .14s;
  }
  .nav-btn-ghost:hover { border-color: var(--ink-3); color: var(--ink); }
  .nav-btn-solid {
    font-size: 14px; font-weight: 600; color: white;
    background: var(--accent); border: none; cursor: pointer;
    padding: 8px 20px; border-radius: var(--r);
    font-family: var(--font-sans); letter-spacing: -.01em;
    transition: opacity .14s, transform .12s;
  }
  .nav-btn-solid:hover { opacity: .88; transform: translateY(-1px); }

  /* ═══════════════════════════════════════
     HERO  — editorial split layout
  ═══════════════════════════════════════ */
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: .35; }
  }
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes floatCard {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }

  .hero {
    background: #faf9f7;
    border-bottom: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }
  /* dot-grid texture */
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, #d0cdc6 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: .4;
    pointer-events: none;
  }
  /* soft glow top-right */
  .hero::after {
    content: '';
    position: absolute;
    top: -120px; right: -80px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(28,78,216,.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    padding: 0 48px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    min-height: 640px;
    align-items: stretch;
  }

  /* ── LEFT ── */
  .hero-left {
    padding: 88px 72px 88px 0;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; justify-content: center;
  }

  .hero-kicker {
    display: inline-flex; align-items: center; gap: 10px;
    margin-bottom: 36px; align-self: flex-start;
    animation: heroFadeIn .6s ease both;
  }
  .hero-kicker-line {
    width: 32px; height: 1.5px;
    background: var(--accent);
  }
  .hero-kicker-text {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--accent);
  }
  .hero-kicker-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent);
    animation: blink 2.4s ease-in-out infinite;
  }

  .hero-headline {
    font-family: var(--font-serif);
    font-size: clamp(46px, 4.8vw, 68px);
    line-height: 1.01;
    letter-spacing: -.03em;
    color: var(--ink);
    margin-bottom: 0;
    animation: heroFadeUp .65s ease both .1s;
  }
  .hero-headline-plain { display: block; }
  .hero-headline-italic {
    display: block;
    font-style: italic;
    color: var(--accent);
    padding-left: 32px;
  }

  .hero-divider {
    width: 40px; height: 1.5px;
    background: var(--border-2);
    margin: 28px 0;
    animation: heroFadeIn .6s ease both .22s;
  }

  .hero-sub {
    font-size: 16px; font-weight: 400; color: var(--ink-3);
    line-height: 1.85; max-width: 370px;
    margin-bottom: 42px;
    animation: heroFadeUp .65s ease both .2s;
  }

  .hero-actions {
    display: flex; align-items: center; gap: 18px;
    margin-bottom: 52px;
    animation: heroFadeUp .65s ease both .3s;
  }
  .btn-hero-primary {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: var(--font-sans); font-size: 13px; font-weight: 700;
    background: var(--ink); color: white; border: none;
    padding: 15px 30px; border-radius: 100px; cursor: pointer;
    letter-spacing: .06em; text-transform: uppercase;
    transition: background .18s, transform .12s, box-shadow .18s;
    box-shadow: 0 4px 18px rgba(17,17,16,.2);
  }
  .btn-hero-primary:hover {
    background: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(28,78,216,.3);
  }
  .btn-hero-secondary {
    font-family: var(--font-sans); font-size: 14px; font-weight: 500;
    color: var(--ink-3); background: none; border: none; cursor: pointer;
    letter-spacing: -.01em;
    display: inline-flex; align-items: center; gap: 7px;
    transition: color .14s;
  }
  .btn-hero-secondary:hover { color: var(--ink); }
  .btn-hero-secondary .btn-arrow { display: inline-block; transition: transform .2s; }
  .btn-hero-secondary:hover .btn-arrow { transform: translateX(4px); }

  /* Stats row — bordered card grid */
  .hero-stats {
    display: flex; gap: 0;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    background: white;
    overflow: hidden;
    animation: heroFadeUp .65s ease both .42s;
    box-shadow: var(--shadow-sm);
  }
  .hero-stat {
    flex: 1; padding: 18px 20px;
    border-right: 1px solid var(--border);
    transition: background .16s;
  }
  .hero-stat:last-child { border-right: none; }
  .hero-stat:hover { background: var(--surface); }
  .hero-stat-val {
    font-family: var(--font-serif);
    font-size: 24px; color: var(--ink); line-height: 1;
    letter-spacing: -.02em;
  }
  .hero-stat-label {
    font-size: 10.5px; color: var(--ink-4); margin-top: 4px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
  }

  /* ── RIGHT ── */
  .hero-right {
    padding: 64px 0 64px 72px;
    display: flex; flex-direction: column;
    justify-content: center;
    position: relative;
  }

  /* Floating course card */
  .hero-course-preview {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden;
    box-shadow: 0 24px 60px rgba(17,17,16,.12), 0 6px 16px rgba(17,17,16,.06);
    animation: heroFadeUp .75s ease both .35s, floatCard 5.5s ease-in-out infinite 1.1s;
  }

  .hcp-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface);
  }
  .hcp-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--ink-4);
  }
  .hcp-badge {
    font-size: 10.5px; font-weight: 700;
    background: var(--green-lt); color: var(--green);
    border: 1px solid #bbf7d0;
    padding: 3px 10px; border-radius: 100px; letter-spacing: .04em;
    text-transform: uppercase;
  }

  .hcp-thumb {
    width: 100%; height: 150px;
    background: linear-gradient(135deg, #e0e8ff 0%, #d0dcff 40%, #eaedff 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 56px;
    position: relative;
  }
  .hcp-thumb::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 60%, rgba(255,255,255,.3));
  }

  .hcp-body { padding: 18px 20px; }
  .hcp-cat {
    font-size: 10px; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 5px;
  }
  .hcp-title {
    font-family: var(--font-serif);
    font-size: 15.5px; color: var(--ink); line-height: 1.35;
    letter-spacing: -.01em; margin-bottom: 14px;
  }
  .hcp-progress-label {
    display: flex; justify-content: space-between;
    font-size: 10.5px; color: var(--ink-4); margin-bottom: 7px; font-weight: 600;
    letter-spacing: .02em;
  }
  .hcp-progress-bar {
    height: 4px; background: var(--surface-2); border-radius: 100px; overflow: hidden;
    margin-bottom: 4px;
  }
  .hcp-progress-fill {
    height: 100%; width: 68%;
    background: linear-gradient(90deg, var(--accent) 0%, #6b8cf7 100%);
    border-radius: 100px;
  }

  .hcp-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 20px;
    border-top: 1px solid var(--border);
  }
  .hcp-instructor { display: flex; align-items: center; gap: 8px; }
  .hcp-av {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--accent); color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
  }
  .hcp-name { font-size: 12px; font-weight: 500; color: var(--ink-3); }
  .hcp-rating {
    font-size: 12px; font-weight: 700; color: var(--ink);
    display: flex; align-items: center; gap: 4px;
  }

  /* Floating chips */
  .hero-chip {
    position: absolute;
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 10px 14px;
    box-shadow: var(--shadow-md);
    display: flex; align-items: center; gap: 10px;
    white-space: nowrap;
  }
  .hero-chip-icon { font-size: 20px; line-height: 1; }
  .hero-chip-val { font-size: 13px; font-weight: 700; color: var(--ink); letter-spacing: -.01em; line-height: 1.2; }
  .hero-chip-sub { font-size: 10.5px; color: var(--ink-4); margin-top: 1px; font-weight: 500; }

  .hero-chip-1 {
    top: 48px; right: -28px;
    animation: heroFadeIn .8s ease both .7s, floatCard 4.2s ease-in-out infinite 1.5s;
  }
  .hero-chip-2 {
    bottom: 80px; left: 44px;
    animation: heroFadeIn .8s ease both .9s, floatCard 5s ease-in-out infinite 1s;
  }

  /* ═══════════════════════════════════════
     MARQUEE
  ═══════════════════════════════════════ */
  .marquee-wrap {
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    overflow: hidden; padding: 13px 0;
  }
  .marquee-track {
    display: flex; width: max-content;
    animation: marquee 32s linear infinite;
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-item {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 0 28px; white-space: nowrap;
    font-size: 12px; font-weight: 600; letter-spacing: .1em;
    text-transform: uppercase; color: var(--ink-3);
    border-right: 1px solid var(--border);
  }
  .marquee-sep { color: var(--accent); font-size: 8px; }

  /* ═══════════════════════════════════════
     COURSES
  ═══════════════════════════════════════ */
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
    text-transform: uppercase; color: var(--accent); margin-bottom: 8px;
  }
  .sec-title {
    font-family: var(--font-serif);
    font-size: clamp(28px, 3.5vw, 40px); color: var(--ink);
    letter-spacing: -.02em; line-height: 1.05;
  }
  .sec-title em { font-style: italic; color: var(--ink-3); }
  .btn-outline {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13.5px; font-weight: 600; color: var(--ink-2);
    background: white; border: 1.5px solid var(--border-2);
    border-radius: var(--r); padding: 9px 20px; cursor: pointer;
    font-family: var(--font-sans); letter-spacing: -.01em; white-space: nowrap;
    transition: border-color .14s, color .14s, background .14s;
  }
  .btn-outline:hover { border-color: var(--ink); color: var(--ink); background: var(--surface); }

  /* Course grid */
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 18px;
  }

  /* ── Card ── */
  .ccard {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden; cursor: pointer;
    display: flex; flex-direction: column;
    transition: border-color .2s, box-shadow .2s, transform .2s;
    animation: fadeUp .4s ease both;
  }
  .ccard:hover {
    border-color: var(--border-2);
    box-shadow: var(--shadow-lg);
    transform: translateY(-4px);
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
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
  }
  .ccard-lvl {
    font-size: 11px; font-weight: 500; color: var(--ink-4);
    padding: 4px 10px; border-radius: 6px;
    background: var(--surface); border: 1px solid var(--border);
  }

  .ccard-title {
    font-family: var(--font-serif);
    font-size: 17px; color: var(--ink); line-height: 1.3;
    margin-bottom: 8px; letter-spacing: -.015em;
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
  }
  .ccard-instructor-name { font-size: 12.5px; font-weight: 500; color: var(--ink-3); }

  .ccard-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--border); gap: 8px;
  }
  .ccard-price {
    font-family: var(--font-serif);
    font-size: 22px; color: var(--ink); letter-spacing: -.02em;
  }
  .ccard-orig { font-size: 13px; color: var(--ink-5); text-decoration: line-through; margin-left: 6px; }
  .ccard-enroll-btn {
    font-family: var(--font-sans); font-size: 13px; font-weight: 600;
    color: white; background: var(--accent); border: none;
    border-radius: var(--r); padding: 8px 18px; cursor: pointer;
    letter-spacing: -.01em;
    transition: opacity .14s, transform .12s;
  }
  .ccard-enroll-btn:hover { opacity: .88; transform: translateY(-1px); }

  /* Empty */
  .empty {
    grid-column: 1/-1; text-align: center; padding: 80px 20px;
  }
  .empty-icon { font-size: 48px; margin-bottom: 14px; opacity: .25; }
  .empty-title {
    font-family: var(--font-serif); font-size: 22px; color: var(--ink);
    margin-bottom: 6px; letter-spacing: -.02em;
  }
  .empty-sub { font-size: 14px; color: var(--ink-4); }

  /* ═══════════════════════════════════════
     CTA BAND
  ═══════════════════════════════════════ */
  .cta-band {
    background: var(--ink);
    padding: 80px 40px;
    position: relative; overflow: hidden;
  }
  .cta-band-grid {
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr auto;
    align-items: center; gap: 60px;
  }
  .cta-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .14em;
    text-transform: uppercase; color: #6b8cf7;
    margin-bottom: 14px;
  }
  .cta-title {
    font-family: var(--font-serif);
    font-size: clamp(30px, 4vw, 52px);
    color: white; letter-spacing: -.025em; line-height: 1.05;
    margin-bottom: 16px;
  }
  .cta-title em { font-style: italic; color: #93a8ff; }
  .cta-sub { font-size: 16px; color: #9b97a6; line-height: 1.7; max-width: 520px; font-weight: 400; }
  .cta-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 28px; }
  .cta-pill {
    display: inline-flex; align-items: center; gap: 7px;
    border: 1px solid #2d2c38; border-radius: 100px;
    padding: 6px 14px; font-size: 12px; font-weight: 500; color: #9b97a6;
  }
  .cta-pill-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  .cta-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
  .btn-cta {
    font-family: var(--font-sans); font-size: 15px; font-weight: 600;
    padding: 15px 36px; border-radius: var(--r); border: none; cursor: pointer;
    background: white; color: var(--ink); letter-spacing: -.01em; white-space: nowrap;
    transition: background .16s, color .16s, transform .12s;
    box-shadow: 0 4px 20px rgba(0,0,0,.25);
  }
  .btn-cta:hover { background: #93a8ff; color: var(--ink); transform: translateY(-1px); }
  .cta-footnote { font-size: 12px; color: #4a4858; }

  /* ─────────── Responsive ─────────── */
  @media (max-width: 1024px) {
    .hero-inner { grid-template-columns: 1fr; min-height: auto; }
    .hero-left { border-right: none; border-bottom: 1px solid var(--border); padding: 56px 0 44px; }
    .hero-right { padding: 40px 0; }
    .hero-chip-1, .hero-chip-2 { display: none; }
    .cta-band-grid { grid-template-columns: 1fr; gap: 32px; }
    .cta-right { align-items: flex-start; }
  }
  @media (max-width: 640px) {
    .nav-inner { padding: 0 20px; }
    .nav-links, .nav-btn-ghost { display: none; }
    .hero-inner { padding: 0 20px; }
    .hero-left { padding: 44px 0 36px; }
    .hero-stats { flex-wrap: wrap; }
    .hero-stat { min-width: 45%; }
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
const getC = cat => CAT_CONFIG[cat] || { ph: '#f4f3f0', emoji: '📚', cat: { color: '#1c4ed8', bg: '#eff4ff' }, av: '#1c4ed8' };

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
            <span className="ccard-price">${course.discountPrice > 0 ? course.discountPrice : course.price}</span>
            {course.discountPrice > 0 && <span className="ccard-orig">${course.price}</span>}
          </div>
          <button className="ccard-enroll-btn" onClick={e => { e.stopPropagation(); onClick(); }}>
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses', { params: { limit: 50 } })
      .then(r => setCourses(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const MARQUEE = [
    'Expert Instructors', 'Lifetime Access', 'Real-World Projects', 'Career Focused',
    'Certificate Included', 'Learn Anywhere', 'Community Access', 'New Courses Weekly',
    'Expert Instructors', 'Lifetime Access', 'Real-World Projects', 'Career Focused',
    'Certificate Included', 'Learn Anywhere', 'Community Access', 'New Courses Weekly',
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="home">

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-inner">

            {/* LEFT */}
            <div className="hero-left">
              <div className="hero-kicker">
                <div className="hero-kicker-line" />
                <span className="hero-kicker-text">New courses added every week</span>
                <div className="hero-kicker-dot" />
              </div>

              <h1 className="hero-headline">
                <span className="hero-headline-plain">Build skills that</span>
                <span className="hero-headline-italic">move careers</span>
                <span className="hero-headline-plain">forward.</span>
              </h1>

              <div className="hero-divider" />

              <p className="hero-sub">
                Expert-led courses built for real outcomes. No fluff — just focused, practical learning that gets you where you want to go.
              </p>

              <div className="hero-actions">
                <button className="btn-hero-primary" onClick={() => navigate('/courses')}>
                  Browse courses
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button className="btn-hero-secondary" onClick={() => navigate('/register')}>
                  Create free account
                  <span className="btn-arrow">→</span>
                </button>
              </div>

              <div className="hero-stats">
                {[
                  { val: `${courses.length || '10'}+`, label: 'Courses live' },
                  { val: '500+',  label: 'Learners' },
                  { val: '4.9★', label: 'Avg rating' },
                  { val: '142',  label: 'Certificates' },
                ].map(s => (
                  <div key={s.label} className="hero-stat">
                    <div className="hero-stat-val">{s.val}</div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — floating card */}
            <div className="hero-right">
              <div style={{ position: 'relative' }}>
                <div className="hero-course-preview">
                  <div className="hcp-header">
                    <span className="hcp-label">Currently trending</span>
                    <span className="hcp-badge">↑ Trending</span>
                  </div>
                  <div className="hcp-thumb">💻</div>
                  <div className="hcp-body">
                    <div className="hcp-cat">Web Development</div>
                    <div className="hcp-title">Full-Stack Engineering with React &amp; Node</div>
                    <div className="hcp-progress-label">
                      <span>Your progress</span>
                      <span>68%</span>
                    </div>
                    <div className="hcp-progress-bar">
                      <div className="hcp-progress-fill" />
                    </div>
                  </div>
                  <div className="hcp-footer">
                    <div className="hcp-instructor">
                      <div className="hcp-av">JR</div>
                      <span className="hcp-name">Jordan Rivera</span>
                    </div>
                    <span className="hcp-rating">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      4.9
                    </span>
                  </div>
                </div>

                {/* floating chips */}
                <div className="hero-chip hero-chip-1">
                  <span className="hero-chip-icon">🏅</span>
                  <div>
                    <div className="hero-chip-val">Verified cert</div>
                    <div className="hero-chip-sub">Employer-recognized</div>
                  </div>
                </div>
                <div className="hero-chip hero-chip-2">
                  <span className="hero-chip-icon">🕐</span>
                  <div>
                    <div className="hero-chip-val">Learn anytime</div>
                    <div className="hero-chip-sub">Lifetime access</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── MARQUEE ── */}
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

        {/* ── COURSES ── */}
        <div className="courses-section">
          <div className="sec-head">
            <div>
              <div className="sec-eyebrow">Course Catalog</div>
              <div className="sec-title">All courses,<br /><em>one place.</em></div>
            </div>
            <button className="btn-outline" onClick={() => navigate('/courses')}>
              Browse all
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
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
                <CourseCard key={c._id} course={c} index={i} onClick={() => navigate(`/courses/${c._id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* ── CTA ── */}
        <div className="cta-band">
          <div className="cta-band-grid">
            <div>
              <div className="cta-eyebrow">Start today</div>
              <div className="cta-title">
                Ready to <em>level up</em><br />your career?
              </div>
              <div className="cta-sub">
                Join hundreds of learners already building real, career-changing skills. Structured, practical, and built around your schedule.
              </div>
              <div className="cta-pills">
                {[
                  { color: '#6b8cf7', text: 'No credit card required' },
                  { color: '#34d399', text: 'Cancel anytime' },
                  { color: '#93a8ff', text: 'Lifetime access' },
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
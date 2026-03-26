import React, { useEffect, useState, useRef, useCallback } from "react";
import api from "../../services/api";

// ─── Poll intervals ───────────────────────────────────────
const POLL_MESSAGES_MS     = 10000;
const POLL_PARTICIPANTS_MS = 30000;
const HEARTBEAT_MS         = 2 * 60 * 1000;
const ONLINE_THRESHOLD_MS  = 5 * 60 * 1000;
const ACCEPT_TYPES =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.zip,.txt,.mp4,.mp3";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  .lc-root {
    --c-bg:       #f8fafc;
    --c-surface:  #ffffff;
    --c-surface2: #f1f5f9;
    --c-border:   rgba(15,23,42,0.08);
    --c-border2:  rgba(15,23,42,0.13);
    --c-ink:      #0f172a;
    --c-ink2:     #334155;
    --c-ink3:     #64748b;
    --c-ink4:     #94a3b8;
    --c-ink5:     #cbd5e1;
    --c-blue50:   #eff6ff;
    --c-blue100:  #dbeafe;
    --c-blue200:  #bfdbfe;
    --c-blue400:  #60a5fa;
    --c-blue500:  #3b82f6;
    --c-blue600:  #2563eb;
    --c-blue700:  #1d4ed8;
    --c-green:    #16a34a;
    --c-green-lt: #f0fdf4;
    --c-green-bd: #bbf7d0;
    --c-amber:    #d97706;
    --c-amber-lt: #fffbeb;
    --c-amber-bd: #fde68a;
    --c-rose:     #e11d48;
    --c-rose-lt:  #fff1f2;
    --c-rose-bd:  #fecdd3;
    --c-violet:   #7c3aed;
    --c-violet-lt:#f5f3ff;
    --c-violet-bd:#ddd6fe;
    --c-hero:     #050f2b;
    --c-hero2:    #0d1f4a;
    --f-display:  'Syne', sans-serif;
    --f-body:     'DM Sans', sans-serif;
    --r-sm:  8px;
    --r-md:  12px;
    --r-lg:  18px;
    --r-xl:  24px;
    font-family: var(--f-body);
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--c-bg);
    overflow: hidden;
    position: relative;
  }

  @keyframes lc-spin    { to { transform: rotate(360deg); } }
  @keyframes lc-shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes lc-fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lc-popIn   { from{opacity:0;transform:scale(.94)} to{opacity:1;transform:scale(1)} }
  @keyframes lc-pulse   { 0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,.22)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,.06)} }
  @keyframes lc-slideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

  .lc-header {
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--c-hero) 0%, var(--c-hero2) 60%, #112255 100%);
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .lc-header::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    mask-image: radial-gradient(ellipse at 40% 50%, rgba(0,0,0,.5) 0%, transparent 65%);
    -webkit-mask-image: radial-gradient(ellipse at 40% 50%, rgba(0,0,0,.5) 0%, transparent 65%);
  }
  .lc-header::after {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 180px; height: 180px;
    background: radial-gradient(ellipse, rgba(59,130,246,0.22) 0%, transparent 70%);
    pointer-events: none;
  }
  .lc-header-left { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; flex: 1; min-width: 0; }
  .lc-header-icon {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.14);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; backdrop-filter: blur(6px); box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  }
  .lc-header-title { font-family: var(--f-display); font-size: 14px; font-weight: 700; color: #fff; line-height: 1.2; letter-spacing: -.02em; }
  .lc-header-sub { font-size: 11px; color: rgba(255,255,255,0.42); margin-top: 2px; font-weight: 400; }
  .lc-header-right { display: flex; align-items: center; gap: 8px; position: relative; z-index: 1; flex-shrink: 0; }
  .lc-live-badge {
    display: flex; align-items: center; gap: 6px;
    background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.25);
    border-radius: 100px; padding: 4px 10px;
    font-size: 10.5px; font-weight: 700; font-family: var(--f-display); color: #4ade80; letter-spacing: .04em;
  }
  .lc-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; animation: lc-pulse 2.4s ease-in-out infinite; }
  .lc-participants-btn {
    width: 32px; height: 32px; border-radius: var(--r-sm);
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.13);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.6); font-size: 14px; transition: all .16s; backdrop-filter: blur(4px);
  }
  .lc-participants-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
  .lc-participants-btn.active { background: rgba(59,130,246,0.25); border-color: rgba(59,130,246,0.4); color: var(--c-blue400); }

  .lc-tabs { flex-shrink: 0; display: flex; gap: 4px; padding: 10px 16px; background: var(--c-surface); border-bottom: 1px solid var(--c-border); }
  .lc-tab {
    padding: 6px 14px; border-radius: var(--r-sm);
    font-size: 11.5px; font-weight: 600; letter-spacing: .03em;
    cursor: pointer; border: 1px solid transparent;
    background: transparent; color: var(--c-ink4); transition: all .15s; font-family: var(--f-display); white-space: nowrap;
  }
  .lc-tab:hover { color: var(--c-ink2); background: var(--c-surface2); }
  .lc-tab.active { background: var(--c-blue50); color: var(--c-blue600); border-color: var(--c-blue200); }

  .lc-body { flex: 1; min-height: 0; display: flex; overflow: hidden; }

  .lc-participants {
    width: 200px; flex-shrink: 0; border-left: 1px solid var(--c-border);
    background: var(--c-surface); display: flex; flex-direction: column; overflow: hidden;
    transition: width .24s cubic-bezier(.4,0,.2,1), opacity .2s;
  }
  .lc-participants.hidden { width: 0; opacity: 0; pointer-events: none; }
  .lc-p-head { padding: 14px 14px 10px; flex-shrink: 0; border-bottom: 1px solid var(--c-border); }
  .lc-p-head-title { font-size: 9.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--c-ink4); font-family: var(--f-display); margin-bottom: 10px; }
  .lc-enroll-card {
    background: linear-gradient(135deg, var(--c-hero) 0%, var(--c-hero2) 100%);
    border-radius: var(--r-md); padding: 10px 12px; display: flex; align-items: center; gap: 9px; position: relative; overflow: hidden;
  }
  .lc-enroll-card::before {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(59,130,246,0.2) 1px, transparent 1px);
    background-size: 14px 14px; pointer-events: none;
    mask-image: radial-gradient(ellipse, rgba(0,0,0,.4) 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse, rgba(0,0,0,.4) 0%, transparent 70%);
  }
  .lc-enroll-emoji { font-size: 20px; position: relative; }
  .lc-enroll-info { position: relative; }
  .lc-enroll-count { font-size: 24px; font-weight: 800; color: #fff; font-family: var(--f-display); line-height: 1; }
  .lc-enroll-label { font-size: 9px; color: rgba(255,255,255,0.4); margin-top: 2px; }
  .lc-online-row { display: flex; gap: 5px; margin-top: 8px; }
  .lc-online-pill { flex: 1; display: flex; align-items: center; gap: 5px; padding: 5px 8px; border-radius: var(--r-sm); font-size: 10.5px; font-weight: 600; font-family: var(--f-display); }
  .lc-online-pill.on  { background: var(--c-green-lt); color: var(--c-green); border: 1px solid var(--c-green-bd); }
  .lc-online-pill.off { background: var(--c-rose-lt); color: var(--c-rose); border: 1px solid var(--c-rose-bd); }
  .lc-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .lc-status-dot.on  { background: var(--c-green); animation: lc-pulse 2.4s ease-in-out infinite; }
  .lc-status-dot.off { background: var(--c-rose); }
  .lc-p-list { flex: 1; overflow-y: auto; padding: 8px; scrollbar-width: thin; scrollbar-color: var(--c-border) transparent; }
  .lc-p-list::-webkit-scrollbar { width: 3px; }
  .lc-p-list::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 3px; }
  .lc-p-section-label { font-size: 9px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--c-ink5); font-family: var(--f-display); padding: 8px 6px 3px; }
  .lc-p-row { display: flex; align-items: center; gap: 8px; padding: 6px 7px; border-radius: var(--r-sm); transition: background .13s; cursor: default; }
  .lc-p-row:hover { background: var(--c-surface2); }
  .lc-p-avatar {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    font-family: var(--f-display); overflow: hidden; position: relative; letter-spacing: .02em;
  }
  .lc-p-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .lc-p-avatar.instructor { background: var(--c-violet-lt); color: var(--c-violet); border: 1px solid var(--c-violet-bd); }
  .lc-p-avatar.student    { background: var(--c-blue50); color: var(--c-blue600); border: 1px solid var(--c-blue200); }
  .lc-p-status-dot { position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid #fff; }
  .lc-p-status-dot.on  { background: var(--c-green); }
  .lc-p-status-dot.off { background: var(--c-ink5); }
  .lc-p-info { flex: 1; min-width: 0; }
  .lc-p-name { font-size: 11.5px; font-weight: 600; color: var(--c-ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--f-display); }
  .lc-p-role { font-size: 10px; color: var(--c-ink4); margin-top: 1px; }
  .lc-p-role.instructor { color: var(--c-violet); font-weight: 600; }
  .lc-p-row.is-self { background: linear-gradient(90deg, rgba(37,99,235,0.06) 0%, rgba(37,99,235,0.02) 100%); border: 1px solid var(--c-blue200); border-radius: var(--r-sm); }
  .lc-p-row.is-self:hover { background: rgba(37,99,235,0.09); }
  .lc-p-you-pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 800; font-family: var(--f-display);
    letter-spacing: .05em; text-transform: uppercase; color: var(--c-blue600);
    background: var(--c-blue50); border: 1.5px solid var(--c-blue200); border-radius: 5px;
    padding: 1px 7px; box-shadow: 0 1px 4px rgba(37,99,235,0.1); flex-shrink: 0;
  }
  .lc-p-name.is-self { color: var(--c-blue700); font-weight: 700; }
  .lc-p-online-status { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; color: var(--c-green); font-weight: 600; }
  .lc-p-online-status::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--c-green); animation: lc-pulse 2.4s ease-in-out infinite; }

  .lc-chat-col { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

  .lc-messages {
    flex: 1; overflow-y: auto; padding: 20px 20px 12px;
    display: flex; flex-direction: column; gap: 0; scroll-behavior: smooth;
    scrollbar-width: thin; scrollbar-color: var(--c-border) transparent; background: var(--c-bg);
  }
  .lc-messages::-webkit-scrollbar { width: 4px; }
  .lc-messages::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 4px; }

  .lc-date-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 14px; flex-shrink: 0; }
  .lc-date-line { flex: 1; height: 1px; background: var(--c-border); }
  .lc-date-label { font-size: 9.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--c-ink4); white-space: nowrap; font-family: var(--f-display); background: var(--c-bg); padding: 0 4px; }

  .lc-msg-group { display: flex; flex-direction: column; gap: 2px; margin-bottom: 14px; animation: lc-slideUp .22s ease both; }
  .lc-msg-group.own { align-items: flex-end; }
  .lc-msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; padding: 0 2px; }
  .lc-msg-group.own .lc-msg-header { flex-direction: row-reverse; }

  .lc-avatar {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .03em; overflow: hidden; font-family: var(--f-display); box-shadow: 0 2px 8px rgba(15,23,42,0.1);
  }
  .lc-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .lc-avatar.av-own        { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #92400e; border: 1px solid #fcd34d; }
  .lc-avatar.av-instructor { background: var(--c-violet-lt); color: var(--c-violet); border: 1px solid var(--c-violet-bd); }
  .lc-avatar.av-student    { background: var(--c-blue50); color: var(--c-blue600); border: 1px solid var(--c-blue200); }

  .lc-sender-name { font-size: 12px; font-weight: 700; font-family: var(--f-display); letter-spacing: -.01em; }
  .lc-sender-name.own        { color: #92400e; }
  .lc-sender-name.instructor { color: var(--c-violet); }
  .lc-sender-name.student    { color: var(--c-ink2); }

  .lc-role-tag { font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 2px 6px; border-radius: 5px; font-family: var(--f-display); background: var(--c-violet-lt); color: var(--c-violet); border: 1px solid var(--c-violet-bd); }
  .lc-resolved-tag { font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; padding: 2px 6px; border-radius: 5px; font-family: var(--f-display); background: var(--c-green-lt); color: var(--c-green); border: 1px solid var(--c-green-bd); display: inline-flex; align-items: center; gap: 3px; }
  .lc-you-tag { display: inline-flex; align-items: center; font-size: 11.5px; font-weight: 800; font-family: var(--f-display); letter-spacing: .03em; color: var(--c-blue600); background: var(--c-blue50); border: 1.5px solid var(--c-blue200); border-radius: 6px; padding: 1px 8px; box-shadow: 0 1px 4px rgba(37,99,235,0.12); }
  .lc-msg-time { font-size: 10px; color: var(--c-ink5); font-weight: 400; margin-left: 2px; }

  .lc-bubble-row { display: flex; align-items: flex-end; gap: 8px; }
  .lc-msg-group.own .lc-bubble-row { flex-direction: row-reverse; }
  .lc-avatar-spacer { width: 32px; flex-shrink: 0; }

  .lc-bubble { max-width: min(72%, 480px); padding: 11px 15px; border-radius: var(--r-lg); font-size: 13.5px; line-height: 1.7; word-break: break-word; position: relative; transition: box-shadow .15s; }
  .lc-bubble.bbl-student { background: var(--c-surface); border: 1px solid var(--c-border); color: var(--c-ink2); border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); }
  .lc-bubble.bbl-student:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.09); }
  .lc-bubble.bbl-instructor { background: var(--c-violet-lt); border: 1px solid var(--c-violet-bd); color: #3b1fa5; border-bottom-left-radius: 4px; box-shadow: 0 1px 6px rgba(124,58,237,0.1); }
  .lc-bubble.bbl-instructor:hover { box-shadow: 0 3px 14px rgba(124,58,237,0.16); }
  .lc-bubble.bbl-own { background: linear-gradient(135deg, var(--c-blue500), var(--c-blue700)); color: #fff; border: none; border-bottom-right-radius: 4px; box-shadow: 0 3px 14px rgba(37,99,235,0.28); position: relative; overflow: hidden; }
  .lc-bubble.bbl-own::after { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent); animation: lc-shimmer 3s ease-in-out infinite; }
  .lc-bubble.bbl-own:hover { box-shadow: 0 6px 22px rgba(37,99,235,0.36); transform: translateY(-1px); }

  .lc-reply-quote { border-left: 3px solid rgba(0,0,0,0.12); padding-left: 10px; margin-bottom: 8px; font-size: 11.5px; opacity: .7; border-radius: 0 4px 4px 0; background: rgba(0,0,0,0.04); padding: 5px 10px; border-radius: 6px; margin-bottom: 9px; }
  .lc-bubble.bbl-own .lc-reply-quote { border-left-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.1); }
  .lc-reply-quote-sender { font-weight: 700; font-size: 10.5px; margin-bottom: 2px; display: block; font-family: var(--f-display); }
  .lc-reply-quote-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

  .lc-file-card { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: var(--r-md); margin-top: 8px; transition: all .15s; cursor: pointer; min-width: 0; }
  .bbl-student .lc-file-card, .bbl-instructor .lc-file-card { background: var(--c-bg); border: 1px solid var(--c-border); }
  .bbl-student .lc-file-card:hover, .bbl-instructor .lc-file-card:hover { border-color: var(--c-blue200); background: var(--c-blue50); box-shadow: 0 2px 10px rgba(37,99,235,0.09); }
  .bbl-own .lc-file-card { background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.2); }
  .bbl-own .lc-file-card:hover { background: rgba(255,255,255,0.2); }
  .lc-file-icon-wrap { width: 36px; height: 36px; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .fi-pdf  { background: #fee2e2; color: #dc2626; }
  .fi-img  { background: var(--c-amber-lt); color: var(--c-amber); }
  .fi-zip  { background: var(--c-violet-lt); color: var(--c-violet); }
  .fi-doc  { background: var(--c-blue50); color: var(--c-blue600); }
  .fi-xls  { background: var(--c-green-lt); color: var(--c-green); }
  .fi-other{ background: var(--c-surface2); color: var(--c-ink4); }
  .lc-file-meta { flex: 1; min-width: 0; }
  .lc-file-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
  .bbl-own .lc-file-name { color: #fff; }
  .lc-file-size { font-size: 10.5px; margin-top: 1px; }
  .bbl-own .lc-file-size { color: rgba(255,255,255,0.6); }
  .lc-file-dl { width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0; background: var(--c-border); display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all .14s; }
  .bbl-student .lc-file-card:hover .lc-file-dl, .bbl-instructor .lc-file-card:hover .lc-file-dl { background: var(--c-blue600); color: #fff; }
  .bbl-own .lc-file-card:hover .lc-file-dl { background: rgba(255,255,255,0.2); color: #fff; }

  .lc-msg-actions { display: flex; gap: 5px; margin-top: 5px; opacity: 0; transition: opacity .15s; padding: 0 4px; }
  .lc-bubble-row:hover + .lc-msg-actions, .lc-msg-actions:hover { opacity: 1; }
  .lc-msg-action-btn { background: none; border: 1px solid var(--c-border); cursor: pointer; font-size: 10.5px; color: var(--c-ink4); padding: 2px 9px; border-radius: 6px; font-family: var(--f-body); transition: all .13s; font-weight: 500; }
  .lc-msg-action-btn:hover { background: var(--c-surface); color: var(--c-ink2); border-color: var(--c-border2); }
  .lc-msg-action-btn.resolve { color: var(--c-green); border-color: var(--c-green-bd); }
  .lc-msg-action-btn.resolve:hover { background: var(--c-green-lt); }
  .lc-msg-group.own .lc-msg-actions { justify-content: flex-end; }

  .lc-loading { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; color: var(--c-ink4); font-size: 13px; }
  .lc-spinner { width: 18px; height: 18px; border: 2px solid var(--c-border); border-top-color: var(--c-blue500); border-radius: 50%; animation: lc-spin .75s linear infinite; }

  .lc-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px 24px; }
  .lc-empty-icon { width: 60px; height: 60px; border-radius: 18px; background: var(--c-blue50); border: 1px solid var(--c-blue200); display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 4px 16px rgba(37,99,235,0.1); animation: lc-popIn .3s ease both; }
  .lc-empty-title { font-family: var(--f-display); font-size: 15px; font-weight: 700; color: var(--c-ink2); }
  .lc-empty-sub   { font-size: 13px; color: var(--c-ink4); text-align: center; line-height: 1.6; max-width: 220px; }

  .lc-error-bar { margin: 8px 16px; padding: 10px 14px; background: var(--c-rose-lt); border: 1px solid var(--c-rose-bd); border-radius: var(--r-sm); font-size: 12px; color: var(--c-rose); display: flex; align-items: center; gap: 7px; flex-shrink: 0; }

  .lc-new-badge { position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--c-blue600); color: #fff; font-size: 11.5px; font-weight: 700; font-family: var(--f-display); padding: 7px 16px; border-radius: 100px; cursor: pointer; z-index: 10; box-shadow: 0 4px 16px rgba(37,99,235,0.4); transition: all .15s; white-space: nowrap; letter-spacing: .03em; }
  .lc-new-badge:hover { background: var(--c-blue700); transform: translateX(-50%) translateY(-2px); }

  .lc-compose { flex-shrink: 0; padding: 12px 16px 14px; background: var(--c-surface); border-top: 1px solid var(--c-border); }

  .lc-reply-bar { display: flex; align-items: center; gap: 10px; padding: 8px 12px; margin-bottom: 10px; background: var(--c-blue50); border: 1px solid var(--c-blue200); border-radius: var(--r-sm); font-size: 12px; animation: lc-fadeUp .2s ease both; }
  .lc-reply-bar-icon { color: var(--c-blue500); font-size: 13px; flex-shrink: 0; }
  .lc-reply-bar-sender { font-weight: 700; font-family: var(--f-display); color: var(--c-blue700); margin-right: 4px; }
  .lc-reply-bar-text { color: var(--c-ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .lc-reply-bar-close { background: none; border: none; cursor: pointer; color: var(--c-ink4); font-size: 14px; line-height: 1; padding: 0 2px; flex-shrink: 0; transition: color .13s; }
  .lc-reply-bar-close:hover { color: var(--c-rose); }

  .lc-file-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
  .lc-file-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: var(--c-blue50); border: 1px solid var(--c-blue200); border-radius: 7px; font-size: 11px; color: var(--c-ink2); max-width: 160px; }
  .lc-chip-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .lc-chip-rm { background: none; border: none; cursor: pointer; color: var(--c-ink4); font-size: 13px; padding: 0; line-height: 1; flex-shrink: 0; transition: color .13s; }
  .lc-chip-rm:hover { color: var(--c-rose); }

  .lc-input-row { display: flex; align-items: flex-end; gap: 8px; }
  .lc-textarea-wrap { flex: 1; position: relative; }
  .lc-textarea { width: 100%; box-sizing: border-box; padding: 11px 14px; border-radius: var(--r-md); border: 1.5px solid var(--c-border2); font-family: var(--f-body); font-size: 13.5px; line-height: 1.55; color: var(--c-ink); background: var(--c-bg); resize: none; min-height: 44px; max-height: 130px; transition: border-color .15s, box-shadow .15s; outline: none; }
  .lc-textarea:focus { border-color: var(--c-blue500); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); background: var(--c-surface); }
  .lc-textarea::placeholder { color: var(--c-ink4); }

  .lc-compose-actions { display: flex; gap: 6px; align-items: flex-end; }
  .lc-icon-btn { width: 40px; height: 40px; border-radius: var(--r-sm); display: flex; align-items: center; justify-content: center; font-size: 16px; border: 1.5px solid var(--c-border2); background: var(--c-surface); cursor: pointer; transition: all .14s; flex-shrink: 0; }
  .lc-icon-btn:hover { background: var(--c-blue50); border-color: var(--c-blue200); }

  .lc-send-btn { width: 40px; height: 40px; border-radius: var(--r-sm); flex-shrink: 0; background: linear-gradient(135deg, var(--c-blue500), var(--c-blue700)); border: none; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; cursor: pointer; transition: all .15s; box-shadow: 0 3px 12px rgba(37,99,235,0.3); position: relative; overflow: hidden; }
  .lc-send-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent); animation: lc-shimmer 2.8s ease-in-out infinite; pointer-events: none; }
  .lc-send-btn:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 5px 18px rgba(37,99,235,0.4); }
  .lc-send-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }

  .lc-hint { margin-top: 7px; font-size: 10.5px; color: var(--c-ink5); display: flex; align-items: center; gap: 5px; }
  .lc-hint kbd { padding: 1px 5px; border: 1px solid var(--c-border2); border-radius: 4px; font-size: 10px; font-family: var(--f-body); background: var(--c-surface2); color: var(--c-ink4); }

  @media (max-width: 540px) {
    .lc-participants { display: none !important; }
    .lc-header { padding: 12px 14px; }
    .lc-tabs { padding: 8px 12px; }
    .lc-messages { padding: 14px 14px 10px; }
    .lc-compose { padding: 10px 12px 12px; }
    .lc-bubble { max-width: 85%; }
  }
`;

// ─── Helpers ─────────────────────────────────────────────
const isOnline = (t) => t && Date.now() - new Date(t).getTime() < ONLINE_THRESHOLD_MS;
const fileIcon = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "pdf") return { icon: "📄", cls: "fi-pdf" };
  if (["png","jpg","jpeg","gif","webp"].includes(ext)) return { icon: "🖼️", cls: "fi-img" };
  if (["zip","rar","7z"].includes(ext)) return { icon: "🗜️", cls: "fi-zip" };
  if (["doc","docx"].includes(ext)) return { icon: "📝", cls: "fi-doc" };
  if (["xls","xlsx","csv"].includes(ext)) return { icon: "📊", cls: "fi-xls" };
  return { icon: "📎", cls: "fi-other" };
};
const fmtSize = (b) => !b ? "" : b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
const fmtTime = (s) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (s) => {
  const d = new Date(s), today = new Date();
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString())  return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};
const initials = (n) => (n || "?").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

// ─── ParticipantRow ──────────────────────────────────────
function ParticipantRow({ p, currentUser }) {
  const isInstructor = p.role === "admin" || p.role === "instructor";
  const online       = isOnline(p.lastActive);
  const isSelf       = currentUser?._id && p._id?.toString() === currentUser._id.toString();
  const avatarUrl    = typeof p.avatar === "string" ? p.avatar : p.avatar?.url || null;
  return (
    <div className={`lc-p-row${isSelf ? " is-self" : ""}`}>
      <div className={`lc-p-avatar ${isInstructor ? "instructor" : "student"}`}>
        {avatarUrl
          ? <img src={avatarUrl} alt={p.name} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          : initials(p.name)}
        <div className={`lc-p-status-dot ${online ? "on" : "off"}`} />
      </div>
      <div className="lc-p-info">
        <div className={`lc-p-name${isSelf ? " is-self" : ""}`} title={p.name}>
          {isSelf ? "You" : p.name}
        </div>
        <div className={`lc-p-role${isInstructor ? " instructor" : ""}`}>
          {isInstructor ? "Instructor" : online
            ? <span className="lc-p-online-status">Online</span>
            : "Offline"}
        </div>
      </div>
      {isSelf && <span className="lc-p-you-pill">You</span>}
    </div>
  );
}

// ─── ParticipantsPanel ───────────────────────────────────
function ParticipantsPanel({ participants, enrolledCount, visible, currentUser }) {
  const instructors = participants.filter(p => p.role === "admin" || p.role === "instructor");
  const students    = participants.filter(p => p.role !== "admin" && p.role !== "instructor");
  const sortSelfFirst = (a, b) => {
    const as = currentUser?._id && a._id?.toString() === currentUser._id.toString();
    const bs = currentUser?._id && b._id?.toString() === currentUser._id.toString();
    if (as) return -1; if (bs) return 1;
    const ao = isOnline(a.lastActive), bo = isOnline(b.lastActive);
    return ao === bo ? 0 : ao ? -1 : 1;
  };
  const onlineCount = participants.filter(p => isOnline(p.lastActive)).length;
  return (
    <div className={`lc-participants${!visible ? " hidden" : ""}`}>
      <div className="lc-p-head">
        <div className="lc-p-head-title">Participants</div>
        <div className="lc-enroll-card">
          <div className="lc-enroll-emoji">🎓</div>
          <div className="lc-enroll-info">
            <div className="lc-enroll-count">{enrolledCount}</div>
            <div className="lc-enroll-label">Enrolled</div>
          </div>
        </div>
        <div className="lc-online-row">
          <div className="lc-online-pill on"><div className="lc-status-dot on" />{onlineCount} online</div>
          <div className="lc-online-pill off"><div className="lc-status-dot off" />{participants.length - onlineCount} offline</div>
        </div>
      </div>
      <div className="lc-p-list">
        {instructors.length > 0 && (<>
          <div className="lc-p-section-label">Instructors</div>
          {[...instructors].sort(sortSelfFirst).map(p => <ParticipantRow key={p._id} p={p} currentUser={currentUser} />)}
        </>)}
        {students.length > 0 && (<>
          <div className="lc-p-section-label" style={{ marginTop: 6 }}>Students</div>
          {[...students].sort(sortSelfFirst).map(p => <ParticipantRow key={p._id} p={p} currentUser={currentUser} />)}
        </>)}
        {participants.length === 0 && (
          <div style={{ padding: "24px 8px", textAlign: "center", fontSize: 12, color: "var(--c-ink4)" }}>
            No participants yet
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────
export default function LessonChat({ courseId, lessonId, currentUser }) {
  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const textareaRef    = useRef(null);
  const fileInputRef   = useRef(null);
  const initialDone    = useRef(false);
  const prevCount      = useRef(0);

  const [messages,      setMessages]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [error,         setError]         = useState("");
  const [text,          setText]          = useState("");
  const [files,         setFiles]         = useState([]);
  const [replyTo,       setReplyTo]       = useState(null);
  const [tab,           setTab]           = useState("all");
  const [atBottom,      setAtBottom]      = useState(true);
  const [newCount,      setNewCount]      = useState(0);
  const [participants,  setParticipants]  = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [panelOpen,     setPanelOpen]     = useState(true);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "instructor";

  const fetchParticipants = useCallback(async () => {
    try {
      const r = await api.get(`/courses/${courseId}/lessons/${lessonId}/chat/participants`);
      const d = r.data.data || r.data;
      setParticipants(d.participants || []);
      setEnrolledCount(d.enrolledCount ?? d.participants?.length ?? 0);
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn("[LessonChat] participants rate-limited, will retry next interval");
      }
    }
  }, [courseId, lessonId]);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const r = await api.get(`/courses/${courseId}/lessons/${lessonId}/chat`);
      const incoming = r.data.data?.messages || r.data.messages || [];
      setMessages(prev => {
        if (initialDone.current && !atBottom && incoming.length > prev.length)
          setNewCount(n => n + (incoming.length - prev.length));
        return incoming;
      });
    } catch (err) {
      if (err.response?.status === 429) {
        console.warn("[LessonChat] messages rate-limited, will retry next interval");
        return;
      }
      if (!silent) setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId, atBottom]);

  const sendHeartbeat = useCallback(async () => {
    try {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/chat/heartbeat`);
    } catch (_) {}
  }, [courseId, lessonId]);

  useEffect(() => {
    initialDone.current = false;
    prevCount.current   = 0;
    fetchMessages().then(() => { initialDone.current = true; });
    fetchParticipants();
    sendHeartbeat();
    const msgTimer       = setInterval(() => fetchMessages(true),  POLL_MESSAGES_MS);
    const partTimer      = setInterval(() => fetchParticipants(),  POLL_PARTICIPANTS_MS);
    const heartbeatTimer = setInterval(() => sendHeartbeat(),      HEARTBEAT_MS);
    return () => { clearInterval(msgTimer); clearInterval(partTimer); clearInterval(heartbeatTimer); };
  }, [fetchMessages, fetchParticipants, sendHeartbeat]);

  useEffect(() => {
    const cur = messages.length;
    if (!initialDone.current) { prevCount.current = cur; return; }
    if (cur > prevCount.current && atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewCount(0);
    }
    prevCount.current = cur;
  }, [messages, atBottom]);

  const handleScroll = () => {
    const el = messagesBoxRef.current; if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(bottom);
    if (bottom) setNewCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setAtBottom(true); setNewCount(0);
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  // THE FIX: pass { headers: { 'Content-Type': undefined } } so axios does NOT
  // override the multipart/form-data boundary that the browser sets automatically.
  // Without this, axios sends Content-Type: application/json and multer sees no files.
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;

    console.log("[handleSend] ── Starting send ─────────────────────────────");
    console.log("[handleSend] text         :", JSON.stringify(trimmed));
    console.log("[handleSend] files count  :", files.length);
    console.log("[handleSend] replyTo      :", replyTo?._id ?? null);

    setSending(true);
    setError("");

    try {
      const form = new FormData();
      form.append("content", trimmed);
      if (replyTo) form.append("replyToId", replyTo._id);
      files.forEach(f => form.append("files", f));

      // ── Log every FormData entry so we can verify files are attached ──
      console.log("[handleSend] FormData entries:");
      for (const [key, val] of form.entries()) {
        if (val instanceof File) {
          console.log(`[handleSend]   ${key} → File( name=${val.name}, type=${val.type}, size=${val.size} )`);
        } else {
          console.log(`[handleSend]   ${key} → "${val}"`);
        }
      }

      console.log("[handleSend] Sending POST with Content-Type: undefined (multipart boundary set by browser)");

      const response = await api.post(
        `/courses/${courseId}/lessons/${lessonId}/chat`,
        form,
        {
          // ▼▼▼ THIS IS THE CRITICAL FIX ▼▼▼
          // Setting Content-Type to undefined tells axios to remove its default
          // 'application/json' header and let the browser set the correct
          // 'multipart/form-data; boundary=...' header automatically.
          // Without this, multer on the server never sees the files.
          headers: { "Content-Type": undefined },
        }
      );

      console.log("[handleSend] ✓ POST success, status:", response.status);
      console.log("[handleSend] response data:", response.data);

      setText("");
      setFiles([]);
      setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      await fetchMessages(true);
      scrollToBottom();

    } catch (err) {
      console.error("[handleSend] ✗ POST failed");
      console.error("[handleSend] status  :", err.response?.status);
      console.error("[handleSend] body    :", err.response?.data);
      console.error("[handleSend] message :", err.message);

      if (err.response?.status === 429) {
        setError("You're sending messages too quickly. Please wait a moment.");
      } else {
        setError(err.response?.data?.message || "Failed to send message.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  };

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    console.log("[handleFileChange] files chosen:", chosen.map(f => `${f.name} (${f.type}, ${f.size}b)`));
    setFiles(prev => [...prev, ...chosen].slice(0, 5));
    e.target.value = "";
  };

  const removeFile = (i) => {
    console.log("[removeFile] removing file at index:", i);
    setFiles(f => f.filter((_, idx) => idx !== i));
  };

  const handleDownload = async (msgId, fi, fileName) => {
    console.log("[handleDownload] msgId:", msgId, "| fileIndex:", fi, "| fileName:", fileName);
    try {
      const res = await api.get(
        `/courses/${courseId}/lessons/${lessonId}/chat/download/${msgId}/${fi}`,
        { responseType: "blob" }
      );
      console.log("[handleDownload] ✓ blob received, size:", res.data?.size);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.setAttribute("download", fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[handleDownload] ✗ failed:", err.response?.status, err.message);
      setError("Failed to download file.");
    }
  };

  const handleResolve = async (msgId) => {
    console.log("[handleResolve] msgId:", msgId);
    try {
      await api.patch(`/courses/${courseId}/lessons/${lessonId}/chat/${msgId}/resolve`);
      await fetchMessages(true);
    } catch (err) {
      console.error("[handleResolve] failed:", err.response?.data);
    }
  };

  // ── Build grouped message structure ──────────────────
  const visible = messages.filter(m => {
    if (tab === "resources") return m.files?.length > 0;
    if (tab === "mine")      return m.sender?._id?.toString() === currentUser?._id?.toString();
    return true;
  });

  const groups = [];
  visible.forEach((msg, i) => {
    const prev      = visible[i - 1];
    const newDate   = !prev || fmtDate(prev.createdAt) !== fmtDate(msg.createdAt);
    const newSender = !prev || prev.sender?._id !== msg.sender?._id ||
                      new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60000;
    if (newDate) groups.push({ type: "divider", label: fmtDate(msg.createdAt) });
    if (newSender) {
      groups.push({ type: "group", sender: msg.sender, msgs: [msg] });
    } else {
      groups[groups.length - 1].msgs.push(msg);
    }
  });

  const renderGroup = (g) => {
    const isSelf       = currentUser?._id && g.sender?._id?.toString() === currentUser._id.toString();
    const isInstructor = g.sender?.role === "admin" || g.sender?.role === "instructor";
    const avatarUrl    = typeof g.sender?.avatar === "string" ? g.sender.avatar : g.sender?.avatar?.url || null;
    const avCls        = isSelf ? "av-own" : isInstructor ? "av-instructor" : "av-student";
    const nameCls      = isSelf ? "own" : isInstructor ? "instructor" : "student";
    const bubbleCls    = isSelf ? "bbl-own" : isInstructor ? "bbl-instructor" : "bbl-student";

    return (
      <div key={g.msgs[0]._id} className={`lc-msg-group${isSelf ? " own" : ""}`}>
        <div className="lc-msg-header">
          <div className={`lc-avatar ${avCls}`}>
            {avatarUrl
              ? <img src={avatarUrl} alt={g.sender?.name}
                  onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentNode.textContent = initials(g.sender?.name); }} />
              : initials(g.sender?.name)}
          </div>
          {isSelf
            ? <span className="lc-you-tag">You</span>
            : <span className={`lc-sender-name ${nameCls}`}>{g.sender?.name}</span>}
          {isInstructor && <span className="lc-role-tag">Instructor</span>}
          <span className="lc-msg-time">{fmtTime(g.msgs[0].createdAt)}</span>
        </div>

        {g.msgs.map((msg) => (
          <div key={msg._id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="lc-bubble-row">
              <div className="lc-avatar-spacer" />
              <div className={`lc-bubble ${bubbleCls}`}>
                {msg.replyTo && (
                  <div className="lc-reply-quote">
                    <span className="lc-reply-quote-sender">{msg.replyTo.sender?.name}</span>
                    <span className="lc-reply-quote-text">{msg.replyTo.content?.slice(0, 60) || "Attachment"}</span>
                  </div>
                )}
                {msg.content && <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>}
                {msg.resolved && <span className="lc-resolved-tag" style={{ marginLeft: 8 }}>✓ Resolved</span>}
                {msg.files?.map((f, fi) => {
                  const { icon, cls } = fileIcon(f.name);
                  return (
                    <div key={fi} className="lc-file-card" onClick={() => handleDownload(msg._id, fi, f.name)}>
                      <div className={`lc-file-icon-wrap ${cls}`}>{icon}</div>
                      <div className="lc-file-meta">
                        <span className="lc-file-name">{f.name}</span>
                        <span className="lc-file-size">{fmtSize(f.size)}</span>
                      </div>
                      <div className="lc-file-dl">⬇</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="lc-msg-actions">
              <button className="lc-msg-action-btn" onClick={() => setReplyTo(msg)}>↩ Reply</button>
              {isAdmin && !msg.resolved && (
                <button className="lc-msg-action-btn resolve" onClick={() => handleResolve(msg._id)}>✓ Resolve</button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const onlineNow = participants.filter(p => isOnline(p.lastActive)).length;

  return (
    <>
      <style>{styles}</style>
      <div className="lc-root">

        <div className="lc-header">
          <div className="lc-header-left">
            <div className="lc-header-icon">💬</div>
            <div className="lc-header-text">
              <div className="lc-header-title">Discussion</div>
              <div className="lc-header-sub">{enrolledCount} enrolled · {onlineNow} online now</div>
            </div>
          </div>
          <div className="lc-header-right">
            <div className="lc-live-badge"><div className="lc-live-dot" />Live</div>
            <button
              className={`lc-participants-btn${panelOpen ? " active" : ""}`}
              onClick={() => setPanelOpen(v => !v)}
              title={panelOpen ? "Hide participants" : "Show participants"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="lc-tabs">
          {[["all","All Messages"],["resources","📎 Resources"],["mine","My Questions"]].map(([k,l]) => (
            <button key={k} className={`lc-tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="lc-body">
          <div className="lc-chat-col">
            {loading ? (
              <div className="lc-loading"><div className="lc-spinner" />Loading discussion…</div>
            ) : (
              <div className="lc-messages" ref={messagesBoxRef} onScroll={handleScroll}>
                {groups.length === 0 ? (
                  <div className="lc-empty">
                    <div className="lc-empty-icon">
                      {tab === "all" ? "🙋" : tab === "resources" ? "📎" : "❓"}
                    </div>
                    <div className="lc-empty-title">
                      {tab === "all" ? "No messages yet" : tab === "resources" ? "No resources" : "No questions yet"}
                    </div>
                    <div className="lc-empty-sub">
                      {tab === "all"
                        ? "Be the first to ask a question or start a discussion!"
                        : tab === "resources"
                        ? "No files or resources have been shared in this lesson."
                        : "You haven't posted any questions yet."}
                    </div>
                  </div>
                ) : (
                  groups.map((item, idx) =>
                    item.type === "divider" ? (
                      <div key={`d${idx}`} className="lc-date-divider">
                        <div className="lc-date-line" />
                        <span className="lc-date-label">{item.label}</span>
                        <div className="lc-date-line" />
                      </div>
                    ) : renderGroup(item)
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {newCount > 0 && !atBottom && (
              <div className="lc-new-badge" onClick={scrollToBottom}>
                ↓ {newCount} new message{newCount > 1 ? "s" : ""}
              </div>
            )}

            {error && <div className="lc-error-bar">⚠ {error}</div>}

            <div className="lc-compose">
              {replyTo && (
                <div className="lc-reply-bar">
                  <span className="lc-reply-bar-icon">↩</span>
                  <span className="lc-reply-bar-sender">{replyTo.sender?.name}</span>
                  <span className="lc-reply-bar-text">{replyTo.content?.slice(0, 55) || "Attachment"}</span>
                  <button className="lc-reply-bar-close" onClick={() => setReplyTo(null)}>✕</button>
                </div>
              )}
              {files.length > 0 && (
                <div className="lc-file-chips">
                  {files.map((f, i) => {
                    const { icon } = fileIcon(f.name);
                    return (
                      <div key={i} className="lc-file-chip">
                        <span>{icon}</span>
                        <span className="lc-chip-name">{f.name}</span>
                        <button className="lc-chip-rm" onClick={() => removeFile(i)}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="lc-input-row">
                <div className="lc-textarea-wrap">
                  <textarea
                    ref={textareaRef}
                    className="lc-textarea"
                    placeholder={isAdmin ? "Reply to students or share resources…" : "Ask a question about this lesson…"}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                </div>
                <div className="lc-compose-actions">
                  <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} multiple hidden onChange={handleFileChange} />
                  <button className="lc-icon-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>📎</button>
                  <button
                    className="lc-send-btn"
                    onClick={handleSend}
                    disabled={sending || (!text.trim() && files.length === 0)}
                  >
                    {sending
                      ? <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "lc-spin .75s linear infinite" }} />
                      : "➤"}
                  </button>
                </div>
              </div>
              <div className="lc-hint">
                Press <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
              </div>
            </div>
          </div>

          <ParticipantsPanel
            participants={participants}
            enrolledCount={enrolledCount}
            visible={panelOpen}
            currentUser={currentUser}
          />
        </div>
      </div>
    </>
  );
}
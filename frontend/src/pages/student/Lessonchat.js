import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  .lc-root {
    --b50:#eff6ff; --b100:#dbeafe; --b200:#bfdbfe; --b300:#93c5fd;
    --b400:#60a5fa; --b500:#3b82f6; --b600:#2563eb; --b700:#1d4ed8;
    --hero:#050f2b;
    --ink:#0f172a; --ink-2:#334155; --ink-3:#64748b; --ink-4:#94a3b8; --ink-5:#cbd5e1;
    --surface:#f8fafc; --surface-2:#f1f5f9;
    --border:rgba(15,23,42,0.08); --border-2:rgba(15,23,42,0.14);
    --white:#ffffff;
    --green:#16a34a; --green-lt:#f0fdf4; --green-mid:#bbf7d0;
    --violet:#7c3aed; --violet-lt:#f5f3ff; --violet-mid:#ddd6fe;
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px;

    font-family: var(--font-body);
    display:flex; flex-direction:column;
    height:100%; width:100%;
    background:var(--white);
    border:1px solid var(--border);
    border-radius:var(--r-lg);
    overflow:hidden; position:relative;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
  }

  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes bounce  { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-4px);opacity:1} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes fadeIn  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse   { 0%,100%{box-shadow:0 0 0 2px rgba(34,197,94,.2)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,.07)} }

  /* ── Header ── */
  .lc-header {
    padding:14px 18px; border-bottom:1px solid var(--border);
    background:linear-gradient(135deg,#050f2b 0%,#0d1f4a 100%);
    display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
    position:relative; overflow:hidden;
  }
  /* Grid texture in header */
  .lc-header::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(59,130,246,0.2) 1px,transparent 1px);
    background-size:22px 22px; pointer-events:none;
    mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.5) 0%,transparent 70%);
    -webkit-mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.5) 0%,transparent 70%);
  }
  /* Radial glow */
  .lc-header::after {
    content:''; position:absolute; top:-30px; right:-30px;
    width:160px; height:160px;
    background:radial-gradient(ellipse,rgba(59,130,246,0.2) 0%,transparent 70%);
    pointer-events:none;
  }

  .lc-header-left { display:flex; align-items:center; gap:10px; position:relative; }
  .lc-header-icon {
    width:34px; height:34px; border-radius:9px;
    background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15);
    display:flex; align-items:center; justify-content:center;
    font-size:15px; flex-shrink:0; backdrop-filter:blur(4px);
  }
  .lc-header-title {
    font-size:13px; font-weight:700; color:#fff; line-height:1.3;
    font-family:var(--font-display); letter-spacing:-.02em;
  }
  .lc-header-sub { font-size:11px; color:rgba(255,255,255,0.45); margin-top:1px; }

  .lc-online-row { display:flex; align-items:center; gap:8px; position:relative; }
  .lc-online-dot {
    width:7px; height:7px; border-radius:50%; background:#22c55e;
    animation:pulse 2.4s ease-in-out infinite;
  }
  .lc-online-label { font-size:11px; color:rgba(255,255,255,0.45); font-weight:500; }

  /* ── Tabs ── */
  .lc-tabs {
    display:flex; gap:2px; padding:9px 14px;
    border-bottom:1px solid var(--border); background:var(--surface); flex-shrink:0;
  }
  .lc-tab {
    padding:5px 12px; border-radius:7px; font-size:11px; font-weight:600;
    letter-spacing:.03em; cursor:pointer; border:none;
    background:transparent; color:var(--ink-4);
    transition:all .14s; font-family:var(--font-display);
  }
  .lc-tab:hover { color:var(--ink-2); background:var(--surface-2); }
  .lc-tab.active { background:var(--b50); color:var(--b600); border:1px solid var(--b200); }

  /* ── Messages ── */
  .lc-messages {
    flex:1; overflow-y:auto; padding:16px;
    display:flex; flex-direction:column; gap:2px;
    scroll-behavior:smooth;
    scrollbar-width:thin; scrollbar-color:var(--border) transparent;
  }
  .lc-messages::-webkit-scrollbar { width:4px; }
  .lc-messages::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }

  /* ── Date divider ── */
  .lc-date-divider {
    display:flex; align-items:center; gap:10px; margin:12px 0 8px; flex-shrink:0;
  }
  .lc-date-divider-line { flex:1; height:1px; background:var(--border); }
  .lc-date-divider-label {
    font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:var(--ink-4); white-space:nowrap; font-family:var(--font-display);
  }

  /* ── Message row ── */
  .lc-msg-row {
    display:flex; gap:9px; align-items:flex-end; padding:2px 0;
    animation:fadeIn .25s ease both;
  }
  .lc-msg-row.own { flex-direction:row-reverse; }
  .lc-msg-row.grouped .lc-avatar { visibility:hidden; }
  .lc-msg-row.grouped .lc-msg-meta { display:none; }

  .lc-avatar {
    width:30px; height:30px; border-radius:8px; flex-shrink:0;
    font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center;
    text-transform:uppercase; letter-spacing:.02em; overflow:hidden;
    border:1px solid var(--border); font-family:var(--font-display);
  }
  .lc-avatar img { width:100%; height:100%; object-fit:cover; }
  .lc-avatar.admin-av   { background:var(--violet-lt); color:var(--violet); border-color:var(--violet-mid); }
  .lc-avatar.student-av { background:var(--b50); color:var(--b600); border-color:var(--b200); }
  .lc-avatar.own-av     { background:#fef3c7; color:#92400e; border-color:#fde68a; }

  .lc-bubble-wrap { display:flex; flex-direction:column; flex:1; min-width:0; }
  .lc-msg-row.own .lc-bubble-wrap { align-items:flex-end; }

  .lc-msg-meta { display:flex; align-items:center; gap:7px; margin-bottom:4px; padding:0 2px; }
  .lc-msg-row.own .lc-msg-meta { flex-direction:row-reverse; }

  .lc-sender {
    font-size:11px; font-weight:700; color:var(--ink-2); letter-spacing:.01em;
    font-family:var(--font-display);
  }
  .lc-sender.admin { color:var(--violet); }
  .lc-sender.own   { color:#92400e; }
  .lc-admin-tag {
    font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
    padding:1px 6px; border-radius:4px;
    background:var(--violet-lt); color:var(--violet); border:1px solid var(--violet-mid);
    font-family:var(--font-display);
  }
  .lc-timestamp { font-size:10px; color:var(--ink-5); flex-shrink:0; }

  .lc-bubble {
    padding:10px 14px; border-radius:11px;
    font-size:13.5px; line-height:1.65; color:var(--ink-2);
    position:relative; word-break:break-word;
    transition:box-shadow .15s; width:100%; box-sizing:border-box;
  }
  .lc-bubble.student {
    background:var(--white); border:1px solid var(--border);
    border-bottom-left-radius:3px;
  }
  .lc-bubble.admin {
    background:var(--violet-lt); border:1px solid var(--violet-mid);
    border-bottom-left-radius:3px; color:#3b1fa5;
  }
  .lc-bubble.own {
    background:linear-gradient(135deg,var(--b500),var(--b700));
    border:none; border-bottom-right-radius:3px; color:#fff;
    box-shadow:0 3px 12px rgba(37,99,235,0.25);
  }
  .lc-bubble.student:hover { box-shadow:0 2px 10px rgba(15,23,42,0.07); }
  .lc-bubble.own:hover { box-shadow:0 5px 18px rgba(37,99,235,0.3); }

  /* ── File card ── */
  .lc-file-card {
    display:flex; align-items:center; gap:10px;
    padding:10px 13px; border-radius:9px;
    background:var(--surface); border:1px solid var(--border);
    margin-top:7px; text-decoration:none;
    transition:all .14s; width:100%; box-sizing:border-box; min-width:0;
    cursor:pointer;
  }
  .lc-file-card:hover { border-color:var(--b300); background:var(--b50); box-shadow:0 2px 10px rgba(37,99,235,0.1); }
  .lc-file-icon {
    width:34px; height:34px; border-radius:8px;
    display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0;
  }
  .lc-file-icon.pdf   { background:#fee2e2; color:#dc2626; }
  .lc-file-icon.img   { background:#fef3c7; color:#d97706; }
  .lc-file-icon.zip   { background:var(--violet-lt); color:var(--violet); }
  .lc-file-icon.doc   { background:var(--b50); color:var(--b600); }
  .lc-file-icon.xls   { background:var(--green-lt); color:var(--green); }
  .lc-file-icon.other { background:var(--surface-2); color:var(--ink-4); }
  .lc-file-info { flex:1; min-width:0; }
  .lc-file-name {
    font-size:12px; font-weight:600; color:var(--ink-2);
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;
  }
  .lc-file-size { font-size:11px; color:var(--ink-4); }
  .lc-file-dl {
    width:28px; height:28px; border-radius:7px;
    background:var(--border); display:flex; align-items:center; justify-content:center;
    font-size:12px; flex-shrink:0; transition:all .14s;
  }
  .lc-file-card:hover .lc-file-dl { background:var(--b600); color:#fff; }

  /* ── Empty ── */
  .lc-empty {
    flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:12px; padding:40px;
  }
  .lc-empty-icon {
    width:56px; height:56px; border-radius:16px;
    background:var(--b50); border:1px solid var(--b200);
    display:flex; align-items:center; justify-content:center; font-size:24px;
    box-shadow:0 2px 10px rgba(37,99,235,0.1);
  }
  .lc-empty-text { font-size:14px; font-weight:600; color:var(--ink-2); font-family:var(--font-display); }
  .lc-empty-sub  { font-size:12px; color:var(--ink-4); text-align:center; }

  /* ── Loading ── */
  .lc-loading {
    flex:1; display:flex; align-items:center; justify-content:center;
    gap:10px; color:var(--ink-4); font-size:13px;
  }
  .lc-spinner {
    width:18px; height:18px; border:2px solid var(--border); border-top-color:var(--b500);
    border-radius:50%; animation:spin .7s linear infinite;
  }

  /* ── Error bar ── */
  .lc-err-bar {
    margin:8px 12px; padding:9px 13px;
    background:#fff1f2; border:1px solid #fecdd3;
    border-radius:8px; font-size:12px; color:#e11d48;
    display:flex; align-items:center; gap:7px;
  }

  /* ── Resolved tag ── */
  .lc-resolved-tag {
    display:inline-flex; align-items:center; gap:4px;
    padding:1px 7px; border-radius:4px;
    background:var(--green-lt); color:var(--green); border:1px solid var(--green-mid);
    font-size:9px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
    margin-left:6px; font-family:var(--font-display);
  }

  /* ── New message badge ── */
  .lc-new-badge {
    position:absolute; bottom:76px; left:50%; transform:translateX(-50%);
    background:var(--b600); color:#fff;
    font-size:11px; font-weight:700; font-family:var(--font-display);
    padding:6px 14px; border-radius:100px;
    cursor:pointer; z-index:10;
    box-shadow:0 3px 12px rgba(37,99,235,0.35);
    transition:all .14s; white-space:nowrap; letter-spacing:.02em;
  }
  .lc-new-badge:hover { background:var(--b700); transform:translateX(-50%) translateY(-2px); }

  /* ── Compose ── */
  .lc-compose {
    border-top:1px solid var(--border); padding:11px 13px;
    background:var(--white); flex-shrink:0;
  }

  .lc-reply-preview {
    display:flex; align-items:center; gap:8px;
    padding:7px 11px; background:var(--b50); border-left:3px solid var(--b500);
    border-radius:0 7px 7px 0; margin-bottom:9px;
    font-size:12px; color:var(--b600);
  }
  .lc-reply-preview-text { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .lc-reply-cancel {
    background:none; border:none; cursor:pointer;
    color:var(--ink-4); font-size:14px; padding:0 2px; line-height:1;
  }
  .lc-reply-cancel:hover { color:var(--ink); }

  .lc-file-strip { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:9px; }
  .lc-file-chip {
    display:inline-flex; align-items:center; gap:6px; padding:4px 9px;
    background:var(--b50); border:1px solid var(--b200);
    border-radius:7px; font-size:11px; color:var(--ink-2); max-width:160px;
  }
  .lc-file-chip-name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
  .lc-file-chip-rm {
    background:none; border:none; cursor:pointer;
    color:var(--ink-4); font-size:13px; padding:0; line-height:1; flex-shrink:0;
  }
  .lc-file-chip-rm:hover { color:#e11d48; }

  .lc-input-row { display:flex; align-items:flex-end; gap:8px; }
  .lc-textarea-wrap { flex:1; position:relative; }
  .lc-textarea {
    width:100%; box-sizing:border-box;
    padding:10px 13px; border:1.5px solid var(--border-2); border-radius:9px;
    font-family:var(--font-body); font-size:13.5px; line-height:1.55;
    color:var(--ink); background:var(--surface);
    resize:none; min-height:42px; max-height:130px;
    transition:border-color .15s, box-shadow .15s; outline:none;
  }
  .lc-textarea:focus {
    border-color:var(--b500);
    box-shadow:0 0 0 3px rgba(59,130,246,0.1);
    background:var(--white);
  }
  .lc-textarea::placeholder { color:var(--ink-4); }

  .lc-compose-btns { display:flex; gap:6px; align-items:flex-end; }
  .lc-ic-btn {
    width:38px; height:38px; border-radius:9px;
    display:flex; align-items:center; justify-content:center; font-size:16px;
    border:1.5px solid var(--border-2); background:var(--white);
    cursor:pointer; transition:all .14s; flex-shrink:0;
  }
  .lc-ic-btn:hover { background:var(--b50); border-color:var(--b200); }

  /* Shimmer send button */
  .lc-send-btn {
    position:relative; overflow:hidden;
    width:38px; height:38px; border-radius:9px;
    background:linear-gradient(135deg,var(--b500),var(--b700));
    border:none; display:flex; align-items:center; justify-content:center;
    font-size:15px; color:#fff; cursor:pointer;
    transition:all .14s; flex-shrink:0;
    box-shadow:0 2px 10px rgba(37,99,235,0.28);
  }
  .lc-send-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .lc-send-btn:hover:not(:disabled) { box-shadow:0 4px 16px rgba(37,99,235,0.38); transform:scale(1.05); }
  .lc-send-btn:disabled { opacity:.45; cursor:not-allowed; transform:none; }

  .lc-compose-hint {
    margin-top:6px; font-size:11px; color:var(--ink-5);
  }
  .lc-compose-hint kbd {
    padding:1px 5px; border:1px solid var(--border-2);
    border-radius:4px; font-size:10px; font-family:var(--font-body);
  }
`;

const ACCEPT_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.zip,.txt,.mp4,.mp3';

function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return { icon: '📄', cls: 'pdf' };
  if (['png','jpg','jpeg','gif','webp'].includes(ext)) return { icon: '🖼️', cls: 'img' };
  if (['zip','rar','7z'].includes(ext)) return { icon: '🗜️', cls: 'zip' };
  if (['doc','docx'].includes(ext)) return { icon: '📝', cls: 'doc' };
  if (['xls','xlsx','csv'].includes(ext)) return { icon: '📊', cls: 'xls' };
  return { icon: '📎', cls: 'other' };
}
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function fmtTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(dateStr) {
  const d = new Date(dateStr), today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const POLL_MS = 6000;

export default function LessonChat({ courseId, lessonId, currentUser }) {
  const messagesEndRef = useRef(null);
  const messagesBoxRef = useRef(null);
  const textareaRef    = useRef(null);
  const fileInputRef   = useRef(null);
  const pollRef        = useRef(null);

  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');
  const [text, setText]           = useState('');
  const [files, setFiles]         = useState([]);
  const [replyTo, setReplyTo]     = useState(null);
  const [tab, setTab]             = useState('all');
  const [atBottom, setAtBottom]   = useState(true);
  const [newCount, setNewCount]   = useState(0);
  const [participantCount, setParticipantCount] = useState(0);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  const handleDownload = async (msgId, fileIndex, fileName) => {
    try {
      const res = await api.get(
        `/courses/${courseId}/lessons/${lessonId}/chat/download/${msgId}/${fileIndex}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', fileName);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { setError('Failed to download file.'); }
  };

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const r = await api.get(`/courses/${courseId}/lessons/${lessonId}/chat`);
      const incoming = r.data.data?.messages || r.data.messages || [];
      const count    = r.data.data?.participantCount || r.data.participantCount || 0;
      setParticipantCount(count);
      setMessages(prev => {
        if (!atBottom && incoming.length > prev.length)
          setNewCount(n => n + (incoming.length - prev.length));
        return incoming;
      });
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'Failed to load messages');
    } finally { setLoading(false); }
  }, [courseId, lessonId, atBottom]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    if (atBottom) { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setNewCount(0); }
  }, [messages, atBottom]);

  const handleScroll = () => {
    const el = messagesBoxRef.current; if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(bottom); if (bottom) setNewCount(0);
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAtBottom(true); setNewCount(0);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && files.length === 0) return;
    setSending(true); setError('');
    try {
      const form = new FormData();
      form.append('content', trimmed);
      if (replyTo) form.append('replyToId', replyTo._id);
      files.forEach(f => form.append('files', f));
      await api.post(`/courses/${courseId}/lessons/${lessonId}/chat`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText(''); setFiles([]); setReplyTo(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      await fetchMessages(true); scrollToBottom();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally { setSending(false); }
  };

  const handleKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleTextChange = e => {
    setText(e.target.value);
    const el = e.target; el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  };
  const handleFileChange = e => {
    setFiles(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 5));
    e.target.value = '';
  };
  const removeFile = idx => setFiles(f => f.filter((_, i) => i !== idx));

  const handleResolve = async msgId => {
    try {
      await api.patch(`/courses/${courseId}/lessons/${lessonId}/chat/${msgId}/resolve`);
      await fetchMessages(true);
    } catch { }
  };

  const visibleMessages = messages.filter(m => {
    if (tab === 'resources') return m.files?.length > 0;
    if (tab === 'mine') return m.sender?._id?.toString() === currentUser?._id?.toString();
    return true;
  });

  const grouped = visibleMessages.reduce((acc, msg, i, arr) => {
    const dateLabel  = fmtDate(msg.createdAt);
    const prev       = arr[i - 1];
    const sameDate   = prev && fmtDate(prev.createdAt) === dateLabel;
    const sameSender = prev && prev.sender?._id === msg.sender?._id
      && (new Date(msg.createdAt) - new Date(prev.createdAt)) < 5 * 60000;
    if (!sameDate) acc.push({ type: 'divider', label: dateLabel });
    acc.push({ type: 'message', msg, grouped: sameDate && sameSender });
    return acc;
  }, []);

  const renderMessage = (msg, isGrouped) => {
    const isSelf      = currentUser?._id && msg.sender?._id?.toString() === currentUser._id.toString();
    const senderAdmin = msg.sender?.role === 'admin' || msg.sender?.role === 'instructor';
    const rowCls      = `lc-msg-row${isSelf ? ' own' : ''}${isGrouped ? ' grouped' : ''}`;
    const avCls       = isSelf ? 'own-av' : senderAdmin ? 'admin-av' : 'student-av';
    const bubbleCls   = isSelf ? 'own' : senderAdmin ? 'admin' : 'student';

    return (
      <div key={msg._id} className={rowCls} id={`msg-${msg._id}`}>
        <div className={`lc-avatar ${avCls}`}>
          {(() => {
            const url = typeof msg.sender?.avatar === 'string' ? msg.sender.avatar : msg.sender?.avatar?.url || null;
            return url
              ? <img src={url} alt={msg.sender?.name}
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentNode.textContent = initials(msg.sender?.name); }} />
              : initials(msg.sender?.name);
          })()}
        </div>

        <div className="lc-bubble-wrap">
          {!isGrouped && (
            <div className="lc-msg-meta">
              <span className={`lc-sender${senderAdmin ? ' admin' : isSelf ? ' own' : ''}`}>
                {isSelf ? 'You' : msg.sender?.name}
                {senderAdmin && <span className="lc-admin-tag" style={{ marginLeft: 5 }}>Admin</span>}
                {msg.resolved && <span className="lc-resolved-tag">✓ Resolved</span>}
              </span>
              <span className="lc-timestamp">{fmtTime(msg.createdAt)}</span>
            </div>
          )}

          {msg.replyTo && (
            <div style={{
              borderLeft: '3px solid var(--b400)', paddingLeft: 8, marginBottom: 5,
              fontSize: 11, color: 'var(--ink-4)', maxWidth: '100%', overflow: 'hidden'
            }}>
              <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>{msg.replyTo.sender?.name}</span>
              {' · '}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msg.replyTo.content?.slice(0, 60) || 'Attachment'}
              </span>
            </div>
          )}

          <div className={`lc-bubble ${bubbleCls}`}>
            {msg.content && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>}
            {msg.files?.map((f, fi) => {
              const { icon, cls } = fileIcon(f.name);
              return (
                <div key={fi} className="lc-file-card"
                  style={isSelf ? { background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)' } : {}}
                  onClick={() => handleDownload(msg._id, fi, f.name)}>
                  <div className={`lc-file-icon ${cls}`}>{icon}</div>
                  <div className="lc-file-info">
                    <span className="lc-file-name" style={isSelf ? { color: '#fff' } : {}}>{f.name}</span>
                    <span className="lc-file-size" style={isSelf ? { color: 'rgba(255,255,255,0.6)' } : {}}>{fmtSize(f.size)}</span>
                  </div>
                  <div className="lc-file-dl">⬇</div>
                </div>
              );
            })}
          </div>

          <div style={{
            display: 'flex', gap: 6, marginTop: 3, paddingLeft: 2,
            justifyContent: isSelf ? 'flex-end' : 'flex-start'
          }}>
            <button onClick={() => setReplyTo(msg)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--ink-4)', padding: '0 2px', fontFamily: 'var(--font-body)'
            }}>↩ Reply</button>
            {isAdmin && !msg.resolved && (
              <button onClick={() => handleResolve(msg._id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--green)', padding: '0 2px', fontFamily: 'var(--font-body)'
              }}>✓ Resolve</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="lc-root">
        <div className="lc-header">
          <div className="lc-header-left">
            <div className="lc-header-icon">💬</div>
            <div>
              <div className="lc-header-title">Lesson Discussion</div>
              <div className="lc-header-sub">{participantCount} participant{participantCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="lc-online-row">
            <div className="lc-online-dot" />
            <span className="lc-online-label">Live</span>
          </div>
        </div>

        <div className="lc-tabs">
          {[['all','All Messages'],['resources','📎 Resources'],['mine','My Questions']].map(([key, label]) => (
            <button key={key} className={`lc-tab${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="lc-loading"><div className="lc-spinner" /> Loading discussion…</div>
        ) : (
          <div className="lc-messages" ref={messagesBoxRef} onScroll={handleScroll}>
            {grouped.length === 0 ? (
              <div className="lc-empty">
                <div className="lc-empty-icon">🙋</div>
                <div className="lc-empty-text">No messages yet</div>
                <div className="lc-empty-sub">
                  {tab === 'all' ? 'Be the first to ask a question!' :
                   tab === 'resources' ? 'No resources shared yet.' :
                   "You haven't asked any questions yet."}
                </div>
              </div>
            ) : grouped.map((item, idx) =>
              item.type === 'divider'
                ? <div key={`d-${idx}`} className="lc-date-divider">
                    <div className="lc-date-divider-line" />
                    <div className="lc-date-divider-label">{item.label}</div>
                    <div className="lc-date-divider-line" />
                  </div>
                : renderMessage(item.msg, item.grouped)
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {newCount > 0 && !atBottom && (
          <div className="lc-new-badge" onClick={scrollToBottom}>
            ↓ {newCount} new message{newCount > 1 ? 's' : ''}
          </div>
        )}

        {error && <div className="lc-err-bar">⚠ {error}</div>}

        <div className="lc-compose">
          {replyTo && (
            <div className="lc-reply-preview">
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>↩ {replyTo.sender?.name}:</span>
              <span className="lc-reply-preview-text">{replyTo.content?.slice(0, 60) || 'Attachment'}</span>
              <button className="lc-reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
            </div>
          )}

          {files.length > 0 && (
            <div className="lc-file-strip">
              {files.map((f, i) => {
                const { icon } = fileIcon(f.name);
                return (
                  <div key={i} className="lc-file-chip">
                    <span>{icon}</span>
                    <span className="lc-file-chip-name">{f.name}</span>
                    <button className="lc-file-chip-rm" onClick={() => removeFile(i)}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="lc-input-row">
            <div className="lc-textarea-wrap">
              <textarea ref={textareaRef} className="lc-textarea"
                placeholder={isAdmin ? 'Reply to students, share resources…' : 'Ask a question about this lesson…'}
                value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} rows={1} />
            </div>
            <div className="lc-compose-btns">
              <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES} multiple hidden onChange={handleFileChange} />
              <button className="lc-ic-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>📎</button>
              <button className="lc-send-btn" onClick={handleSend}
                disabled={sending || (!text.trim() && files.length === 0)}>
                {sending
                  ? <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .75s linear infinite' }} />
                  : '➤'}
              </button>
            </div>
          </div>
          <div className="lc-compose-hint">
            Press <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for new line
          </div>
        </div>
      </div>
    </>
  );
}
import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../services/api';

/* ─────────────────────────────────────────────
   LessonChat
   Props:
     courseId  – string
     lessonId  – string
     currentUser – { _id, name, role, avatar? }
   ───────────────────────────────────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Epilogue:wght@300;400;500;600&display=swap');

  /* ── Shell ── */
  .lc-root {
    --bg: #f7f7f5;
    --white: #ffffff;
    --border: #e4e4df;
    --border-strong: #d0d0c8;
    --accent: #1a56db;
    --accent-light: #eff4ff;
    --accent-dark: #1649c5;
    --text: #111118;
    --text2: #44444f;
    --muted: #888896;
    --success: #0e7c59;
    --success-bg: #f0faf6;
    --success-border: #b6e8d5;
    --admin: #6d28d9;
    --admin-bg: #f5f3ff;
    --admin-border: #ddd6fe;
    --file-bg: #fafaf8;
    --file-border: #e4e4df;

    font-family: 'Epilogue', sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }

  /* ── Header ── */
  .lc-header {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    background: #fcfcfb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .lc-header-left { display: flex; align-items: center; gap: 10px; }
  .lc-header-icon {
    width: 32px; height: 32px;
    border-radius: 8px;
    background: var(--accent-light);
    border: 1px solid #c7d9ff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .lc-header-title {
    font-size: 13px; font-weight: 600; color: var(--text);
    line-height: 1.3;
  }
  .lc-header-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .lc-online-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
    animation: lc-pulse 2.4s ease-in-out infinite;
  }
  @keyframes lc-pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(34,197,94,0.2); }
    50%       { box-shadow: 0 0 0 5px rgba(34,197,94,0.08); }
  }

  /* ── Filter tabs ── */
  .lc-tabs {
    display: flex;
    gap: 2px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: #fafaf8;
    flex-shrink: 0;
  }
  .lc-tab {
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.03em;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--muted);
    transition: all 0.14s;
    font-family: 'Epilogue', sans-serif;
  }
  .lc-tab:hover { color: var(--text2); background: #f2f2ef; }
  .lc-tab.active { background: var(--accent-light); color: var(--accent); }

  /* ── Messages ── */
  .lc-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .lc-messages::-webkit-scrollbar { width: 4px; }
  .lc-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ── Date divider ── */
  .lc-date-divider {
    display: flex; align-items: center; gap: 10px;
    margin: 12px 0 8px; flex-shrink: 0;
  }
  .lc-date-divider-line { flex: 1; height: 1px; background: var(--border); }
  .lc-date-divider-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--muted);
    white-space: nowrap;
  }

  /* ── Message bubble ── */
  .lc-msg-row {
    display: flex;
    gap: 9px;
    align-items: flex-end;
    padding: 2px 0;
    transition: opacity 0.2s;
  }
  .lc-msg-row.own { flex-direction: row-reverse; }
  .lc-msg-row.grouped .lc-avatar { visibility: hidden; }
  .lc-msg-row.grouped .lc-msg-meta { display: none; }

  .lc-avatar {
    width: 30px; height: 30px;
    border-radius: 8px;
    flex-shrink: 0;
    font-size: 12px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .lc-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .lc-avatar.admin-av { background: var(--admin-bg); color: var(--admin); border-color: var(--admin-border); }
  .lc-avatar.student-av { background: var(--accent-light); color: var(--accent); }
  .lc-avatar.own-av { background: #fef3c7; color: #92400e; }

  .lc-bubble-wrap { display: flex; flex-direction: column; max-width: 70%; min-width: 0; }
  .lc-msg-row.own .lc-bubble-wrap { align-items: flex-end; }

  .lc-msg-meta {
    display: flex; align-items: center; gap: 7px;
    margin-bottom: 4px; padding: 0 2px;
  }
  .lc-msg-row.own .lc-msg-meta { flex-direction: row-reverse; }
  .lc-sender {
    font-size: 11px; font-weight: 600; color: var(--text2); letter-spacing: 0.01em;
  }
  .lc-sender.admin { color: var(--admin); }
  .lc-sender.own   { color: #92400e; }
  .lc-admin-tag {
    font-size: 9px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 1px 5px; border-radius: 3px;
    background: var(--admin-bg); color: var(--admin);
    border: 1px solid var(--admin-border);
  }
  .lc-timestamp {
    font-size: 10px; color: var(--muted); flex-shrink: 0;
  }

  .lc-bubble {
    padding: 9px 13px;
    border-radius: 10px;
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--text2);
    position: relative;
    word-break: break-word;
    transition: box-shadow 0.15s;
  }
  .lc-bubble.student {
    background: var(--white);
    border: 1px solid var(--border);
    border-bottom-left-radius: 3px;
  }
  .lc-bubble.admin {
    background: var(--admin-bg);
    border: 1px solid var(--admin-border);
    border-bottom-left-radius: 3px;
    color: #3b1fa5;
  }
  .lc-bubble.own {
    background: var(--accent);
    border: none;
    border-bottom-right-radius: 3px;
    color: #fff;
  }
  .lc-bubble:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }

  /* ── File attachment ── */
  .lc-file-card {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    border-radius: 8px;
    background: var(--file-bg);
    border: 1px solid var(--file-border);
    margin-top: 6px;
    text-decoration: none;
    transition: all 0.14s;
    max-width: 280px;
    min-width: 0;
  }
  .lc-file-card:hover { border-color: var(--accent); background: var(--accent-light); }
  .lc-file-icon {
    width: 34px; height: 34px;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }
  .lc-file-icon.pdf    { background: #fee2e2; color: #dc2626; }
  .lc-file-icon.img    { background: #fef3c7; color: #d97706; }
  .lc-file-icon.zip    { background: #ede9fe; color: #7c3aed; }
  .lc-file-icon.doc    { background: #dbeafe; color: #2563eb; }
  .lc-file-icon.xls    { background: #d1fae5; color: #059669; }
  .lc-file-icon.other  { background: #f3f4f6; color: #6b7280; }
  .lc-file-info { flex: 1; min-width: 0; }
  .lc-file-name {
    font-size: 12px; font-weight: 600; color: var(--text2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    display: block;
  }
  .lc-file-size { font-size: 11px; color: var(--muted); }
  .lc-file-dl {
    width: 26px; height: 26px;
    border-radius: 6px;
    background: var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; flex-shrink: 0;
  }
  .lc-file-card:hover .lc-file-dl { background: var(--accent); color: #fff; }

  /* ── Empty state ── */
  .lc-empty {
    flex: 1; display: flex;
    flex-direction: column; align-items: center; justify-content: center;
    gap: 10px; padding: 40px;
  }
  .lc-empty-icon {
    width: 52px; height: 52px;
    border-radius: 14px;
    background: var(--accent-light);
    border: 1px solid #c7d9ff;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .lc-empty-text { font-size: 14px; font-weight: 500; color: var(--text2); }
  .lc-empty-sub  { font-size: 12px; color: var(--muted); text-align: center; }

  /* ── Typing indicator ── */
  .lc-typing {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 0 4px 42px;
    font-size: 11px; color: var(--muted);
  }
  .lc-typing-dots { display: flex; gap: 3px; }
  .lc-typing-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--muted);
    animation: lc-bounce 1.2s ease-in-out infinite;
  }
  .lc-typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .lc-typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes lc-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%           { transform: translateY(-4px); opacity: 1; }
  }

  /* ── Compose ── */
  .lc-compose {
    border-top: 1px solid var(--border);
    padding: 10px 12px;
    background: var(--white);
    flex-shrink: 0;
  }

  /* Reply preview */
  .lc-reply-preview {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px;
    background: var(--accent-light);
    border-left: 3px solid var(--accent);
    border-radius: 0 6px 6px 0;
    margin-bottom: 8px;
    font-size: 12px; color: var(--accent);
  }
  .lc-reply-preview-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lc-reply-cancel {
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 14px; padding: 0 2px;
    line-height: 1;
  }
  .lc-reply-cancel:hover { color: var(--text); }

  /* File preview strip */
  .lc-file-strip {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-bottom: 8px;
  }
  .lc-file-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 8px;
    background: var(--file-bg); border: 1px solid var(--file-border);
    border-radius: 6px; font-size: 11px; color: var(--text2);
    max-width: 160px;
  }
  .lc-file-chip-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .lc-file-chip-rm {
    background: none; border: none; cursor: pointer;
    color: var(--muted); font-size: 13px; padding: 0; line-height: 1;
    flex-shrink: 0;
  }
  .lc-file-chip-rm:hover { color: #c0392b; }

  /* Input row */
  .lc-input-row {
    display: flex; align-items: flex-end; gap: 8px;
  }
  .lc-textarea-wrap { flex: 1; position: relative; }
  .lc-textarea {
    width: 100%; box-sizing: border-box;
    padding: 9px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    font-family: 'Epilogue', sans-serif;
    font-size: 13.5px; line-height: 1.55;
    color: var(--text);
    background: #fafaf8;
    resize: none;
    min-height: 40px; max-height: 130px;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .lc-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(26,86,219,0.1);
    background: var(--white);
  }
  .lc-textarea::placeholder { color: var(--muted); }

  /* Compose buttons */
  .lc-compose-btns { display: flex; gap: 6px; align-items: flex-end; }
  .lc-ic-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    border: 1px solid var(--border-strong);
    background: var(--white);
    cursor: pointer;
    transition: all 0.14s;
    flex-shrink: 0;
  }
  .lc-ic-btn:hover { background: #f2f2ef; border-color: #bbbbb0; }
  .lc-send-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: var(--accent);
    border: none;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; color: #fff;
    cursor: pointer;
    transition: all 0.14s;
    flex-shrink: 0;
  }
  .lc-send-btn:hover:not(:disabled) { background: var(--accent-dark); transform: scale(1.04); }
  .lc-send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

  /* ── Tooltip ── */
  .lc-tooltip {
    position: relative;
  }
  .lc-tooltip::after {
    content: attr(data-tip);
    position: absolute;
    bottom: calc(100% + 5px); left: 50%; transform: translateX(-50%);
    background: var(--text); color: #fff;
    font-size: 10px; white-space: nowrap;
    padding: 3px 7px; border-radius: 4px;
    opacity: 0; pointer-events: none;
    transition: opacity 0.14s;
  }
  .lc-tooltip:hover::after { opacity: 1; }

  /* ── Loading / Error ── */
  .lc-loading {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 10px; color: var(--muted); font-size: 13px;
  }
  .lc-spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: vpspin 0.75s linear infinite;
  }
  @keyframes vpspin { to { transform: rotate(360deg); } }

  .lc-err-bar {
    margin: 8px 12px; padding: 8px 12px;
    background: #fef5f4; border: 1px solid #f4c5c0;
    border-radius: 7px; font-size: 12px; color: #c0392b;
    display: flex; align-items: center; gap: 7px;
  }

  /* ── Resolved tag ── */
  .lc-resolved-tag {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 1px 6px; border-radius: 4px;
    background: var(--success-bg); color: var(--success);
    border: 1px solid var(--success-border);
    font-size: 9px; font-weight: 700; letter-spacing: 0.07em;
    text-transform: uppercase; margin-left: 6px;
  }

  /* ── New message badge ── */
  .lc-new-badge {
    position: absolute;
    bottom: 70px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: #fff;
    font-size: 11px; font-weight: 600;
    padding: 5px 12px; border-radius: 20px;
    cursor: pointer; z-index: 10;
    box-shadow: 0 2px 8px rgba(26,86,219,0.3);
    transition: all 0.14s;
    white-space: nowrap;
  }
  .lc-new-badge:hover { background: var(--accent-dark); transform: translateX(-50%) translateY(-2px); }
`;

/* ────────────────── helpers ────────────────── */
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
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

/* Polling interval in ms */
const POLL_MS = 6000;

/* ────────────────── component ────────────────── */
export default function LessonChat({ courseId, lessonId, currentUser }) {
  const messagesEndRef  = useRef(null);
  const messagesBoxRef  = useRef(null);
  const textareaRef     = useRef(null);
  const fileInputRef    = useRef(null);
  const pollRef         = useRef(null);

  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState('');
  const [text, setText]               = useState('');
  const [files, setFiles]             = useState([]);       // File[] pending upload
  const [replyTo, setReplyTo]         = useState(null);     // message object
  const [tab, setTab]                 = useState('all');    // 'all' | 'resources' | 'mine'
  const [atBottom, setAtBottom]       = useState(true);
  const [newCount, setNewCount]       = useState(0);
  const [participantCount, setParticipantCount] = useState(0);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  /* ── authenticated file download ──
     Uses the api axios instance (correct baseURL + auth header already set).
     Backend returns a signed Cloudinary URL via redirect — axios follows it
     and we get the blob back.                                            ── */
  const handleDownload = async (msgId, fileIndex, fileName) => {
    try {
      const res = await api.get(
        `/courses/${courseId}/lessons/${lessonId}/chat/download/${msgId}/${fileIndex}`,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  /* ── fetch messages ── */
  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const r = await api.get(`/courses/${courseId}/lessons/${lessonId}/chat`);
      const incoming = r.data.data?.messages || r.data.messages || [];
      const count    = r.data.data?.participantCount || r.data.participantCount || 0;
      setParticipantCount(count);
      setMessages(prev => {
        const wasBottom = atBottom;
        const isNew     = incoming.length > prev.length;
        if (!wasBottom && isNew) setNewCount(n => n + (incoming.length - prev.length));
        return incoming;
      });
    } catch (err) {
      if (!silent) setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId, atBottom]);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(() => fetchMessages(true), POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  /* ── auto-scroll ── */
  useEffect(() => {
    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewCount(0);
    }
  }, [messages, atBottom]);

  const handleScroll = () => {
    const el = messagesBoxRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAtBottom(bottom);
    if (bottom) setNewCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setAtBottom(true); setNewCount(0);
  };

  /* ── send ── */
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
      if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
      await fetchMessages(true);
      scrollToBottom();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 130) + 'px';
  };

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...chosen].slice(0, 5)); // max 5
    e.target.value = '';
  };

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx));

  /* ── mark resolved (admin) ── */
  const handleResolve = async (msgId) => {
    try {
      await api.patch(`/courses/${courseId}/lessons/${lessonId}/chat/${msgId}/resolve`);
      await fetchMessages(true);
    } catch { /* ignore */ }
  };

  /* ── filter messages ── */
  const visibleMessages = messages.filter(m => {
    if (tab === 'resources') return m.files?.length > 0;
    if (tab === 'mine')      return m.sender?._id?.toString() === currentUser?._id?.toString();
    return true;
  });

  /* ── group messages by date + consecutive sender ── */
  const grouped = visibleMessages.reduce((acc, msg, i, arr) => {
    const dateLabel = fmtDate(msg.createdAt);
    const prev      = arr[i - 1];
    const sameDate  = prev && fmtDate(prev.createdAt) === dateLabel;
    const sameSender = prev && prev.sender?._id === msg.sender?._id
      && (new Date(msg.createdAt) - new Date(prev.createdAt)) < 5 * 60000;
    if (!sameDate) acc.push({ type: 'divider', label: dateLabel });
    acc.push({ type: 'message', msg, grouped: sameDate && sameSender });
    return acc;
  }, []);

  /* ── render message bubble ── */
  const renderMessage = (msg, isGrouped) => {
    const isSelf      = currentUser?._id &&
                        msg.sender?._id?.toString() === currentUser._id.toString();
    const senderAdmin = msg.sender?.role === 'admin' || msg.sender?.role === 'instructor';
    const rowCls      = `lc-msg-row${isSelf ? ' own' : ''}${isGrouped ? ' grouped' : ''}`;
    const avCls       = isSelf ? 'own-av' : senderAdmin ? 'admin-av' : 'student-av';
    const bubbleCls   = isSelf ? 'own' : senderAdmin ? 'admin' : 'student';

    return (
      <div key={msg._id} className={rowCls} id={`msg-${msg._id}`}>
        <div className={`lc-avatar ${avCls}`}>
          {(() => {
              const avatarUrl = typeof msg.sender?.avatar === 'string'
                ? msg.sender.avatar
                : msg.sender?.avatar?.url || null;
              return avatarUrl
                ? <img src={avatarUrl} alt={msg.sender?.name}
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentNode.textContent = initials(msg.sender?.name); }} />
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

          {/* Reply context */}
          {msg.replyTo && (
            <div style={{
              borderLeft: '3px solid var(--accent)',
              paddingLeft: 8, marginBottom: 5,
              fontSize: 11, color: 'var(--muted)',
              maxWidth: '100%', overflow: 'hidden'
            }}>
              <span style={{ fontWeight: 600 }}>{msg.replyTo.sender?.name}</span>
              {' · '}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msg.replyTo.content?.slice(0, 60) || 'Attachment'}
              </span>
            </div>
          )}

          <div className={`lc-bubble ${bubbleCls}`}>
            {msg.content && <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>}

            {/* File attachments */}
            {msg.files?.map((f, fi) => {
              const { icon, cls } = fileIcon(f.name);
              return (
                <div key={fi}
                  className="lc-file-card"
                  style={{ cursor: 'pointer', ...(isSelf ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' } : {}) }}
                  onClick={() => handleDownload(msg._id, fi, f.name)}>
                  <div className={`lc-file-icon ${cls}`}>{icon}</div>
                  <div className="lc-file-info">
                    <span className="lc-file-name"
                      style={isSelf ? { color: '#fff' } : {}}>{f.name}</span>
                    <span className="lc-file-size"
                      style={isSelf ? { color: 'rgba(255,255,255,0.7)' } : {}}>{fmtSize(f.size)}</span>
                  </div>
                  <div className="lc-file-dl">⬇</div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex', gap: 6, marginTop: 3, paddingLeft: 2,
            justifyContent: isSelf ? 'flex-end' : 'flex-start'
          }}>
            <button onClick={() => setReplyTo(msg)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--muted)', padding: '0 2px'
            }}>↩ Reply</button>
            {isAdmin && !msg.resolved && (
              <button onClick={() => handleResolve(msg._id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--success)', padding: '0 2px'
              }}>✓ Resolve</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── render ── */
  return (
    <>
      <style>{styles}</style>
      <div className="lc-root">

        {/* Header */}
        <div className="lc-header">
          <div className="lc-header-left">
            <div className="lc-header-icon">💬</div>
            <div>
              <div className="lc-header-title">Lesson Discussion</div>
              <div className="lc-header-sub">{participantCount} participant{participantCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="lc-online-dot" />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Live</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="lc-tabs">
          {[['all', 'All Messages'], ['resources', '📎 Resources'], ['mine', 'My Questions']].map(([key, label]) => (
            <button key={key} className={`lc-tab${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* Messages */}
        {loading ? (
          <div className="lc-loading"><div className="lc-spinner" /> Loading discussion…</div>
        ) : (
          <div className="lc-messages" ref={messagesBoxRef} onScroll={handleScroll}>
            {grouped.length === 0 ? (
              <div className="lc-empty">
                <div className="lc-empty-icon">🙋</div>
                <div className="lc-empty-text">No messages yet</div>
                <div className="lc-empty-sub">
                  {tab === 'all' ? 'Be the first to ask a question about this lesson!' :
                   tab === 'resources' ? 'No resources have been shared yet.' :
                   'You haven\'t asked any questions yet.'}
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

        {/* Scroll-to-bottom badge */}
        {newCount > 0 && !atBottom && (
          <div className="lc-new-badge" onClick={scrollToBottom}>
            ↓ {newCount} new message{newCount > 1 ? 's' : ''}
          </div>
        )}

        {/* Error bar */}
        {error && <div className="lc-err-bar">⚠ {error}</div>}

        {/* Compose */}
        <div className="lc-compose">
          {replyTo && (
            <div className="lc-reply-preview">
              <span style={{ fontSize: 11, fontWeight: 600 }}>↩ Replying to {replyTo.sender?.name}:</span>
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
              <textarea
                ref={textareaRef}
                className="lc-textarea"
                placeholder={isAdmin ? 'Reply to students, share resources…' : 'Ask a question about this lesson…'}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
            </div>
            <div className="lc-compose-btns">
              <input ref={fileInputRef} type="file" accept={ACCEPT_TYPES}
                multiple hidden onChange={handleFileChange} />
              <button className="lc-ic-btn lc-tooltip" data-tip="Attach file"
                onClick={() => fileInputRef.current?.click()}>📎</button>
              <button
                className="lc-send-btn"
                onClick={handleSend}
                disabled={sending || (!text.trim() && files.length === 0)}>
                {sending
                  ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'vpspin 0.75s linear infinite' }} />
                  : '➤'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
            Press <kbd style={{ padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10 }}>Enter</kbd> to send · <kbd style={{ padding: '1px 4px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 10 }}>Shift + Enter</kbd> for new line
          </div>
        </div>

      </div>
    </>
  );
}
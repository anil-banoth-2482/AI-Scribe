import { useState, useRef, useEffect, useCallback } from "react";
import "./app.css";

// ── Mouse-repelling particle field ────────────────────────
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const mouse = { x: -9999, y: -9999 };
    let particles = [];

    const COLS = 18;
    const ROWS = 11;
    const REPEL_RADIUS = 140;
    const REPEL_FORCE  = 9;
    const SPRING       = 0.055;
    const DAMPING      = 0.72;
    const CONNECT_DIST = 105;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const sx = canvas.width  / COLS;
      const sy = canvas.height / ROWS;
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const hx = sx * c + (Math.random() - 0.5) * sx * 0.25;
          const hy = sy * r + (Math.random() - 0.5) * sy * 0.25;
          particles.push({
            homeX: hx, homeY: hy,
            x: hx, y: hy,
            vx: 0, vy: 0,
            r: Math.random() * 1.4 + 0.6,
          });
        }
      }
    };

    const onMove  = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = ()  => { mouse.x = -9999; mouse.y = -9999; };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Physics
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < REPEL_RADIUS) {
          const force = Math.pow((REPEL_RADIUS - dist) / REPEL_RADIUS, 2) * REPEL_FORCE;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
        p.vx += (p.homeX - p.x) * SPRING;
        p.vy += (p.homeY - p.y) * SPRING;
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x  += p.vx;
        p.y  += p.vy;
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (d < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(56,189,248,${(1 - d / CONNECT_DIST) * 0.13})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Dots
      for (const p of particles) {
        const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
        const hue   = 195 + speed * 4;
        const lit   = 60  + speed * 5;
        const alpha = Math.min(0.18 + speed * 0.04, 0.85);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + speed * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},100%,${lit}%,${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);
    resize();
    tick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

// ── Inline markdown parser ────────────────────────────────
function renderInline(text) {
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  const parts = [];
  let last = 0, key = 0, match;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if      (match[2] !== undefined) parts.push(<strong key={key++}>{match[2]}</strong>);
    else if (match[3] !== undefined) parts.push(<em      key={key++}>{match[3]}</em>);
    else if (match[4] !== undefined) parts.push(<code    key={key++}>{match[4]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// ── SummaryLine — renders one pre-processed line ──────────────────
function SummaryLine({ line, index }) {
  if (!line.trim()) return null;
  // Skip any residual table separator or header rows that slipped through
  if (/^\|\s*[-:| ]+\|\s*$/.test(line.trim())) return null;
  const h = line.match(/^(#{1,3})\s+(.+)/);
  if (h) {
    const Tag = h[1].length === 1 ? 'h3' : 'h4';
    return <Tag key={index} className="summary-heading">{renderInline(h[2])}</Tag>;
  }
  if (/^[-*]\s/.test(line))
    return (
      <div key={index} className="summary-bullet">
        <span>{renderInline(line.slice(2))}</span>
      </div>
    );
  if (/^\d+\.\s/.test(line))
    return (
      <div key={index} className="summary-bullet">
        <span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span>
      </div>
    );
  return <p key={index} className="summary-para">{renderInline(line)}</p>;
}

function formatTs(ts) {
  if (!ts) return "";
  const d   = new Date(ts * 1000);
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yod = new Date(sod - 86400000);
  const t   = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d >= sod)  return `Today, ${t}`;
  if (d >= yod)  return `Yesterday, ${t}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + `, ${t}`;
}

// ── SummaryCard ───────────────────────────────────────────
// Defined at module scope so React can track its identity across renders
// (defining it inside App would cause remount + hook reset on every render)
function SummaryCard({ sum, ts, icon = "✨", title = "Meeting Summary", s3Key, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(title);
  const [saving,  setSaving]  = useState(false);
  const inputRef              = useRef(null);

  useEffect(() => { if (!editing) setDraft(title); }, [title, editing]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === title) { setEditing(false); return; }
    setSaving(true);
    if (onRename) await onRename(s3Key, trimmed);
    setSaving(false);
    setEditing(false);
  };

  const cancel = () => { setDraft(title); setEditing(false); };

  return (
    <div className="card summary-card">
      <div className="result-header">
        <span className="result-icon">{icon}</span>
        {editing ? (
          <div className="title-edit-row">
            <input
              ref={inputRef}
              className="title-edit-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
              maxLength={80}
            />
            <button className="title-edit-btn confirm" onClick={save} disabled={saving} title="Save">
              {saving ? '…' : '✓'}
            </button>
            <button className="title-edit-btn cancel" onClick={cancel} title="Cancel">✕</button>
          </div>
        ) : (
          <div className="title-display-row">
            <h2 className="result-title">{title}</h2>
            {s3Key && onRename && (
              <button
                className="title-edit-trigger"
                onClick={() => { setDraft(title); setEditing(true); }}
                title="Rename this meeting"
              >
                ✏️
              </button>
            )}
          </div>
        )}
        {ts && <span className="history-date">{formatTs(ts)}</span>}
        <button
          className="copy-btn"
          onClick={(e) => {
            navigator.clipboard.writeText(sum);
            const b = e.currentTarget;
            b.textContent = '✓ Copied!';
            setTimeout(() => { b.textContent = '📋 Copy'; }, 1800);
          }}
          title="Copy to clipboard"
        >
          📋 Copy
        </button>
      </div>
      <div className="summary-body">
        {preprocessSummary(sum).split("\n").map((line, i) => <SummaryLine key={i} line={line} index={i} />)}
      </div>
    </div>
  );
}

function preprocessSummary(raw) {
  if (!raw) return '';
  const out = [];

  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) { out.push(''); continue; }

    // ── 1. Table separator rows:  |---|---|  → skip entirely
    if (/^\|\s*[-:|]+(\s*\|\s*[-:|]+)+\s*\|?\s*$/.test(t)) continue;

    // ── 2. Table data row: starts with | and has ≥2 pipe chars
    //       (may or may not end with | — <br> in the cell may have broken it)
    const pipeCount = (t.match(/\|/g) || []).length;
    if (t.startsWith('|') && pipeCount >= 2) {
      const cells = t.split('|').map(c => c.trim()).filter(Boolean);
      const heading = cells[0];
      // Skip the header row (Item | Details) and separator headings
      if (/^(item|details|section|column|category|-+|:+)$/i.test(heading)) continue;
      out.push(`## ${heading}`);
      // All remaining cells = content (strip any trailing stray |)
      const content = cells.slice(1).join(' ').replace(/\|\s*$/, '').trim();
      // Split on <br> (still literal here!) to make individual bullets
      content.split(/<br\s*\/?>/i).forEach(part => {
        const p = part.replace(/\|/g, '').trim(); // drop stray pipes
        const text = p.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (text) out.push(`- ${text}`);
      });
      continue;
    }

    // ── 3. Continuation line: table cell content after <br>→newline split
    //       These start with a bullet or digit and end with a stray |
    if (t.endsWith('|') && !t.startsWith('|')) {
      const p = t.slice(0, -1).trim(); // strip trailing |
      const text = p.replace(/^[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (text) out.push(`- ${text}`);
      continue;
    }

    const boldOnly = t.match(/^\*\*([^*]+)\*\*\s*:?\s*$/);
    if (boldOnly) {
      const heading = boldOnly[1].trim();
      // Drop generic "Summary" / "Meeting Summary" titles — card header already shows it
      if (!/^(meeting\s*)?summary$/i.test(heading)) {
        out.push(`## ${heading}`);
      }
      continue;
    }

    const bulletBold = t.match(/^[-*]\s+\*\*([^*]+)\*\*\s*:?\s*$/);
    if (bulletBold) {
      out.push(`## ${bulletBold[1].trim()}`);
      continue;
    }

    if (/^\s+[-*]\s/.test(line)) {
      out.push(`- ${t.slice(2)}`); 
      continue;
    }

    if (t.startsWith('•')) {
      out.push(`- ${t.slice(1).trim()}`);
      continue;
    }

    const expanded = line.replace(/<br\s*\/?>/gi, '\n');
    out.push(expanded);
  }

  return out.join('\n');
}


const STEPS = [
  { id: "joining",      label: "Joining Meeting", icon: "🤖" },
  { id: "recording",    label: "Recording", icon: "🎙"  },
  { id: "processing",   label: "Processing Audio",icon: "⚙️"  },
  { id: "transcribing", label: "Transcribing ", icon: "🔊"  },
  { id: "summarizing",  label: "Summarizing ", icon: "✨"  },
];

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function App({ user, onSignOut }) {
  // ── Main bot flow ─────────────────────────────────────────
  const [link, setLink]               = useState("");
  const [meetingName, setMeetingName] = useState("");
  const [phase, setPhase]             = useState("idle");
  const [currentStep, setCurrentStep] = useState(null);
  const [statusMessages, setStatusMessages] = useState([]);
  const [summary, setSummary]         = useState("");
  const [transcript, setTranscript]   = useState("");
  const [botId, setBotId]             = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [activeS3Key, setActiveS3Key]   = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const logRef  = useRef(null);
  const esRef   = useRef(null);
  const phaseRef = useRef("idle");

  // ── History sidebar ───────────────────────────────────────
  const [histories, setHistories]           = useState([]);
  const [histLoading, setHistLoading]       = useState(false);
  const [histError, setHistError]           = useState("");
  const [activeKey, setActiveKey]           = useState(null);
  const [historyItem, setHistoryItem]       = useState(null); // { summary, transcript, timestamp }
  const [histItemLoading, setHistItemLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHistTranscript, setShowHistTranscript] = useState(false);

  // ── Get user identifier (uid or email fallback) ────────────────
  const getUserId = () => {
    if (!user) return "";
    // Prefer uid, fallback to email, ensure no empty strings
    const id = user.uid || user.email || "";
    if (!id) console.warn("[App] No user identifier available");
    return id;
  };

  // auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [statusMessages]);

  // ── Fetch history list ────────────────────────────────────
  const fetchHistories = useCallback(async () => {
    setHistLoading(true);
    try {
      const uid  = getUserId();
      if (!uid) { setHistories([]); setHistError(""); setHistLoading(false); return; }
      const res  = await fetch(`${API_BASE}/summaries?uid=${encodeURIComponent(uid)}`);
      const json = await res.json();
      if (json?.error) setHistError(String(json.error));
      else if (json?.storageEnabled === false) setHistError("History storage is disabled on the backend.");
      else setHistError("");
      // Merge: server now returns meetingTitle from S3 metadata.
      // For optimistically-inserted items (not yet in S3), prefer the in-memory title.
      setHistories(prev => {
        const optimistic = {};
        prev.forEach(h => { if (h.meetingTitle) optimistic[h.key] = h.meetingTitle; });
        return (json.summaries || []).map(h => ({
          ...h,
          // Server title wins unless we have an optimistic (newer) local title
          meetingTitle: h.meetingTitle || optimistic[h.key] || undefined,
        }));
      });
    } catch {
      setHistories([]);
      setHistError("Failed to load history. Check the backend logs.");
    } finally {
      setHistLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchHistories(); }, [fetchHistories]);

  // ── Open a history item ───────────────────────────────────
  const openHistory = async (key) => {
    setActiveKey(key);
    setHistoryItem(null);
    setHistItemLoading(true);
    setSidebarOpen(false);
    setShowHistTranscript(false);
    try {
      const uid  = getUserId();
      if (!uid) { setHistoryItem({ error: "User not authenticated." }); setHistItemLoading(false); return; }
      const res  = await fetch(`${API_BASE}/summaries/${encodeURIComponent(key)}?uid=${encodeURIComponent(uid)}`);
      const json = await res.json();
      setHistoryItem(json);
      // Back-fill the title into the sidebar list once we have the full item
      if (json.meetingTitle) {
        setHistories(prev => prev.map(h =>
          h.key === key ? { ...h, meetingTitle: json.meetingTitle } : h
        ));
      }
    } catch {
      setHistoryItem({ error: "Failed to load summary." });
    } finally {
      setHistItemLoading(false);
    }
  };

  const closeHistory = () => { setActiveKey(null); setHistoryItem(null); };

  // ── Bot flow ──────────────────────────────────────────────
  const startBot = () => {
    if (!link.trim()) { alert("Please paste a Google Meet link"); return; }
    closeHistory();
    setPhase("running"); phaseRef.current = "running";
    setCurrentStep("joining");
    setStatusMessages([]); setSummary(""); setTranscript("");
    setBotId(null);
    setErrorMsg(""); setShowTranscript(false);
    if (esRef.current) esRef.current.close();

    // Use user-supplied name immediately so the UI shows it before AI runs
    const userTitle = meetingName.trim();
    if (userTitle) setMeetingTitle(userTitle);

    const uid = getUserId();
    if (!uid) { alert("Please sign in first to record meetings."); setPhase("idle"); return; }

    const username = user?.displayName || user?.email?.split("@")[0] || "User";
    const params = new URLSearchParams({
      meetLink: link.trim(),
      uid,
      username,
      ...(userTitle && { meetingName: userTitle }),
    });
    const es = new EventSource(`${API_BASE}/start?${params}`);
    esRef.current = es;

    es.addEventListener("bot", (e) => {
      const d = JSON.parse(e.data);
      setBotId(d.id || null);
    });
    es.addEventListener("status", (e) => {
      const d = JSON.parse(e.data);
      setCurrentStep(d.step);
      setStatusMessages(prev => [...prev, { type: "info", text: d.message, ts: Date.now() }]);
    });
    es.addEventListener("transcript", (e) => setTranscript(JSON.parse(e.data).text));
    es.addEventListener("done", (e) => {
      const d = JSON.parse(e.data);
      setSummary(d.summary);
      setTranscript(d.transcript || transcript);
      setMeetingTitle(d.meetingTitle || meetingName.trim() || "Meeting Summary");
      setActiveS3Key(d.s3Key || null);
      setBotId(null);
      phaseRef.current = "done"; setPhase("done"); setCurrentStep(null);
      es.close();
      // Optimistically insert current meeting into history sidebar immediately
      if (d.s3Key) {
        const newItem = {
          key: d.s3Key,
          timestamp: Date.now() / 1000,
          size: (d.summary || "").length + (d.transcript || "").length,
          meetingTitle: d.meetingTitle || meetingName.trim() || "Meeting Summary",
        };
        setHistories(prev => [newItem, ...prev.filter(h => h.key !== d.s3Key)]);
      }
      // Then refresh from S3 after a short delay to get authoritative list
      setTimeout(() => fetchHistories(), 2000);
    });
    es.addEventListener("error", (e) => {
      if (e.data) {
        try { setErrorMsg(JSON.parse(e.data).message || "Unknown error."); }
        catch { setErrorMsg("Connection error. Check the backend server."); }
      } else {
        if (phaseRef.current !== "done")
          setErrorMsg("Connection lost. Make sure the backend is running on port 3000.");
        else return;
      }
      phaseRef.current = "error"; setPhase("error"); es.close();
    });
  };

  const finishAndSummarize = async () => {
    if (!botId) {
      setStatusMessages(prev => [...prev, { type: "info", text: "Bot ID not available yet. Please wait a few seconds.", ts: Date.now() }]);
      return;
    }
    try {
      setStatusMessages(prev => [...prev, { type: "info", text: "🛑 Asking bot to leave the meeting…", ts: Date.now() }]);
      await fetch(`${API_BASE}/bot/${encodeURIComponent(botId)}/leave`, { method: "POST" });
      setStatusMessages(prev => [...prev, { type: "info", text: "⏳ Bot is leaving. Waiting for recording upload…", ts: Date.now() }]);
    } catch {
      setStatusMessages(prev => [...prev, { type: "error", text: "Failed to ask bot to leave. Check backend logs.", ts: Date.now() }]);
    }
  };

  const reset = () => {
    if (esRef.current) esRef.current.close();
    phaseRef.current = "idle"; setPhase("idle"); setCurrentStep(null);
    setStatusMessages([]); setSummary(""); setTranscript("");
    setMeetingTitle(""); setMeetingName(""); setActiveS3Key(null); setBotId(null); setErrorMsg(""); setShowTranscript(false);
  };

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const showingHistory = !!historyItem || histItemLoading;

  // ── Rename meeting title ───────────────────────────────────
  const renameTitle = async (s3Key, newTitle) => {
    if (!s3Key || !newTitle.trim()) return;
    try {
      const uid = getUserId();
      const res = await fetch(`${API_BASE}/summaries/${encodeURIComponent(s3Key)}/rename?uid=${encodeURIComponent(uid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        const saved = json.title;
        // Update sidebar list
        setHistories(prev => prev.map(h => h.key === s3Key ? { ...h, meetingTitle: saved } : h));
        // Update historyItem if open
        setHistoryItem(prev => prev?.key === s3Key ? { ...prev, meetingTitle: saved } : prev);
        // Update current session title
        if (activeS3Key === s3Key) setMeetingTitle(saved);
      }
      return json;
    } catch (e) {
      console.error("rename failed", e);
    }
  };

  // ── Transcript card renderer ──────────────────────────
  const TranscriptCard = ({ text, show, setShow }) => (
    <div className="card transcript-card">
      <button className="transcript-toggle" onClick={() => setShow(v => !v)}>
        <span>🔊 Raw Transcript</span>
        <span className="chevron">{show ? "▲" : "▼"}</span>
      </button>
      {show && <div className="transcript-body"><pre>{text}</pre></div>}
    </div>
  );

  return (
    <div className="app-shell">
      <ParticleField />
      {/* Mobile backdrop */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Floating expand tab — outside aside to avoid backdrop-filter stacking context breaking position:fixed */}
      {sidebarCollapsed && (
        <button
          className="sidebar-expand-tab"
          onClick={() => setSidebarCollapsed(false)}
          title="Expand history"
          aria-label="Expand sidebar"
        >
          <span className="expand-tab-icon">▶</span>
          <span className="expand-tab-label">History</span>
        </button>
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""} ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">History</span>
          <div className="sidebar-header-actions">
            <button
              className="sidebar-refresh"
              onClick={fetchHistories}
              title="Refresh"
              aria-label="Refresh history"
            >
              ↻
            </button>
            <button
              className="sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed(v => !v)}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              ◀
            </button>
          </div>
        </div>

        {/* User info strip */}
        <div className="sidebar-user-strip">
          <div className="sidebar-user-avatar">
            <span className="sidebar-avatar-initials">{(user?.displayName || user?.email || "?")[0].toUpperCase()}</span>
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.displayName || "User"}</span>
            <span className="sidebar-user-email">{user?.email}</span>
          </div>
          <button
            className="sidebar-signout-btn"
            onClick={onSignOut}
            title="Sign out"
            aria-label="Sign out"
          >
            ⎋
          </button>
        </div>

        <div className="sidebar-list">
          {histLoading && (
            <div className="sidebar-loading">
              <div className="sidebar-spinner" />
              <span>Loading…</span>
            </div>
          )}

          {!histLoading && histories.length === 0 && (
            <div className="sidebar-empty">
              <div className="sidebar-empty-icon">🗂</div>
              <p>{histError ? "History not available." : "No past summaries yet."}</p>
              <p>{histError || "Complete a meeting to see it here."}</p>
            </div>
          )}

          {histories.map((h) => (
            <button
              key={h.key}
              className={`sidebar-item ${activeKey === h.key ? "active" : ""}`}
              onClick={() => openHistory(h.key)}
              id={`history-${h.key}`}
            >
              <span className="sidebar-item-time">{formatTs(h.timestamp)}</span>
              <span className="sidebar-item-label">{h.meetingTitle || "Meeting Summary"}</span>
              <span className="sidebar-item-size">
                {h.size > 1024 ? `${(h.size / 1024).toFixed(1)} KB` : `${h.size} B`}
              </span>
            </button>
          ))}
        </div>

        {/* New meeting button at bottom of sidebar */}
        <div className="sidebar-footer">
          <button
            className="btn-primary sidebar-new-btn"
            onClick={() => { closeHistory(); reset(); setSidebarOpen(false); }}
          >
            <span>＋ New Meeting</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────────── */}
      <div className="main">
        <div className="bg-orb orb1" />
        <div className="bg-orb orb2" />
        <div className="bg-orb orb3" />

        {/* Mobile sidebar toggle */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle history sidebar"
        >
          📋
        </button>

        <div className="container">
          <header className="header">
            <div className="logo">
              <span className="logo-text">Meet<span className="accent">AI</span> Scribe</span>
            </div>
            <p className="tagline">
              Drop in a Google Meet link we record, transcribe &amp; summarize automatically.
            </p>
            <div className="feature-pills">
              <span className="feature-pill"><span></span> Auto Record</span>
              <span className="feature-pill"><span></span> AI Summary</span>
            </div>
          </header>

          {/* ── History view ── */}
          {showingHistory && (
            <div className="results">
              <button className="btn-ghost back-btn" onClick={closeHistory}>
                ← Back to new meeting
              </button>

              {histItemLoading && (
                <div className="hist-loading-card card">
                  <div className="sidebar-spinner large" />
                  <span>Loading summary…</span>
                </div>
              )}

              {historyItem?.error && (
                <div className="card error-card">
                  <div className="error-icon">⚠️</div>
                  <h2 className="error-title">Failed to load</h2>
                  <p className="error-msg">{historyItem.error}</p>
                </div>
              )}

              {historyItem?.summary && (
                <SummaryCard
                  sum={historyItem.summary}
                  ts={historyItem.timestamp}
                  icon="📋"
                  title={historyItem.meetingTitle || "Past Meeting Summary"}
                  s3Key={historyItem.key}
                  onRename={renameTitle}
                />
              )}
              {historyItem?.transcript && (
                <TranscriptCard
                  text={historyItem.transcript}
                  show={showHistTranscript}
                  setShow={setShowHistTranscript}
                />
              )}

            </div>
          )}

          {/* ── Live bot flow (hidden while viewing history) ── */}
          {!showingHistory && (
            <>
              {phase === "idle" && (
                <div className="card input-card">
                  {/* Meeting name */}
                  <label className="input-label" htmlFor="meeting-name">Meeting Name <span className="input-label-opt">(optional)</span></label>
                  <div className="name-row">
                    <input
                      id="meeting-name"
                      className="meet-input name-input"
                      placeholder="e.g. Weekly Sync, Client Call, Project Review"
                      value={meetingName}
                      onChange={(e) => setMeetingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startBot()}
                      maxLength={80}
                    />
                  </div>

                  {/* Meet URL + launch */}
                  <label className="input-label" htmlFor="meet-link" style={{marginTop: '14px'}}>Google Meet URL</label>
                  <div className="input-row">
                    <input
                      id="meet-link"
                      className="meet-input"
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startBot()}
                    />
                    <button className="btn-primary" onClick={startBot}>
                      <span>Launch Bot</span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>

                  <p className="hint">
                    The bot will join as <strong>your name with suffix AI</strong>. Admit it from the waiting room if prompted.
                  </p>
                </div>
              )}

              {phase === "running" && (
                <div className="card progress-card">
                  <div className="progress-header">
                    <div className="pulse-ring"><div className="pulse-dot" /></div>
                    <span className="progress-title">Bot is live</span>
                  </div>
                  <div className="pipeline">
                    {STEPS.map((step, i) => {
                      const done   = stepIndex > i;
                      const active = stepIndex === i;
                      return (
                        <div key={step.id} className={`pipe-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                          <div className="pipe-icon">{done ? "✓" : step.icon}</div>
                          <div className="pipe-info">
                            <span className="pipe-label">{step.label}</span>
                            {active && <span className="pipe-badge">In progress…</span>}
                            {done   && <span className="pipe-badge done-badge">Done</span>}
                          </div>
                          {i < STEPS.length - 1 && <div className="pipe-connector" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="log-box" ref={logRef}>
                    {statusMessages.map((m, i) => (
                      <p key={i} className={`log-line ${m.type}`}>{m.text}</p>
                    ))}
                    {statusMessages.length === 0 && (
                      <p className="log-line muted">Waiting for bot to connect…</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="btn-primary" onClick={finishAndSummarize} disabled={!botId}>
                      Finish & Summarize
                    </button>
                    <button className="btn-ghost" onClick={reset}>Cancel</button>
                  </div>
                </div>
              )}

              {phase === "error" && (
                <div className="card error-card">
                  <div className="error-icon">⚠️</div>
                  <h2 className="error-title">Something went wrong</h2>
                  <p className="error-msg">{errorMsg}</p>
                  <button className="btn-primary" onClick={reset}>Try Again</button>
                </div>
              )}

              {phase === "done" && (
                <div className="results">
                  <SummaryCard
                    sum={summary}
                    title={meetingTitle || "Meeting Summary"}
                    s3Key={activeS3Key}
                    onRename={renameTitle}
                  />
                  {transcript && (
                    <TranscriptCard
                      text={transcript}
                      show={showTranscript}
                      setShow={setShowTranscript}
                    />
                  )}

                  <button className="btn-primary centered" onClick={reset}>
                    ← Start Another Meeting
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

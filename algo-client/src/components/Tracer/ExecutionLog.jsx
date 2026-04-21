import React, { useEffect, useRef, useState } from 'react';

/**
 * ExecutionLog
 * ─────────────────────────────────────────────────────────────────────────────
 * Collapsible right-side panel (feature 4) showing a scrollable list of every
 * execution step taken so far (up to currentIndex).
 *
 * Features:
 *   • Auto-scrolls to the current step entry
 *   • Clicking any entry jumps directly to that step  (onJumpTo)
 *   • Long-press or right-click a step to add/remove a named bookmark
 *   • Collapsible via the toggle button in the panel header
 *   • Event-type colour coding  (call / return / line / error)
 */
export default function ExecutionLog({
  steps = [],
  currentIndex = 0,
  bookmarks = [],           // [{ stepIdx, name }]
  onJumpTo,                 // (index) => void
  onAddBookmark,            // (stepIdx, name) => void
  onRemoveBookmark,         // (stepIdx) => void
  isOpen = true,
  onToggle,                 // () => void
}) {
  const activeRef    = useRef(null);
  const scrollRef    = useRef(null);

  // Context menu state for bookmark creation / removal
  const [contextMenu, setContextMenu] = useState(null);
  // { stepIdx, x, y }

  const [bookmarkName, setBookmarkName] = useState('');
  const [namingStep, setNamingStep]     = useState(null); // stepIdx being named

  // ── auto-scroll to active entry ────────────────────────────────────────────
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  // ── close context menu on outside click ────────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

  // ── bookmark helpers ────────────────────────────────────────────────────────
  const bookmarkByStep = {};
  for (const bm of bookmarks) bookmarkByStep[bm.stepIdx] = bm;

  function openContextMenu(e, stepIdx) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ stepIdx, x: e.clientX, y: e.clientY });
    setNamingStep(null);
    setBookmarkName('');
  }

  function handleBookmarkAction() {
    if (bookmarkByStep[contextMenu.stepIdx]) {
      onRemoveBookmark?.(contextMenu.stepIdx);
      setContextMenu(null);
    } else {
      setNamingStep(contextMenu.stepIdx);
    }
  }

  function submitBookmark(e) {
    e.preventDefault();
    const name = bookmarkName.trim() || `Step ${namingStep + 1}`;
    onAddBookmark?.(namingStep, name);
    setNamingStep(null);
    setBookmarkName('');
    setContextMenu(null);
  }

  // Slice so we only show steps up to (and including) currentIndex
  const visible = steps.slice(0, currentIndex + 1);

  // ── collapsed state — just show a thin sidebar toggle ──────────────────────
  if (!isOpen) {
    return (
      <div style={styles.collapsed}>
        <button
          onClick={onToggle}
          style={styles.toggleBtnCollapsed}
          title="Open Execution Log"
        >
          <span style={styles.rotatedLabel}>Execution Log</span>
          <span style={{ fontSize: '12px' }}>◀</span>
        </button>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>📋</span>
        <span style={styles.headerTitle}>Execution Log</span>
        <span style={styles.stepCount}>{visible.length}</span>
        <button
          onClick={onToggle}
          style={styles.collapseBtn}
          title="Collapse log panel"
        >
          ▶
        </button>
      </div>

      {/* ── Scrollable step list ─────────────────────────────────────────────── */}
      <div ref={scrollRef} style={styles.list}>
        {visible.length === 0 ? (
          <div style={styles.empty}>No steps yet</div>
        ) : (
          visible.map((step, idx) => {
            const isActive = idx === currentIndex;
            const bm       = bookmarkByStep[idx];
            const colors   = eventColors(step.event);

            return (
              <div
                key={idx}
                ref={isActive ? activeRef : null}
                onClick={() => onJumpTo?.(idx)}
                onContextMenu={e => openContextMenu(e, idx)}
                style={{
                  ...styles.entry,
                  backgroundColor: isActive
                    ? 'rgba(168,85,247,0.18)'
                    : 'transparent',
                  borderLeft: isActive
                    ? '3px solid #a855f7'
                    : bm
                      ? '3px solid #60a5fa'
                      : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.12s ease, border-left-color 0.12s ease',
                }}
                title="Click to jump · Right-click for bookmark"
              >
                {/* Step number pill */}
                <span style={{
                  ...styles.stepPill,
                  backgroundColor: isActive ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#e9d5ff' : '#64748b',
                }}>
                  {idx + 1}
                </span>

                {/* Event badge */}
                <span style={{
                  ...styles.eventDot,
                  backgroundColor: colors.bg,
                  color: colors.fg,
                  borderColor: colors.border,
                }}>
                  {eventLabel(step.event)}
                </span>

                {/* Log message */}
                <span style={{
                  ...styles.msg,
                  color: isActive ? '#e2e8f0' : '#6b7280',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {step.logMsg || `Step ${idx + 1}`}
                </span>

                {/* Bookmark indicator */}
                {bm && (
                  <span style={styles.bmIcon} title={bm.name}>◆</span>
                )}
              </div>
            );
          })
        )}

        <div style={{ height: '16px' }} />
      </div>

      {/* ── Context menu ────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          style={{
            ...styles.contextMenu,
            top : Math.min(contextMenu.y, window.innerHeight - 120),
            left: Math.min(contextMenu.x, window.innerWidth  - 220),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={styles.ctxHeader}>
            Step {contextMenu.stepIdx + 1}
          </div>

          <button
            style={styles.ctxBtn}
            onClick={() => {
              onJumpTo?.(contextMenu.stepIdx);
              setContextMenu(null);
            }}
          >
            ⤵ Jump to this step
          </button>

          {bookmarkByStep[contextMenu.stepIdx] ? (
            <button
              style={{ ...styles.ctxBtn, color: '#f87171' }}
              onClick={handleBookmarkAction}
            >
              ✕ Remove bookmark "{bookmarkByStep[contextMenu.stepIdx].name}"
            </button>
          ) : namingStep === contextMenu.stepIdx ? (
            <form onSubmit={submitBookmark} style={styles.ctxForm}>
              <input
                autoFocus
                value={bookmarkName}
                onChange={e => setBookmarkName(e.target.value)}
                placeholder={`Step ${contextMenu.stepIdx + 1}`}
                style={styles.ctxInput}
              />
              <button type="submit" style={styles.ctxSubmit}>
                ◆ Save
              </button>
            </form>
          ) : (
            <button
              style={styles.ctxBtn}
              onClick={handleBookmarkAction}
            >
              ◆ Add bookmark…
            </button>
          )}
        </div>
      )}
    </div>
  );
}


// ── colour helpers ─────────────────────────────────────────────────────────────

function eventColors(event) {
  switch (event) {
    case 'call':   return { bg: 'rgba(96,165,250,0.15)',  fg: '#60a5fa', border: 'rgba(96,165,250,0.35)'  };
    case 'return': return { bg: 'rgba(167,139,250,0.15)', fg: '#a78bfa', border: 'rgba(167,139,250,0.35)' };
    case 'line':   return { bg: 'rgba(34,197,94,0.12)',   fg: '#4ade80', border: 'rgba(34,197,94,0.3)'    };
    case 'error':  return { bg: 'rgba(239,68,68,0.15)',   fg: '#f87171', border: 'rgba(239,68,68,0.35)'   };
    default:       return { bg: 'rgba(168,85,247,0.12)',  fg: '#c084fc', border: 'rgba(168,85,247,0.3)'   };
  }
}

function eventLabel(event) {
  switch (event) {
    case 'call':   return 'call';
    case 'return': return 'ret';
    case 'line':   return 'line';
    case 'error':  return 'err';
    default:       return event ?? '?';
  }
}


// ── styles ─────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display        : 'flex',
    flexDirection  : 'column',
    height         : '100%',
    width          : '220px',
    minWidth       : '220px',
    backgroundColor: '#06030f',
    borderLeft     : '1px solid rgba(255,255,255,0.06)',
    overflow       : 'hidden',
    flexShrink     : 0,
    position       : 'relative',
  },

  collapsed: {
    display        : 'flex',
    flexDirection  : 'column',
    alignItems     : 'center',
    width          : '28px',
    minWidth       : '28px',
    backgroundColor: '#06030f',
    borderLeft     : '1px solid rgba(255,255,255,0.06)',
    flexShrink     : 0,
    paddingTop     : '8px',
  },

  toggleBtnCollapsed: {
    display        : 'flex',
    flexDirection  : 'column',
    alignItems     : 'center',
    gap            : '6px',
    background     : 'none',
    border         : 'none',
    color          : '#64748b',
    cursor         : 'pointer',
    padding        : '6px 4px',
    borderRadius   : '4px',
    transition     : 'color 0.15s',
  },

  rotatedLabel: {
    writingMode   : 'vertical-rl',
    textOrientation: 'mixed',
    fontSize      : '10px',
    fontWeight    : 600,
    letterSpacing : '0.08em',
    color         : '#64748b',
    textTransform : 'uppercase',
  },

  header: {
    display        : 'flex',
    alignItems     : 'center',
    gap            : '6px',
    padding        : '10px 10px 10px 12px',
    borderBottom   : '1px solid rgba(255,255,255,0.07)',
    backgroundColor: '#0a0612',
    flexShrink     : 0,
  },

  headerIcon: {
    fontSize: '13px',
  },

  headerTitle: {
    fontSize     : '11px',
    fontWeight   : 700,
    color        : '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flex         : 1,
  },

  stepCount: {
    fontSize        : '10px',
    color           : '#a855f7',
    backgroundColor : 'rgba(168,85,247,0.12)',
    border          : '1px solid rgba(168,85,247,0.25)',
    borderRadius    : '8px',
    padding         : '1px 5px',
    fontFamily      : 'monospace',
  },

  collapseBtn: {
    background  : 'none',
    border      : 'none',
    color       : '#4c3f6d',
    cursor      : 'pointer',
    fontSize    : '12px',
    padding     : '2px 4px',
    borderRadius: '3px',
    transition  : 'color 0.15s',
    lineHeight  : 1,
  },

  list: {
    flex          : 1,
    overflowY     : 'auto',
    overflowX     : 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(168,85,247,0.25) transparent',
  },

  empty: {
    textAlign : 'center',
    color     : '#2d1f45',
    fontSize  : '12px',
    marginTop : '32px',
    fontStyle : 'italic',
  },

  entry: {
    display    : 'flex',
    alignItems : 'flex-start',
    gap        : '5px',
    padding    : '5px 8px 5px 10px',
    userSelect : 'none',
  },

  stepPill: {
    fontFamily   : 'monospace',
    fontSize     : '9px',
    fontWeight   : 700,
    padding      : '1px 4px',
    borderRadius : '3px',
    flexShrink   : 0,
    lineHeight   : '15px',
    minWidth     : '22px',
    textAlign    : 'center',
  },

  eventDot: {
    fontFamily   : 'monospace',
    fontSize     : '8px',
    fontWeight   : 700,
    padding      : '1px 4px',
    borderRadius : '3px',
    border       : '1px solid',
    flexShrink   : 0,
    lineHeight   : '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  msg: {
    fontFamily  : 'monospace',
    fontSize    : '10px',
    lineHeight  : '15px',
    flex        : 1,
    overflow    : 'hidden',
    display     : '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak   : 'break-word',
  },

  bmIcon: {
    color    : '#60a5fa',
    fontSize : '9px',
    flexShrink: 0,
    lineHeight: '15px',
  },

  // ── context menu ──────────────────────────────────────────────────────────

  contextMenu: {
    position       : 'fixed',
    zIndex         : 9999,
    backgroundColor: 'rgba(10,6,18,0.98)',
    border         : '1px solid rgba(168,85,247,0.45)',
    borderRadius   : '8px',
    minWidth       : '190px',
    boxShadow      : '0 8px 24px rgba(0,0,0,0.7)',
    overflow       : 'hidden',
  },

  ctxHeader: {
    padding        : '7px 12px',
    fontSize       : '10px',
    fontWeight     : 700,
    color          : '#64748b',
    textTransform  : 'uppercase',
    letterSpacing  : '0.07em',
    borderBottom   : '1px solid rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(168,85,247,0.07)',
  },

  ctxBtn: {
    display        : 'block',
    width          : '100%',
    textAlign      : 'left',
    background     : 'none',
    border         : 'none',
    borderBottom   : '1px solid rgba(255,255,255,0.04)',
    padding        : '8px 12px',
    fontSize       : '12px',
    color          : '#c4b5fd',
    cursor         : 'pointer',
    fontFamily     : 'monospace',
    transition     : 'background-color 0.12s',
  },

  ctxForm: {
    display  : 'flex',
    padding  : '8px',
    gap      : '6px',
  },

  ctxInput: {
    flex           : 1,
    backgroundColor: 'rgba(168,85,247,0.1)',
    border         : '1px solid rgba(168,85,247,0.35)',
    borderRadius   : '4px',
    padding        : '4px 8px',
    color          : '#e2e8f0',
    fontFamily     : 'monospace',
    fontSize       : '11px',
    outline        : 'none',
  },

  ctxSubmit: {
    padding        : '4px 10px',
    borderRadius   : '4px',
    border         : '1px solid rgba(168,85,247,0.4)',
    backgroundColor: 'rgba(168,85,247,0.2)',
    color          : '#e9d5ff',
    fontSize       : '11px',
    cursor         : 'pointer',
    fontFamily     : 'monospace',
    whiteSpace     : 'nowrap',
  },
};

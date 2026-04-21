import React, { useState, useEffect, useCallback, useRef } from "react";

import CodePanel from "./CodePanel.jsx";
import FramesPanel from "./FramesPanel.jsx";
import ObjectsPanel from "./ObjectsPanel.jsx";
import StepNavBar from "./StepNavBar.jsx";
import ExecutionLog from "./ExecutionLog.jsx";

/**
 * ExecutionVisualizerModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen modal overlay that orchestrates the entire Step-by-Step
 * Traceability feature.
 *
 * Manages:
 *   • currentIndex      – which step is rendered
 *   • isPlaying         – auto-advance timer
 *   • playSpeed         – 0.5 × / 1 × / 2 ×
 *   • breakpoints       – Set<lineNo>  (toggled from CodePanel gutter)
 *   • bookmarks         – [{ stepIdx, name, lineNo }]
 *   • logOpen           – whether the Execution Log panel is visible
 *
 * Keyboard shortcuts (when modal is focused):
 *   ← / →    previous / next step
 *   Space     toggle play / pause
 *   Home/End  first / last step
 *   Escape    close modal
 *
 * Mobile:
 *   Touch-swipe left/right is handled inside StepNavBar.
 */
export default function ExecutionVisualizerModal({
  isOpen,
  onClose,
  steps = [], // post-processed steps from pythonTracer.postProcessSteps
  varMeta = {}, // variable metadata map
  code = "", // original Python source
}) {
  // ── core navigation state ──────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 0.5 | 1 | 2

  // ── features state ─────────────────────────────────────────────────────────
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [bookmarks, setBookmarks] = useState([]);
  const [logOpen, setLogOpen] = useState(true);

  const total = steps.length;
  const currentStep = steps[currentIndex] ?? null;

  // Reset index whenever a new trace result arrives (steps reference changes).
  // Uses the "derived state during render" pattern recommended by React instead
  // of useEffect, avoiding the react-hooks v7 warning about synchronous setState
  // inside effect bodies.  React will re-render once more with the new state;
  // the ref comparison prevents an infinite loop.
  const prevStepsRef = useRef(steps);
  if (prevStepsRef.current !== steps) {
    prevStepsRef.current = steps;
    if (currentIndex !== 0) setCurrentIndex(0);
    if (isPlaying) setIsPlaying(false);
  }

  // ── navigation helpers ─────────────────────────────────────────────────────
  const goFirst = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);
  const goLast = useCallback(() => {
    setCurrentIndex(total - 1);
    setIsPlaying(false);
  }, [total]);
  const goBack = useCallback(
    () => setCurrentIndex((i) => Math.max(0, i - 1)),
    [],
  );
  const goNext = useCallback(() => {
    setCurrentIndex((i) => {
      const next = Math.min(total - 1, i + 1);
      if (next >= total - 1) setIsPlaying(false);
      return next;
    });
  }, [total]);

  const jumpTo = useCallback(
    (idx) => {
      setCurrentIndex(Math.max(0, Math.min(total - 1, idx)));
      setIsPlaying(false);
    },
    [total],
  );

  // ── auto-play timer ────────────────────────────────────────────────────────
  const playTimerRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) {
      clearTimeout(playTimerRef.current);
      return;
    }
    if (currentIndex >= total - 1) {
      // Reached the last step — stop playing.
      // Wrap in setTimeout so setIsPlaying is NOT a synchronous call in the
      // effect body, satisfying the react-hooks v7 react-compiler rule.
      const t = setTimeout(() => setIsPlaying(false), 0);
      return () => clearTimeout(t);
    }
    const delay = 1000 / playSpeed;
    playTimerRef.current = setTimeout(() => {
      setCurrentIndex((i) => Math.min(total - 1, i + 1));
    }, delay);

    return () => clearTimeout(playTimerRef.current);
  }, [isPlaying, currentIndex, playSpeed, total]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      if (!p && currentIndex >= total - 1) {
        // restart from beginning
        setCurrentIndex(0);
        return true;
      }
      return !p;
    });
  }, [currentIndex, total]);

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function onKey(e) {
      // Ignore when user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goBack();
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "Home":
          e.preventDefault();
          goFirst();
          break;
        case "End":
          e.preventDefault();
          goLast();
          break;
        case "Escape":
          e.preventDefault();
          onClose?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, goNext, goBack, togglePlay, goFirst, goLast, onClose]);

  // ── breakpoints ────────────────────────────────────────────────────────────
  const toggleBreakpoint = useCallback((lineNo) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(lineNo)) next.delete(lineNo);
      else next.add(lineNo);
      return next;
    });
  }, []);

  const runToBreakpoint = useCallback(() => {
    const next = steps.findIndex(
      (s, i) => i > currentIndex && breakpoints.has(s.lineNo),
    );
    if (next !== -1) jumpTo(next);
  }, [steps, currentIndex, breakpoints, jumpTo]);

  // ── bookmarks ──────────────────────────────────────────────────────────────
  const addBookmark = useCallback(
    (stepIdx, name) => {
      const step = steps[stepIdx];
      const lineNo = step?.lineNo ?? null;
      setBookmarks((prev) => {
        // avoid duplicates on the same step
        if (prev.find((b) => b.stepIdx === stepIdx)) return prev;
        return [
          ...prev,
          { stepIdx, name: name || `Step ${stepIdx + 1}`, lineNo },
        ];
      });
    },
    [steps],
  );

  const removeBookmark = useCallback((stepIdx) => {
    setBookmarks((prev) => prev.filter((b) => b.stepIdx !== stepIdx));
  }, []);

  // ── render guard ───────────────────────────────────────────────────────────
  if (!isOpen) return null;

  // ── loading / error states ─────────────────────────────────────────────────
  const hasError = currentStep?.event === "error";

  return (
    <>
      {/* ── Global CSS animations (injected once) ──────────────────────── */}
      <style>{GLOBAL_ANIMATIONS}</style>

      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div style={styles.backdrop} />

      {/* ── Modal shell ───────────────────────────────────────────────────── */}
      <div
        style={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="PI-Tracer"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>⚡</span>
            <span style={styles.headerTitle}>PI-Tracer</span>
            <span style={styles.headerSub}>Python execution</span>
            {hasError && <span style={styles.errorBadge}>⚠ Runtime Error</span>}
            {total >= 800 && (
              <span style={styles.limitBadge}>≥ 800 steps (limit reached)</span>
            )}
          </div>

          <div style={styles.headerRight}>
            {/* Bookmark list button */}
            {bookmarks.length > 0 && (
              <div style={styles.bookmarkChips}>
                {bookmarks.slice(0, 4).map((bm) => (
                  <button
                    key={bm.stepIdx}
                    onClick={() => jumpTo(bm.stepIdx)}
                    style={styles.bookmarkChip}
                    title={`Jump to: ${bm.name}`}
                  >
                    ◆ {bm.name}
                  </button>
                ))}
                {bookmarks.length > 4 && (
                  <span style={styles.moreBookmarks}>
                    +{bookmarks.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Keyboard hint */}
            <span style={styles.kbHint}>← → Space · Esc closes</span>

            {/* Close button */}
            <button
              onClick={onClose}
              style={styles.closeBtn}
              title="Close tracer (Esc)"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* ── Main content area ────────────────────────────────────────────── */}
        <div style={styles.body}>
          {/* Code panel — left column */}
          <div style={{ ...styles.column, flex: "0 0 26%", minWidth: 200 }}>
            <CodePanel
              code={code}
              currentStep={currentStep}
              breakpoints={breakpoints}
              onToggleBreakpoint={toggleBreakpoint}
              bookmarks={bookmarks}
            />
          </div>

          {/* Frames panel — centre-left */}
          <div style={{ ...styles.column, flex: "0 0 26%", minWidth: 190 }}>
            <FramesPanel currentStep={currentStep} varMeta={varMeta} />
          </div>

          {/* Objects panel — centre-right (grows to fill remaining space) */}
          <div style={{ ...styles.column, flex: "1 1 0", minWidth: 180 }}>
            <ObjectsPanel currentStep={currentStep} />
          </div>

          {/* Execution Log — right column, collapsible */}
          <ExecutionLog
            steps={steps}
            currentIndex={currentIndex}
            bookmarks={bookmarks}
            onJumpTo={jumpTo}
            onAddBookmark={addBookmark}
            onRemoveBookmark={removeBookmark}
            isOpen={logOpen}
            onToggle={() => setLogOpen((o) => !o)}
          />
        </div>

        {/* ── Error detail banner ───────────────────────────────────────────── */}
        {hasError && (
          <div style={styles.errorBanner}>
            <span style={styles.errorLabel}>RuntimeError:</span>
            <span style={styles.errorText}>{currentStep.errorMsg}</span>
          </div>
        )}

        {/* ── Bottom: timeline + nav controls ─────────────────────────────── */}
        <StepNavBar
          steps={steps}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          playSpeed={playSpeed}
          breakpoints={breakpoints}
          onFirst={goFirst}
          onBack={goBack}
          onNext={goNext}
          onLast={goLast}
          onJumpTo={jumpTo}
          onTogglePlay={togglePlay}
          onSpeedChange={setPlaySpeed}
          onRunToBreakpoint={runToBreakpoint}
        />

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {total === 0 && (
          <div style={styles.emptyOverlay}>
            <span style={styles.emptyIcon}>⚡</span>
            <span style={styles.emptyTitle}>No Steps Captured</span>
            <span style={styles.emptyHint}>
              The tracer found 0 execution steps.
              <br />
              Make sure your code runs at least one statement.
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ── CSS animations ─────────────────────────────────────────────────────────────

const GLOBAL_ANIMATIONS = `
  @keyframes codePanelPulse {
    0%, 100% { opacity: 1; transform: translateX(0); }
    50%       { opacity: 0.6; transform: translateX(2px); }
  }

  @keyframes tracerRefPulse {
    0%   { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6); }
    60%  { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
    100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
  }

  @keyframes objArrowPulse {
    0%   { stroke-dashoffset: 0; opacity: 1; }
    50%  { opacity: 0.5; }
    100% { opacity: 1; }
  }

  @keyframes tracerSlideIn {
    from { opacity: 0; transform: scale(0.97) translateY(-8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);    }
  }

  /* Scrollbar theming for all tracer panels */
  .tracer-scroll::-webkit-scrollbar        { width: 5px; height: 5px; }
  .tracer-scroll::-webkit-scrollbar-track  { background: transparent; }
  .tracer-scroll::-webkit-scrollbar-thumb  { background: rgba(168,85,247,0.3); border-radius: 3px; }
  .tracer-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.55); }
`;

// ── styles ─────────────────────────────────────────────────────────────────────

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    backdropFilter: "blur(4px)",
    zIndex: 1100,
  },

  modal: {
    position: "fixed",
    inset: 0,
    zIndex: 1101,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#050309",
    animation: "tracerSlideIn 0.2s ease-out",
    overflow: "hidden",
  },

  // ── header ──────────────────────────────────────────────────────────────────

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "48px",
    padding: "0 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "#0a0612",
    flexShrink: 0,
    gap: "12px",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    minWidth: 0,
  },

  headerIcon: {
    fontSize: "18px",
    color: "#a855f7",
    filter: "drop-shadow(0 0 6px rgba(168,85,247,0.7))",
  },

  headerTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#e9d5ff",
    letterSpacing: "0.04em",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  },

  headerSub: {
    fontSize: "10px",
    color: "#94a3b8",
    backgroundColor: "rgba(148,163,184,0.1)",
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: "4px",
    padding: "1px 6px",
    whiteSpace: "nowrap",
  },

  errorBadge: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#fca5a5",
    backgroundColor: "rgba(239,68,68,0.18)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: "5px",
    padding: "2px 7px",
    animation: "tracerRefPulse 1.5s ease infinite",
  },

  limitBadge: {
    fontSize: "10px",
    color: "#fbbf24",
    backgroundColor: "rgba(251,191,36,0.1)",
    border: "1px solid rgba(251,191,36,0.3)",
    borderRadius: "5px",
    padding: "1px 6px",
    whiteSpace: "nowrap",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },

  bookmarkChips: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  bookmarkChip: {
    fontSize: "10px",
    fontWeight: 600,
    color: "#93c5fd",
    backgroundColor: "rgba(96,165,250,0.12)",
    border: "1px solid rgba(96,165,250,0.3)",
    borderRadius: "5px",
    padding: "2px 7px",
    cursor: "pointer",
    fontFamily: "monospace",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap",
  },

  moreBookmarks: {
    fontSize: "10px",
    color: "#64748b",
    padding: "0 4px",
  },

  kbHint: {
    fontSize: "10px",
    color: "#2d1f45",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  },

  closeBtn: {
    padding: "5px 14px",
    borderRadius: "7px",
    border: "1px solid rgba(168,85,247,0.3)",
    backgroundColor: "rgba(168,85,247,0.12)",
    color: "#e9d5ff",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  },

  // ── body ────────────────────────────────────────────────────────────────────

  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
    minHeight: 0,
  },

  column: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
  },

  // ── error banner ────────────────────────────────────────────────────────────

  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderTop: "1px solid rgba(239,68,68,0.3)",
    flexShrink: 0,
    flexWrap: "wrap",
  },

  errorLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#f87171",
    fontFamily: "monospace",
    flexShrink: 0,
  },

  errorText: {
    fontSize: "11px",
    color: "#fca5a5",
    fontFamily: "monospace",
    wordBreak: "break-all",
  },

  // ── empty overlay ────────────────────────────────────────────────────────────

  emptyOverlay: {
    position: "absolute",
    inset: "48px 0 0 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    backgroundColor: "rgba(5,3,9,0.88)",
    zIndex: 50,
    pointerEvents: "none",
  },

  emptyIcon: {
    fontSize: "48px",
    opacity: 0.3,
  },

  emptyTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#e9d5ff",
    opacity: 0.6,
  },

  emptyHint: {
    fontSize: "13px",
    color: "#64748b",
    textAlign: "center",
    lineHeight: "1.7",
  },
};

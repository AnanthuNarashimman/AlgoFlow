import React, { useState, useRef } from "react";

/**
 * StepNavBar
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent bottom toolbar for step-by-step execution navigation.
 *
 * Contains (top-to-bottom):
 *   1. Timeline scrubber  — drag or click to jump to any step; hovering a
 *                           tick mark shows a tooltip with the step's logMsg.
 *   2. Controls row       — [|◀] [◀] [▶] [▶|]  [▶ Play / ⏸ Pause]
 *                           speed selector (0.5x / 1x / 2x)
 *                           [Run to Breakpoint]  step counter
 */
export default function StepNavBar({
  steps = [],
  currentIndex = 0,
  isPlaying = false,
  playSpeed = 1,
  breakpoints, // Set<number>
  onFirst,
  onBack,
  onNext,
  onLast,
  onJumpTo, // (index) => void
  onTogglePlay,
  onSpeedChange, // (speed: 0.5|1|2) => void
  onRunToBreakpoint,
}) {
  const total = steps.length;
  const currentStep = steps[currentIndex];
  const hasBreakpoints = breakpoints && breakpoints.size > 0;

  // ── timeline tooltip state ─────────────────────────────────────────────────
  const [tickTooltip, setTickTooltip] = useState(null);
  // { index, x, y, msg }

  const scrubberRef = useRef(null);
  const isDragging = useRef(false);

  // ── scrubber interaction helpers ───────────────────────────────────────────

  function posToIndex(clientX) {
    const bar = scrubberRef.current;
    if (!bar || total === 0) return 0;
    const { left, width } = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return Math.round(ratio * (total - 1));
  }

  function handleScrubberClick(e) {
    onJumpTo(posToIndex(e.clientX));
  }

  function handleScrubberMouseDown(e) {
    isDragging.current = true;
    onJumpTo(posToIndex(e.clientX));

    function onMove(ev) {
      if (isDragging.current) onJumpTo(posToIndex(ev.clientX));
    }
    function onUp() {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Touch support for mobile swipe
  const touchStartX = useRef(null);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 20) return; // too small
    if (dx < 0) onNext?.();
    else onBack?.();
  }

  // Tick marks — show at most MAX_TICKS evenly spaced
  const MAX_TICKS = 80;
  const step = total > MAX_TICKS ? Math.ceil(total / MAX_TICKS) : 1;
  const ticks = [];
  for (let i = 0; i < total; i += step) ticks.push(i);
  if (ticks[ticks.length - 1] !== total - 1 && total > 0) ticks.push(total - 1);

  const progress = total > 1 ? (currentIndex / (total - 1)) * 100 : 0;

  return (
    <div
      style={styles.wrapper}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── 1. Timeline scrubber ──────────────────────────────────────────── */}
      <div style={styles.scrubberSection}>
        {/* Track */}
        <div
          ref={scrubberRef}
          style={styles.track}
          onClick={handleScrubberClick}
          onMouseDown={handleScrubberMouseDown}
        >
          {/* Filled portion */}
          <div
            style={{
              ...styles.trackFill,
              width: `${progress}%`,
            }}
          />

          {/* Thumb */}
          <div
            style={{
              ...styles.thumb,
              left: `${progress}%`,
            }}
          />

          {/* Tick marks */}
          {ticks.map((idx) => {
            const pct = total > 1 ? (idx / (total - 1)) * 100 : 0;
            const isActive = idx === currentIndex;
            const isBP = breakpoints?.has(steps[idx]?.lineNo);
            return (
              <div
                key={idx}
                style={{
                  ...styles.tick,
                  left: `${pct}%`,
                  backgroundColor: isBP
                    ? "#ef4444"
                    : isActive
                      ? "#a855f7"
                      : "rgba(168,85,247,0.3)",
                  height: isBP ? "10px" : isActive ? "10px" : "6px",
                  width: isBP ? "3px" : "2px",
                  zIndex: isBP ? 3 : 2,
                }}
                onMouseEnter={(e) => {
                  const s = steps[idx];
                  const msg = s?.logMsg ?? `Step ${idx + 1}`;
                  setTickTooltip({
                    index: idx,
                    x: e.currentTarget.getBoundingClientRect().left,
                    y: e.currentTarget.getBoundingClientRect().top,
                    msg: `Step ${idx + 1} — ${msg}`,
                  });
                }}
                onMouseLeave={() => setTickTooltip(null)}
              />
            );
          })}
        </div>

        {/* Tick tooltip (rendered outside the track to avoid clipping) */}
        {tickTooltip && (
          <div
            style={{
              ...styles.tickTooltip,
              left: Math.min(tickTooltip.x - 8, window.innerWidth - 320),
            }}
          >
            {tickTooltip.msg}
          </div>
        )}
      </div>

      {/* ── 2. Controls row ───────────────────────────────────────────────── */}
      <div style={styles.controls}>
        {/* Left cluster — navigation */}
        <div style={styles.cluster}>
          <NavBtn
            label="⏮"
            title="First step"
            onClick={onFirst}
            disabled={currentIndex === 0}
          />
          <NavBtn
            label="◀"
            title="Previous step  (←)"
            onClick={onBack}
            disabled={currentIndex === 0}
          />
          <NavBtn
            label="▶"
            title="Next step  (→)"
            onClick={onNext}
            disabled={currentIndex >= total - 1}
          />
          <NavBtn
            label="⏭"
            title="Last step"
            onClick={onLast}
            disabled={currentIndex >= total - 1}
          />
        </div>

        {/* Centre cluster — play / speed */}
        <div style={styles.cluster}>
          <button
            onClick={onTogglePlay}
            disabled={total === 0}
            style={{
              ...styles.playBtn,
              backgroundColor: isPlaying
                ? "rgba(168,85,247,0.35)"
                : "rgba(168,85,247,0.18)",
              borderColor: isPlaying
                ? "rgba(168,85,247,0.7)"
                : "rgba(168,85,247,0.35)",
            }}
            title={isPlaying ? "Pause (Space)" : "Auto-play (Space)"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          {/* Speed picker */}
          <div style={styles.speedGroup}>
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                onClick={() => onSpeedChange(sp)}
                style={{
                  ...styles.speedBtn,
                  backgroundColor:
                    playSpeed === sp ? "rgba(168,85,247,0.3)" : "transparent",
                  color: playSpeed === sp ? "#e9d5ff" : "#64748b",
                  borderColor:
                    playSpeed === sp
                      ? "rgba(168,85,247,0.5)"
                      : "rgba(255,255,255,0.06)",
                }}
                title={`${sp}× speed`}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>

        {/* Right cluster — breakpoint + step counter */}
        <div style={styles.cluster}>
          {hasBreakpoints && (
            <button
              onClick={onRunToBreakpoint}
              style={styles.bpBtn}
              title="Jump to the next breakpoint"
            >
              ● Run to Breakpoint
            </button>
          )}

          {/* Step counter */}
          <div style={styles.counter}>
            <span style={styles.counterCurrent}>
              Step {total === 0 ? 0 : currentIndex + 1}
            </span>
            <span style={styles.counterSep}> of </span>
            <span style={styles.counterTotal}>{total}</span>
          </div>
        </div>
      </div>

      {/* Current step event badge */}
      {currentStep && (
        <div style={styles.eventStrip}>
          <span
            style={{
              ...styles.eventBadge,
              ...eventBadgeColors(currentStep.event),
            }}
          >
            {currentStep.event}
          </span>
          <span style={styles.logMsg}>{currentStep.logMsg}</span>
        </div>
      )}
    </div>
  );
}

// ── NavBtn ────────────────────────────────────────────────────────────────────

function NavBtn({ label, title, onClick, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.navBtn,
        backgroundColor:
          hover && !disabled ? "rgba(168,85,247,0.25)" : "rgba(168,85,247,0.1)",
        color: disabled ? "#2d1f45" : hover ? "#e9d5ff" : "#94a3b8",
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor:
          hover && !disabled ? "rgba(168,85,247,0.5)" : "rgba(168,85,247,0.2)",
      }}
    >
      {label}
    </button>
  );
}

// ── event badge colour helper ─────────────────────────────────────────────────

function eventBadgeColors(event) {
  switch (event) {
    case "call":
      return {
        backgroundColor: "rgba(96,165,250,0.18)",
        color: "#60a5fa",
        borderColor: "rgba(96,165,250,0.35)",
      };
    case "return":
      return {
        backgroundColor: "rgba(167,139,250,0.18)",
        color: "#a78bfa",
        borderColor: "rgba(167,139,250,0.35)",
      };
    case "line":
      return {
        backgroundColor: "rgba(34,197,94,0.15)",
        color: "#4ade80",
        borderColor: "rgba(34,197,94,0.35)",
      };
    case "error":
      return {
        backgroundColor: "rgba(239,68,68,0.18)",
        color: "#f87171",
        borderColor: "rgba(239,68,68,0.35)",
      };
    default:
      return {
        backgroundColor: "rgba(168,85,247,0.15)",
        color: "#c084fc",
        borderColor: "rgba(168,85,247,0.3)",
      };
  }
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    flexShrink: 0,
    backgroundColor: "#080510",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    userSelect: "none",
    zIndex: 10,
  },

  // ── scrubber ────────────────────────────────────────────────────────────────

  scrubberSection: {
    position: "relative",
    padding: "10px 16px 4px",
  },

  track: {
    position: "relative",
    height: "6px",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: "3px",
    cursor: "pointer",
    overflow: "visible",
  },

  trackFill: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "rgba(168,85,247,0.55)",
    borderRadius: "3px",
    transition: "width 0.1s linear",
    pointerEvents: "none",
  },

  thumb: {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: "#a855f7",
    boxShadow: "0 0 8px rgba(168,85,247,0.7)",
    border: "2px solid #e9d5ff",
    pointerEvents: "none",
    zIndex: 4,
    transition: "left 0.1s linear",
  },

  tick: {
    position: "absolute",
    top: "50%",
    transform: "translate(-50%, -50%)",
    borderRadius: "1px",
    transition: "background-color 0.1s ease",
    cursor: "pointer",
  },

  tickTooltip: {
    position: "fixed",
    bottom: "80px",
    backgroundColor: "rgba(10,6,18,0.97)",
    border: "1px solid rgba(168,85,247,0.4)",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "11px",
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    zIndex: 999,
    maxWidth: "320px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    pointerEvents: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
  },

  // ── controls row ────────────────────────────────────────────────────────────

  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 16px 6px",
    gap: "12px",
  },

  cluster: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  navBtn: {
    width: "34px",
    height: "30px",
    borderRadius: "6px",
    border: "1px solid",
    fontSize: "14px",
    fontFamily: "monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    flexShrink: 0,
  },

  playBtn: {
    padding: "5px 14px",
    borderRadius: "7px",
    border: "1px solid",
    fontSize: "12px",
    fontWeight: 700,
    color: "#e9d5ff",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "monospace",
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
  },

  speedGroup: {
    display: "flex",
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.07)",
  },

  speedBtn: {
    padding: "4px 9px",
    border: "none",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "monospace",
  },

  bpBtn: {
    padding: "5px 10px",
    borderRadius: "6px",
    border: "1px solid rgba(239,68,68,0.35)",
    backgroundColor: "rgba(239,68,68,0.12)",
    color: "#fca5a5",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  },

  counter: {
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "6px",
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    whiteSpace: "nowrap",
  },

  counterCurrent: {
    color: "#e9d5ff",
    fontWeight: 700,
  },

  counterSep: {
    color: "#4c3f6d",
  },

  counterTotal: {
    color: "#94a3b8",
  },

  // ── event strip ─────────────────────────────────────────────────────────────

  eventStrip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 16px 6px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },

  eventBadge: {
    fontSize: "9px",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    fontFamily: "monospace",
    flexShrink: 0,
  },

  logMsg: {
    fontSize: "11px",
    color: "#94a3b8",
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
};

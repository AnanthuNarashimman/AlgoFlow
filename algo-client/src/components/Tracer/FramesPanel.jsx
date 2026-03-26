import React, { useState, useRef, useEffect } from "react";

/**
 * FramesPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays the full call-stack at the current execution step.
 *
 * Each frame card shows:
 *   • Frame name (function name or "Global Frame")
 *   • A table of local variable  name → value  pairs
 *
 * Per-variable change highlighting (feature 3):
 *   🟢 green  – variable just created
 *   🟡 yellow – variable value changed
 *   🔴 red/strikethrough – variable went out of scope (deleted)
 *   🔵 blue border on frame – new frame (function just called)
 *
 * Step Metadata Tooltip (feature 6):
 *   Hovering a variable name shows a small floating tooltip with
 *   first-assigned step/line, last-modified step/line, and access count.
 */
export default function FramesPanel({ currentStep, varMeta = {} }) {
  const frames = currentStep?.frames ?? [];

  return (
    <div style={styles.wrapper}>
      {/* Panel header */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>≡</span>
        <span style={styles.headerTitle}>Frames</span>
        <span style={styles.frameCount}>
          {frames.length} frame{frames.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Scrollable frame list */}
      <div style={styles.scrollArea}>
        {frames.length === 0 ? (
          <div style={styles.empty}>No active frames</div>
        ) : (
          frames.map((frame, fi) => (
            <React.Fragment key={frame.id}>
              <FrameCard
                frame={frame}
                isTopmost={fi === frames.length - 1}
                varMeta={varMeta}
                currentStep={currentStep}
              />
              {fi < frames.length - 1 && (
                <div style={styles.frameArrow}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 4V18M12 18L6 12M12 18L18 12"
                      stroke="rgba(168,85,247,0.4)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))
        )}
        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}

// ── FrameCard ────────────────────────────────────────────────────────────────

function FrameCard({ frame, isTopmost, varMeta, currentStep }) {
  const fc = currentStep?.frameChanges?.[frame.id] ?? {};
  const isNew = !!fc.__isNew;
  const isGone = !!fc.__isGone;

  const borderColor = isNew
    ? "rgba(34,197,94,0.6)"
    : isTopmost
      ? "rgba(168,85,247,0.55)"
      : "rgba(168,85,247,0.2)";

  const bgColor = isNew
    ? "rgba(34,197,94,0.06)"
    : isTopmost
      ? "rgba(30,22,41,0.85)"
      : "rgba(20,12,30,0.5)";

  const variables = frame.variables ?? {};

  return (
    <div
      style={{
        ...styles.card,
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        opacity: isGone ? 0.45 : 1,
        transition: "all 0.15s ease",
      }}
    >
      {/* Frame title row */}
      <div style={styles.cardHeader}>
        <span
          style={{
            ...styles.frameName,
            color: isNew ? "#4ade80" : isTopmost ? "#e9d5ff" : "#94a3b8",
          }}
        >
          {frame.name}
        </span>
        {isNew && <span style={styles.newBadge}>new</span>}
        {isTopmost && !isNew && <span style={styles.activeBadge}>active</span>}
        <span style={styles.frameLineNo}>ln {frame.lineNo}</span>
      </div>

      {/* Variable boxes */}
      {Object.keys(variables).length === 0 ? (
        <div style={styles.noVars}>— empty frame —</div>
      ) : (
        <div style={styles.variableGrid}>
          {Object.entries(variables).map(([vn, vv]) => {
            const changeType = fc[vn];
            const metaKey = `${frame.id}:${vn}`;
            const meta = varMeta[metaKey];
            return (
              <VarBox
                key={vn}
                varName={vn}
                varVal={vv}
                changeType={changeType}
                meta={meta}
                currentStep={currentStep}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── VarBox ────────────────────────────────────────────────────────────────────

function VarBox({ varName, varVal, changeType, meta, currentStep }) {
  const [tooltip, setTooltip] = useState(null);
  const nameRef = useRef(null);
  const hideTimer = useRef(null);

  const borderColor =
    changeType === "created"
      ? "rgba(34,197,94,0.5)"
      : changeType === "changed"
        ? "rgba(251,191,36,0.5)"
        : changeType === "deleted"
          ? "rgba(239,68,68,0.5)"
          : "rgba(255,255,255,0.1)";

  const bgColor =
    changeType === "created"
      ? "rgba(34,197,94,0.08)"
      : changeType === "changed"
        ? "rgba(251,191,36,0.08)"
        : changeType === "deleted"
          ? "rgba(239,68,68,0.05)"
          : "rgba(255,255,255,0.02)";

  const isDeleted = changeType === "deleted";

  function showTooltip() {
    clearTimeout(hideTimer.current);
    if (!meta || !nameRef.current) return;
    const rect = nameRef.current.getBoundingClientRect();
    setTooltip({ x: rect.left, y: rect.bottom + 4, meta });
  }

  function scheduleHide() {
    hideTimer.current = setTimeout(() => setTooltip(null), 120);
  }

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <>
      <div
        style={{
          ...styles.varBox,
          border: `1px solid ${borderColor}`,
          backgroundColor: bgColor,
        }}
      >
        {/* Variable name */}
        <span
          ref={nameRef}
          style={{
            ...styles.varBoxName,
            textDecoration: isDeleted ? "line-through" : "none",
            color: isDeleted
              ? "#f87171"
              : changeType === "created"
                ? "#4ade80"
                : "#c4b5fd",
            cursor: meta ? "help" : "default",
          }}
          onMouseEnter={showTooltip}
          onMouseLeave={scheduleHide}
        >
          {varName}
        </span>

        {/* Equals sign */}
        <span style={styles.varBoxEq}>=</span>

        {/* Value */}
        <span style={styles.varBoxVal}>
          <ValueChip value={varVal} changeType={changeType} />
        </span>
      </div>

      {tooltip && (
        <MetaTooltip
          meta={tooltip.meta}
          currentStepIdx={currentStep?.stepNum}
          x={tooltip.x}
          y={tooltip.y}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={scheduleHide}
        />
      )}
    </>
  );
}

// ── ValueChip ─────────────────────────────────────────────────────────────────

function ValueChip({ value, changeType }) {
  if (!value) return <span style={styles.primitiveVal}>None</span>;

  if (value.type === "primitive") {
    const isStr = value.repr.startsWith("'") || value.repr.startsWith('"');
    return (
      <span
        style={{
          ...styles.primitiveVal,
          color: isStr
            ? "#a5f3fc"
            : /^-?\d/.test(value.repr)
              ? "#fca5a5"
              : "#e2e8f0",
        }}
      >
        {value.repr}
      </span>
    );
  }

  if (value.type === "ref") {
    const isNew = changeType === "created" || changeType === "changed";
    return (
      <span
        style={{
          ...styles.refChip,
          color: isNew ? "#34d399" : "#60a5fa",
          borderColor: isNew ? "rgba(52,211,153,0.4)" : "rgba(96,165,250,0.35)",
          backgroundColor: isNew
            ? "rgba(52,211,153,0.1)"
            : "rgba(96,165,250,0.1)",
          animation: isNew ? "tracerRefPulse 0.6s ease" : "none",
        }}
      >
        → {value.id}
      </span>
    );
  }

  return <span style={styles.otherVal}>{value.repr || "?"}</span>;
}

// ── MetaTooltip ───────────────────────────────────────────────────────────────
// Rendered with position:fixed so it floats above all panel content without
// affecting table layout. x / y are viewport coords (from getBoundingClientRect).

function MetaTooltip({
  meta,
  currentStepIdx,
  x,
  y,
  onMouseEnter,
  onMouseLeave,
}) {
  if (!meta) return null;

  // Clamp so the tooltip never clips off the right or bottom edge of the screen
  const clampedX = Math.min(x, window.innerWidth - 230);
  const clampedY = Math.min(y, window.innerHeight - 130);

  return (
    <div
      style={{ ...styles.tooltip, top: clampedY, left: clampedX }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={styles.tooltipRow}>
        <span style={styles.tooltipLabel}>First assigned:</span>
        <span style={styles.tooltipValue}>
          Step {meta.firstStep + 1}, Line {meta.firstLine}
        </span>
      </div>
      <div style={styles.tooltipRow}>
        <span style={styles.tooltipLabel}>Last modified:</span>
        <span style={styles.tooltipValue}>
          Step {meta.lastModStep + 1}, Line {meta.lastModLine}
        </span>
      </div>
      <div style={styles.tooltipRow}>
        <span style={styles.tooltipLabel}>Times accessed:</span>
        <span style={styles.tooltipValue}>{meta.accessCount}</span>
      </div>
      {currentStepIdx !== undefined && (
        <div style={styles.tooltipRow}>
          <span style={styles.tooltipLabel}>Steps ago (mod):</span>
          <span style={styles.tooltipValue}>
            {currentStepIdx - meta.lastModStep}
          </span>
        </div>
      )}
      <div
        style={{
          ...styles.tooltipRow,
          marginTop: 4,
          paddingTop: 4,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={styles.tooltipLabel}>Variable:</span>
        <span style={{ ...styles.tooltipValue, color: "#c084fc" }}>
          {meta.varName}
        </span>
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#050309",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    overflow: "hidden",
    minWidth: 0,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    backgroundColor: "#0a0612",
    flexShrink: 0,
  },

  headerIcon: {
    color: "#a855f7",
    fontSize: "16px",
    fontWeight: 700,
  },

  headerTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#e2e8f0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    flex: 1,
  },

  frameCount: {
    fontSize: "10px",
    color: "#a855f7",
    backgroundColor: "rgba(168,85,247,0.12)",
    border: "1px solid rgba(168,85,247,0.25)",
    borderRadius: "8px",
    padding: "1px 6px",
  },

  scrollArea: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: "8px",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(168,85,247,0.3) transparent",
  },

  frameArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 0",
  },

  empty: {
    textAlign: "center",
    color: "#4c3f6d",
    fontSize: "13px",
    marginTop: "40px",
    fontStyle: "italic",
  },

  card: {
    borderRadius: "8px",
    marginBottom: "0",
    padding: "12px",
    overflow: "hidden",
    border: "1px solid rgba(168,85,247,0.3)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "10px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  frameName: {
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "monospace",
    flex: 1,
  },

  newBadge: {
    fontSize: "9px",
    fontWeight: 600,
    color: "#4ade80",
    backgroundColor: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.4)",
    borderRadius: "6px",
    padding: "1px 5px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  activeBadge: {
    fontSize: "9px",
    fontWeight: 600,
    color: "#c084fc",
    backgroundColor: "rgba(168,85,247,0.15)",
    border: "1px solid rgba(168,85,247,0.3)",
    borderRadius: "6px",
    padding: "1px 5px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },

  frameLineNo: {
    fontSize: "10px",
    color: "#4c3f6d",
    fontFamily: "monospace",
  },

  noVars: {
    fontSize: "11px",
    color: "#4c3f6d",
    fontStyle: "italic",
    textAlign: "center",
    padding: "4px 0",
  },

  variableGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  varBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "12px",
    transition: "all 0.15s ease",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },

  varBoxName: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    minWidth: "80px",
  },

  varBoxEq: {
    color: "#4c3f6d",
    fontSize: "12px",
  },

  varBoxVal: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  primitiveVal: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#e2e8f0",
    wordBreak: "break-all",
  },

  refChip: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: 600,
    padding: "1px 6px",
    borderRadius: "4px",
    border: "1px solid",
    display: "inline-block",
  },

  otherVal: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#94a3b8",
    fontStyle: "italic",
  },

  // Fixed-position floating tooltip
  tooltip: {
    position: "fixed",
    backgroundColor: "rgba(10,6,18,0.97)",
    border: "1px solid rgba(168,85,247,0.4)",
    borderRadius: "6px",
    padding: "8px 10px",
    fontSize: "11px",
    zIndex: 9000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.7)",
    minWidth: "210px",
    maxWidth: "280px",
    pointerEvents: "auto",
  },

  tooltipRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "3px",
  },

  tooltipLabel: {
    color: "#94a3b8",
    fontWeight: 500,
  },

  tooltipValue: {
    color: "#e9d5ff",
    fontFamily: "monospace",
  },
};

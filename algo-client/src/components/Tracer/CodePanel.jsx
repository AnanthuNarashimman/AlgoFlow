import React, { useEffect, useRef } from 'react';

/**
 * CodePanel
 * ──────────────────────────────────────────────────────────────────────────────
 * Displays Python source code with:
 *   • Current-line green highlight + ▶ arrow
 *   • Clickable gutter to toggle breakpoints (red ● dot)
 *   • Named bookmarks shown as a blue ◆ in the gutter
 *   • Smooth auto-scroll to the active line
 *   • 150 ms CSS transition on all highlight changes
 */
export default function CodePanel({
  code = '',
  currentStep,
  breakpoints,          // Set<number>  — line numbers
  onToggleBreakpoint,   // (lineNo) => void
  bookmarks = [],       // [{ stepIdx, name, lineNo }]
}) {
  const containerRef  = useRef(null);
  const activeLineRef = useRef(null);

  const lines         = code.split('\n');
  const activeLine    = currentStep?.lineNo ?? -1;

  // Bookmark lines
  const bookmarkLines = new Set(bookmarks.map(b => b.lineNo).filter(Boolean));

  // Scroll the active line into view whenever it changes
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
    }
  }, [activeLine]);

  return (
    <div style={styles.wrapper}>
      {/* Panel header */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>{'</>'}</span>
        <span style={styles.headerTitle}>Code</span>
        {breakpoints.size > 0 && (
          <span style={styles.bpBadge}>
            {breakpoints.size} breakpoint{breakpoints.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Scrollable code area */}
      <div ref={containerRef} style={styles.codeArea}>
        {lines.map((lineText, idx) => {
          const lineNo    = idx + 1;
          const isActive  = lineNo === activeLine;
          const hasBP     = breakpoints.has(lineNo);
          const hasBkmark = bookmarkLines.has(lineNo);

          return (
            <div
              key={idx}
              ref={isActive ? activeLineRef : null}
              style={{
                ...styles.lineRow,
                backgroundColor : isActive ? 'rgba(34,197,94,0.12)' : 'transparent',
                borderLeft      : isActive
                  ? '3px solid #22c55e'
                  : hasBP
                    ? '3px solid #ef4444'
                    : '3px solid transparent',
                transition      : 'background-color 0.15s ease, border-left-color 0.15s ease',
              }}
            >
              {/* Gutter: line-number + breakpoint dot */}
              <div
                style={styles.gutter}
                onClick={() => onToggleBreakpoint(lineNo)}
                title={hasBP ? 'Remove breakpoint' : 'Add breakpoint'}
              >
                {hasBP ? (
                  <span style={styles.bpDot}>●</span>
                ) : hasBkmark ? (
                  <span style={styles.bkmarkDot}>◆</span>
                ) : (
                  <span style={styles.lineNum}>{lineNo}</span>
                )}
              </div>

              {/* Arrow column */}
              <div style={styles.arrowCol}>
                {isActive && (
                  <span style={styles.arrow}>▶</span>
                )}
              </div>

              {/* Source text */}
              <pre style={{
                ...styles.lineContent,
                color: isActive ? '#e2e8f0' : '#94a3b8',
              }}>
                {lineText || ' '}
              </pre>
            </div>
          );
        })}

        {/* Bottom padding so last line isn't flush against the nav bar */}
        <div style={{ height: '48px' }} />
      </div>

      {/* Inline key */}
      <div style={styles.legend}>
        <LegendItem color="#22c55e" label="executing" />
        <LegendItem color="#ef4444" label="breakpoint" />
        <LegendItem color="#60a5fa" label="bookmark" />
      </div>
    </div>
  );
}


// ── tiny helper ───────────────────────────────────────────────────────────────

function LegendItem({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}


// ── styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display        : 'flex',
    flexDirection  : 'column',
    height         : '100%',
    backgroundColor: '#050309',
    borderRight    : '1px solid rgba(255,255,255,0.05)',
    overflow       : 'hidden',
    minWidth       : 0,
  },

  header: {
    display        : 'flex',
    alignItems     : 'center',
    gap            : '8px',
    padding        : '10px 12px',
    borderBottom   : '1px solid rgba(255,255,255,0.07)',
    backgroundColor: '#0a0612',
    flexShrink     : 0,
  },

  headerIcon: {
    color    : '#a855f7',
    fontSize : '13px',
    fontFamily: 'monospace',
  },

  headerTitle: {
    fontSize  : '12px',
    fontWeight: 600,
    color     : '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    flex      : 1,
  },

  bpBadge: {
    fontSize        : '10px',
    color           : '#fca5a5',
    backgroundColor : 'rgba(239,68,68,0.15)',
    border          : '1px solid rgba(239,68,68,0.3)',
    borderRadius    : '8px',
    padding         : '1px 6px',
  },

  codeArea: {
    flex      : 1,
    overflowY : 'auto',
    overflowX : 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(168,85,247,0.3) transparent',
  },

  lineRow: {
    display   : 'flex',
    alignItems: 'center',
    minHeight : '22px',
    cursor    : 'default',
  },

  gutter: {
    width      : '40px',
    minWidth   : '40px',
    textAlign  : 'right',
    paddingRight: '8px',
    cursor     : 'pointer',
    userSelect : 'none',
    flexShrink : 0,
  },

  lineNum: {
    fontSize: '11px',
    color   : '#4c3f6d',
    fontFamily: 'monospace',
  },

  bpDot: {
    fontSize: '12px',
    color   : '#ef4444',
    filter  : 'drop-shadow(0 0 4px #ef4444)',
  },

  bkmarkDot: {
    fontSize: '11px',
    color   : '#60a5fa',
    filter  : 'drop-shadow(0 0 3px #60a5fa)',
  },

  arrowCol: {
    width    : '18px',
    minWidth : '18px',
    textAlign: 'center',
    flexShrink: 0,
  },

  arrow: {
    fontSize: '11px',
    color   : '#22c55e',
    filter  : 'drop-shadow(0 0 5px #22c55e)',
    animation: 'codePanelPulse 1.2s ease-in-out infinite',
  },

  lineContent: {
    margin    : 0,
    padding   : '0 8px 0 2px',
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize  : '13px',
    lineHeight: '22px',
    whiteSpace: 'pre',
    flex      : 1,
    minWidth  : 0,
  },

  legend: {
    display        : 'flex',
    gap            : '12px',
    padding        : '6px 12px',
    borderTop      : '1px solid rgba(255,255,255,0.05)',
    backgroundColor: '#080510',
    flexShrink     : 0,
  },
};

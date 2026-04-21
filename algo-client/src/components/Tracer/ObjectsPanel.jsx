import React, {
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { extractRefs } from "./pythonTracer.js";

/**
 * ObjectsPanel
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders all heap objects at the current execution step with:
 *
 *  • Python-Tutor–style boxes  (tuple / list / dict / set)
 *  • SVG bezier arrows between reference slots and target objects
 *  • Green border  – object newly created this step
 *  • Yellow border – object mutated this step
 *  • Blue animated arrows for references that just appeared (new or changed)
 *  • Hover tooltip on each object showing its type and id
 *
 * Bug-fixes applied vs. the initial draft
 * ─────────────────────────────────────────
 *  1. containerRef is now placed on the *scrollable canvas* div, not the
 *     outer wrapper.  Arrow coordinates are computed relative to the canvas
 *     so they match the SVG's own coordinate origin.
 *  2. useLayoutEffect has a proper dependency array [currentStep,
 *     scrollVersion] to prevent the "no-deps → setArrows → re-render →
 *     useLayoutEffect → setArrows → …" infinite loop.
 *  3. A scroll listener increments scrollVersion so arrows are recomputed
 *     whenever the user scrolls the panel.
 *  4. setBoxRef / setSlotRef clean up stale refs on element unmount.
 */
export default function ObjectsPanel({ currentStep }) {
  const heap = currentStep?.heap ?? {};
  const heapChanges = currentStep?.heapChanges ?? {};

  // ── refs ───────────────────────────────────────────────────────────────────
  const canvasRef = useRef(null); // scrollable canvas element
  const boxRefs = useRef({}); // objId  → DOM element
  const slotRefs = useRef({}); // `${objId}:${cellKey}` → DOM element

  // ── state ──────────────────────────────────────────────────────────────────
  const [arrows, setArrows] = useState([]);
  // Incremented by the scroll listener; triggers arrow recomputation.
  const [scrollVersion, setScrollVersion] = useState(0);

  // ── scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onScroll = () => setScrollVersion((v) => v + 1);
    canvas.addEventListener("scroll", onScroll, { passive: true });
    return () => canvas.removeEventListener("scroll", onScroll);
  }, []);

  // ── ref-registration callbacks ─────────────────────────────────────────────
  // Clean up (delete) the entry when the element is unmounted (el === null).
  const setBoxRef = useCallback((id, el) => {
    if (el) boxRefs.current[id] = el;
    else delete boxRefs.current[id];
  }, []);

  const setSlotRef = useCallback((k, el) => {
    if (el) slotRefs.current[k] = el;
    else delete slotRefs.current[k];
  }, []);

  // ── arrow computation ──────────────────────────────────────────────────────
  // Runs after every step change OR scroll event, but NOT after setArrows
  // itself (deps are stable between those re-renders → no infinite loop).
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use the canvas element as the coordinate origin (matches the SVG's
    // absolute-positioned top-left corner inside that same div).
    const cr = canvas.getBoundingClientRect();
    const next = [];

    for (const [objId, obj] of Object.entries(heap)) {
      const refs = extractRefs(obj);
      for (const { cellKey, targetId } of refs) {
        const fromEl = slotRefs.current[`${objId}:${cellKey}`];
        const toEl = boxRefs.current[targetId];
        if (!fromEl || !toEl) continue;

        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();

        // Coordinates relative to the canvas top-left = SVG (0,0).
        const x1 = fr.right - cr.left;
        const y1 = fr.top + fr.height / 2 - cr.top;
        const x2 = tr.left - cr.left;
        const y2 = tr.top + tr.height / 2 - cr.top;

        const isNew = heapChanges[targetId] === "created";
        next.push({
          key: `${objId}:${cellKey}:${targetId}`,
          x1,
          y1,
          x2,
          y2,
          isNew,
        });
      }
    }

    setArrows(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, scrollVersion]);
  // NOTE: `heap` and `heapChanges` are derived from `currentStep`; listing
  // `currentStep` alone is sufficient and avoids object-identity issues.

  const hasObjects = Object.keys(heap).length > 0;

  return (
    <div style={styles.wrapper}>
      {/* ── Panel header ──────────────────────────────────────────────────── */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>⬡</span>
        <span style={styles.headerTitle}>Objects</span>
        <span style={styles.objCount}>
          {Object.keys(heap).length} object
          {Object.keys(heap).length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Scrollable canvas ─────────────────────────────────────────────── */}
      <div ref={canvasRef} style={styles.canvas}>
        {/* SVG arrow overlay — absolute within canvas, overflow:visible so
            arrows to partially-scrolled boxes remain drawable */}
        <svg style={styles.svgOverlay} aria-hidden="true">
          <defs>
            <marker
              id="arrowBlue"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" />
            </marker>
            <marker
              id="arrowGreen"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#4ade80" />
            </marker>
          </defs>

          {arrows.map((a) => {
            const cx1 = a.x1 + Math.min(60, Math.abs(a.x2 - a.x1) * 0.4);
            const cx2 = a.x2 - Math.min(60, Math.abs(a.x2 - a.x1) * 0.4);
            return (
              <path
                key={a.key}
                d={`M ${a.x1} ${a.y1} C ${cx1} ${a.y1} ${cx2} ${a.y2} ${a.x2} ${a.y2}`}
                fill="none"
                stroke={a.isNew ? "#4ade80" : "#60a5fa"}
                strokeWidth={a.isNew ? 2 : 1.5}
                markerEnd={a.isNew ? "url(#arrowGreen)" : "url(#arrowBlue)"}
                opacity={0.85}
                style={a.isNew ? { animation: "objArrowPulse 0.7s ease" } : {}}
              />
            );
          })}
        </svg>

        {/* Object boxes */}
        {!hasObjects ? (
          <div style={styles.empty}>No heap objects</div>
        ) : (
          <div style={styles.objGrid}>
            {Object.values(heap).map((obj) => (
              <ObjectBox
                key={obj.id}
                obj={obj}
                changeType={heapChanges[obj.id]}
                setBoxRef={setBoxRef}
                setSlotRef={setSlotRef}
              />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <LegendItem color="#4ade80" label="new" />
        <LegendItem color="#fbbf24" label="mutated" />
        <LegendItem color="#60a5fa" label="pointer" />
      </div>
    </div>
  );
}

// ── ObjectBox ─────────────────────────────────────────────────────────────────

function ObjectBox({ obj, changeType, setBoxRef, setSlotRef }) {
  const [hovered, setHovered] = useState(false);

  const isNew = changeType === "created";
  const isChanged = changeType === "changed";

  const borderColor = isNew
    ? "#4ade80"
    : isChanged
      ? "#fbbf24"
      : hovered
        ? "rgba(168,85,247,0.6)"
        : "rgba(168,85,247,0.25)";

  const bgColor = isNew
    ? "rgba(34,197,94,0.07)"
    : isChanged
      ? "rgba(251,191,36,0.07)"
      : "rgba(22,14,35,0.75)";

  const shortId = obj.id.replace("obj_", "").slice(-6);

  return (
    <div
      ref={(el) => setBoxRef(obj.id, el)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.box,
        border: `1.5px solid ${borderColor}`,
        backgroundColor: bgColor,
        boxShadow: isNew
          ? "0 0 12px rgba(34,197,94,0.25)"
          : isChanged
            ? "0 0 12px rgba(251,191,36,0.2)"
            : hovered
              ? "0 0 10px rgba(168,85,247,0.2)"
              : "none",
        transition: "all 0.15s ease",
      }}
    >
      {/* Object label */}
      <div style={styles.boxLabel}>
        <span
          style={{
            ...styles.typeTag,
            color: typeColor(obj.type),
          }}
        >
          {obj.type}
        </span>
        <span style={styles.objId}>#{shortId}</span>
        {isNew && <span style={styles.newBadge}>new</span>}
        {isChanged && <span style={styles.changedBadge}>mut</span>}
      </div>

      {/* Content */}
      <div style={styles.boxContent}>
        {obj.type === "tuple" && (
          <TupleContent obj={obj} setSlotRef={setSlotRef} />
        )}
        {obj.type === "list" && (
          <ListContent obj={obj} setSlotRef={setSlotRef} />
        )}
        {obj.type === "dict" && (
          <DictContent obj={obj} setSlotRef={setSlotRef} />
        )}
        {obj.type === "set" && <SetContent obj={obj} setSlotRef={setSlotRef} />}
        {obj.type === "frozenset" && (
          <SetContent obj={obj} setSlotRef={setSlotRef} label="frozenset" />
        )}
        {obj.type === "circular" && <CircularContent obj={obj} />}
        {obj.type === "other" && <OtherContent obj={obj} />}
      </div>
    </div>
  );
}

// ── Sequence helpers (tuple / list) ───────────────────────────────────────────

function TupleContent({ obj, setSlotRef }) {
  const elems = obj.elements ?? [];
  return (
    <div style={styles.seqRow}>
      <span style={styles.bracket}>(</span>
      {elems.map((el, idx) => (
        <SeqCell
          key={idx}
          el={el}
          cellKey={`e${idx}`}
          objId={obj.id}
          setSlotRef={setSlotRef}
          isLast={idx === elems.length - 1}
        />
      ))}
      {elems.length === 0 && <span style={styles.emptySeq}>empty</span>}
      <span style={styles.bracket}>)</span>
    </div>
  );
}

function ListContent({ obj, setSlotRef }) {
  const elems = obj.elements ?? [];
  return (
    <div style={styles.seqRow}>
      <span style={styles.bracket}>[</span>
      {elems.map((el, idx) => (
        <SeqCell
          key={idx}
          el={el}
          cellKey={`e${idx}`}
          objId={obj.id}
          setSlotRef={setSlotRef}
          isLast={idx === elems.length - 1}
        />
      ))}
      {elems.length === 0 && <span style={styles.emptySeq}>empty</span>}
      <span style={styles.bracket}>]</span>
    </div>
  );
}

function SeqCell({ el, cellKey, objId, setSlotRef, isLast }) {
  const isRef = el?.type === "ref";
  return (
    <>
      <div
        ref={(domEl) => setSlotRef(`${objId}:${cellKey}`, domEl)}
        title={isRef ? `→ ${el.id}` : undefined}
        style={{
          ...styles.cell,
          backgroundColor: isRef
            ? "rgba(96,165,250,0.12)"
            : "rgba(255,255,255,0.04)",
          borderColor: isRef
            ? "rgba(96,165,250,0.45)"
            : "rgba(255,255,255,0.12)",
          color: isRef ? "#60a5fa" : primitiveColor(el),
          cursor: isRef ? "pointer" : "default",
        }}
      >
        {isRef ? "→" : (el?.repr ?? "None")}
      </div>
      {!isLast && <span style={styles.comma}>,</span>}
    </>
  );
}

// ── Dict ──────────────────────────────────────────────────────────────────────

function DictContent({ obj, setSlotRef }) {
  const pairs = obj.pairs ?? [];
  return (
    <div style={styles.dictTable}>
      {pairs.length === 0 && <span style={styles.emptySeq}>empty</span>}
      {pairs.map(([k, v], idx) => {
        const isRef = v?.type === "ref";
        return (
          <div key={idx} style={styles.dictRow}>
            <span style={styles.dictKey}>{k}</span>
            <span style={styles.dictColon}>:</span>
            <div
              ref={(el) => setSlotRef(`${obj.id}:p${idx}`, el)}
              title={isRef ? `→ ${v.id}` : undefined}
              style={{
                ...styles.cell,
                backgroundColor: isRef
                  ? "rgba(96,165,250,0.12)"
                  : "rgba(255,255,255,0.04)",
                borderColor: isRef
                  ? "rgba(96,165,250,0.45)"
                  : "rgba(255,255,255,0.12)",
                color: isRef ? "#60a5fa" : primitiveColor(v),
              }}
            >
              {isRef ? "→" : (v?.repr ?? "None")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Set / FrozenSet ───────────────────────────────────────────────────────────

function SetContent({ obj, setSlotRef, label }) {
  const elems = obj.elements ?? [];
  return (
    <div style={styles.seqRow}>
      <span style={styles.bracket}>{label === "frozenset" ? "fs{" : "{"}</span>
      {elems.map((el, idx) => (
        <SeqCell
          key={idx}
          el={el}
          cellKey={`e${idx}`}
          objId={obj.id}
          setSlotRef={setSlotRef}
          isLast={idx === elems.length - 1}
        />
      ))}
      {elems.length === 0 && <span style={styles.emptySeq}>∅</span>}
      <span style={styles.bracket}>{"}"}</span>
    </div>
  );
}

// ── Misc content ──────────────────────────────────────────────────────────────

function CircularContent({ obj }) {
  return (
    <span style={{ ...styles.emptySeq, color: "#f87171" }}>
      ⟳ circular: {obj.repr}
    </span>
  );
}

function OtherContent({ obj }) {
  return (
    <span style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>
      {obj.repr}
    </span>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function typeColor(type) {
  switch (type) {
    case "tuple":
      return "#c084fc";
    case "list":
      return "#34d399";
    case "dict":
      return "#fbbf24";
    case "set":
      return "#f87171";
    case "frozenset":
      return "#f87171";
    default:
      return "#94a3b8";
  }
}

function primitiveColor(v) {
  if (!v) return "#e2e8f0";
  if (v.type !== "primitive") return "#e2e8f0";
  const r = v.repr;
  if (r === "None") return "#6b7280";
  if (r === "True" || r === "False") return "#fca5a5";
  if (r.startsWith("'") || r.startsWith('"')) return "#a5f3fc";
  if (/^-?\d/.test(r)) return "#fca5a5";
  return "#e2e8f0";
}

function LegendItem({ color, label }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        color: "#64748b",
        fontSize: "10px",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#050309",
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
    fontSize: "14px",
  },

  headerTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#e2e8f0",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    flex: 1,
  },

  objCount: {
    fontSize: "10px",
    color: "#a855f7",
    backgroundColor: "rgba(168,85,247,0.12)",
    border: "1px solid rgba(168,85,247,0.25)",
    borderRadius: "8px",
    padding: "1px 6px",
  },

  canvas: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative", // SVG absolute child anchors here
    padding: "10px 12px",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(168,85,247,0.3) transparent",
  },

  svgOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 5,
    overflow: "visible", // allow arrows that point outside the visible area
  },

  objGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    position: "relative",
    zIndex: 1,
  },

  empty: {
    textAlign: "center",
    color: "#4c3f6d",
    fontSize: "13px",
    marginTop: "40px",
    fontStyle: "italic",
  },

  box: {
    borderRadius: "7px",
    padding: "8px 10px",
  },

  boxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "6px",
  },

  typeTag: {
    fontFamily: "monospace",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "lowercase",
  },

  objId: {
    fontSize: "10px",
    color: "#4c3f6d",
    fontFamily: "monospace",
    flex: 1,
  },

  newBadge: {
    fontSize: "9px",
    fontWeight: 600,
    color: "#4ade80",
    backgroundColor: "rgba(34,197,94,0.15)",
    border: "1px solid rgba(34,197,94,0.4)",
    borderRadius: "5px",
    padding: "1px 4px",
    textTransform: "uppercase",
  },

  changedBadge: {
    fontSize: "9px",
    fontWeight: 600,
    color: "#fbbf24",
    backgroundColor: "rgba(251,191,36,0.15)",
    border: "1px solid rgba(251,191,36,0.4)",
    borderRadius: "5px",
    padding: "1px 4px",
    textTransform: "uppercase",
  },

  boxContent: {
    overflowX: "auto",
  },

  seqRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "2px",
  },

  bracket: {
    fontFamily: "monospace",
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: 1,
  },

  cell: {
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "2px 6px",
    borderRadius: "3px",
    border: "1px solid",
    lineHeight: "18px",
    whiteSpace: "nowrap",
    minWidth: "20px",
    textAlign: "center",
  },

  comma: {
    color: "#4c3f6d",
    fontSize: "12px",
    lineHeight: 1,
    alignSelf: "center",
  },

  emptySeq: {
    fontSize: "11px",
    color: "#4c3f6d",
    fontStyle: "italic",
    padding: "0 4px",
  },

  dictTable: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  dictRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  dictKey: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#fbbf24",
    minWidth: "20px",
  },

  dictColon: {
    color: "#4c3f6d",
    fontSize: "12px",
  },

  legend: {
    display: "flex",
    gap: "12px",
    padding: "6px 12px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    backgroundColor: "#080510",
    flexShrink: 0,
  },
};

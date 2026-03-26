/**
 * pythonTracer.js
 * ────────────────────────────────────────────────────────────────────────────
 * Embeds a sys.settrace–based Python tracer that runs inside Pyodide.
 *
 * Key fixes vs. the initial draft
 * ────────────────────────────────
 *  1. _mock_input() stub added so code that calls input() doesn't hang.
 *  2. exec() globals now include { input: _mock_input } so the stub is
 *     visible to user code without polluting the real builtins.
 *  3. One-time install optimisation: TRACER_SETUP_PYTHON is pushed into
 *     Pyodide only once per session (flag on the pyodide instance).
 *     run_tracer() itself resets _trace_steps / _tracing_on each call.
 *  4. JSON serialisation uses the _json_mod alias to avoid shadowing the
 *     user's potential `json` import.
 */

// ─── Python source installed once into Pyodide's global namespace ────────────

export const TRACER_SETUP_PYTHON = `
import sys as _sys

_trace_steps  = []
_tracing_on   = False
_MAX_STEPS    = 800
_USER_FILE    = '<user_code>'


# ── input() stub ──────────────────────────────────────────────────────────────
# Real interactive input is not supported during tracing.
# The stub returns an empty string so execution can continue.

def _mock_input(prompt=''):
    return ''


# ── value serialiser ──────────────────────────────────────────────────────────

def _safe_repr(v, n=80):
    try:
        s = repr(v)
        return s if len(s) <= n else s[:n - 3] + '...'
    except Exception:
        return '<repr error>'


def _ser(v, heap, seen=None, depth=0):
    """Return a JSON-safe dict describing *v*; complex objects go into *heap*."""
    if seen is None:
        seen = frozenset()
    if depth > 10:
        return {'type': 'other', 'repr': '...'}

    if v is None:
        return {'type': 'primitive', 'repr': 'None'}
    if isinstance(v, bool):
        return {'type': 'primitive', 'repr': 'True' if v else 'False'}
    if isinstance(v, int):
        return {'type': 'primitive', 'repr': str(v)}
    if isinstance(v, float):
        return {'type': 'primitive', 'repr': _safe_repr(v, 25)}
    if isinstance(v, str):
        r = repr(v)
        if len(r) > 55:
            r = r[:52] + '...'
        return {'type': 'primitive', 'repr': r}

    oid = id(v)
    hid = 'obj_' + str(oid)

    if isinstance(v, (tuple, list, dict, set, frozenset)):
        # Already in heap → return a ref (handles shared objects & circular refs)
        if hid in heap:
            return {'type': 'ref', 'id': hid}
        # Seen in the current recursion path → circular reference
        if oid in seen:
            heap[hid] = {'type': 'circular', 'id': hid, 'repr': _safe_repr(v, 30)}
            return {'type': 'ref', 'id': hid}

        seen2 = seen | {oid}

        if isinstance(v, tuple):
            heap[hid] = {'type': 'tuple', 'id': hid, 'elements': []}
            heap[hid]['elements'] = [_ser(x, heap, seen2, depth + 1) for x in v]
        elif isinstance(v, list):
            heap[hid] = {'type': 'list', 'id': hid, 'elements': []}
            heap[hid]['elements'] = [_ser(x, heap, seen2, depth + 1) for x in v]
        elif isinstance(v, dict):
            heap[hid] = {'type': 'dict', 'id': hid, 'pairs': []}
            heap[hid]['pairs'] = [
                [_safe_repr(k, 30), _ser(val, heap, seen2, depth + 1)]
                for k, val in v.items()
            ]
        elif isinstance(v, (set, frozenset)):
            stype = 'frozenset' if isinstance(v, frozenset) else 'set'
            heap[hid] = {'type': stype, 'id': hid, 'elements': []}
            try:
                sv = sorted(v, key=repr)
            except Exception:
                sv = list(v)
            heap[hid]['elements'] = [_ser(x, heap, seen2, depth + 1) for x in sv]

        return {'type': 'ref', 'id': hid}

    # callable, module, class instance, etc.
    return {'type': 'other', 'repr': _safe_repr(v, 60)}


# ── frame capturer ────────────────────────────────────────────────────────────

def _cap_vars(frame, heap):
    """Capture local variables of *frame*, skipping dunders and tracer internals."""
    out = {}
    _SKIP = frozenset({
        '_sys', '_trace_steps', '_tracing_on', '_MAX_STEPS', '_USER_FILE',
        '_mock_input', '_safe_repr', '_ser', '_cap_vars', '_frame_name',
        '_trace_fn', 'run_tracer',
    })
    for k, v in frame.f_locals.items():
        if (k.startswith('__') and k.endswith('__')) or k in _SKIP:
            continue
        try:
            out[k] = _ser(v, heap)
        except Exception:
            out[k] = {'type': 'other', 'repr': '?'}
    return out


def _frame_name(f):
    n = f.f_code.co_name
    return 'Global Frame' if n == '<module>' else n


# ── trace function ────────────────────────────────────────────────────────────

def _trace_fn(frame, event, arg):
    global _tracing_on
    if not _tracing_on:
        return None
    if len(_trace_steps) >= _MAX_STEPS:
        return None
    if frame.f_code.co_filename != _USER_FILE:
        # Keep the trace hook active for this frame (child calls may be user code)
        return _trace_fn
    if event not in ('line', 'call', 'return'):
        return _trace_fn

    heap = {}

    # Build the call-stack from outermost to innermost user frame
    chain = []
    f = frame
    while f is not None:
        if f.f_code.co_filename == _USER_FILE:
            chain.append({
                'id':        str(id(f)),
                'name':      _frame_name(f),
                'lineNo':    f.f_lineno,
                'variables': _cap_vars(f, heap),
            })
        f = f.f_back
    chain.reverse()

    ret_val = None
    if event == 'return':
        try:
            ret_val = _ser(arg, heap)
        except Exception:
            ret_val = {'type': 'other', 'repr': '?'}

    _trace_steps.append({
        'stepNum':   len(_trace_steps),
        'event':     event,
        'lineNo':    frame.f_lineno,
        'funcName':  _frame_name(frame),
        'frames':    chain,
        'heap':      heap,
        'returnVal': ret_val,
    })
    return _trace_fn


# ── public entry point ────────────────────────────────────────────────────────

def run_tracer(user_code):
    """
    Trace *user_code* and return the list of captured steps.
    Safe to call multiple times; resets all global state on each invocation.
    input() calls in user code return '' via the _mock_input stub.
    """
    global _trace_steps, _tracing_on
    _trace_steps = []
    _tracing_on  = True

    # Build a minimal-but-complete globals dict for exec:
    #   __builtins__  – gives access to all Python built-ins
    #   input         – replaced with the non-blocking stub
    _exec_globals = {
        '__builtins__': __builtins__,
        'input':        _mock_input,
    }

    try:
        compiled = compile(user_code, _USER_FILE, 'exec')
        _sys.settrace(_trace_fn)
        exec(compiled, _exec_globals)
    except SystemExit:
        pass
    except Exception as exc:
        import traceback as _tb
        _trace_steps.append({
            'stepNum':   len(_trace_steps),
            'event':     'error',
            'lineNo':    exc.__traceback__.tb_lineno if exc.__traceback__ else -1,
            'funcName':  '',
            'frames':    [],
            'heap':      {},
            'returnVal': None,
            'errorMsg':  str(exc),
            'traceback': _tb.format_exc(),
        })
    finally:
        _sys.settrace(None)
        _tracing_on = False

    return _trace_steps
`;

// ─── JS: run tracer inside Pyodide ───────────────────────────────────────────

/**
 * Install the Python tracer into Pyodide (once per session) then execute it
 * against *userCode*.  Returns { steps, varMeta }.
 *
 * @param {object} pyodide  – the loaded Pyodide instance
 * @param {string} userCode – Python source to trace
 */
export async function runPythonTracer(pyodide, userCode) {
  // ── one-time install ────────────────────────────────────────────────────────
  // We attach a flag directly on the pyodide instance so that repeated calls
  // to "Step Trace" don't re-parse and re-compile the ~200-line setup module.
  // run_tracer() itself already resets _trace_steps on every invocation.
  if (!pyodide._algoflowTracerReady) {
    pyodide.runPython(TRACER_SETUP_PYTHON);
    pyodide._algoflowTracerReady = true;
  }

  // ── execute tracer and collect JSON ────────────────────────────────────────
  const jsonResult = pyodide.runPython(
    // Use an alias (_json_mod) so we don't shadow a user-level `json` import
    // that might still be alive in Pyodide's global namespace.
    `import json as _json_mod; _json_mod.dumps(run_tracer(${JSON.stringify(userCode)}))`,
  );

  const rawSteps = JSON.parse(jsonResult);
  return postProcessSteps(rawSteps, userCode);
}

// ─── JS: value formatter ─────────────────────────────────────────────────────

/**
 * Format a serialised value for human-readable display.
 * @param {object|null} v      serialised value from the Python tracer
 * @param {boolean}     arrow  if true, refs render as '→' only (no id suffix)
 */
export function fmtVal(v, arrow = false) {
  if (!v) return "None";
  if (v.type === "primitive") return v.repr;
  if (v.type === "ref") return arrow ? "→" : `→ ${v.id}`;
  if (v.type === "other") return v.repr || "?";
  if (v.type === "circular") return v.repr || "(circular)";
  return "?";
}

// ─── JS: change detection ────────────────────────────────────────────────────

/**
 * Compare two adjacent raw steps and return per-frame and per-heap-object
 * change records.
 *
 * frameChanges: { [frameId]: { [varName]: 'created'|'changed'|'deleted',
 *                               __isNew?: true, __isGone?: true } }
 * heapChanges:  { [objId]: 'created'|'changed' }
 */
function computeChanges(prevStep, currStep) {
  const frameChanges = {};
  const heapChanges = {};

  if (!prevStep) return { frameChanges, heapChanges };

  // Build a lookup from the previous step's frames
  const prevById = {};
  for (const f of prevStep.frames || []) prevById[f.id] = f;

  // Compare current frames against previous
  for (const frame of currStep.frames || []) {
    const pf = prevById[frame.id];
    const fc = {};

    if (!pf) fc.__isNew = true;

    for (const [vn, vv] of Object.entries(frame.variables || {})) {
      const pv = pf?.variables?.[vn];
      if (pv === undefined) {
        fc[vn] = "created";
      } else if (JSON.stringify(pv) !== JSON.stringify(vv)) {
        fc[vn] = "changed";
      }
    }

    if (pf) {
      for (const vn of Object.keys(pf.variables || {})) {
        if (!(vn in (frame.variables || {}))) fc[vn] = "deleted";
      }
    }

    frameChanges[frame.id] = fc;
  }

  // Mark frames that disappeared entirely
  for (const pf of prevStep.frames || []) {
    if (!frameChanges[pf.id]) frameChanges[pf.id] = { __isGone: true };
  }

  // Heap-object changes
  const prevHeap = prevStep.heap || {};
  for (const [oid, obj] of Object.entries(currStep.heap || {})) {
    if (!(oid in prevHeap)) {
      heapChanges[oid] = "created";
    } else if (JSON.stringify(prevHeap[oid]) !== JSON.stringify(obj)) {
      heapChanges[oid] = "changed";
    }
  }

  return { frameChanges, heapChanges };
}

// ─── JS: log message builder ──────────────────────────────────────────────────

function buildLogMessage(step, prevStep, lines, frameChanges) {
  const ln = step.lineNo > 0 ? step.lineNo : null;
  const lineText = ln ? (lines[ln - 1] || "").trim() : "";
  const prefix = ln ? `Line ${ln}` : "";

  if (step.event === "call") {
    const fn =
      step.funcName === "Global Frame" ? "<module>" : `${step.funcName}()`;
    return `${prefix}: ${fn} called`;
  }

  if (step.event === "return") {
    const rv = fmtVal(step.returnVal);
    const fn = step.funcName === "Global Frame" ? "<module>" : step.funcName;
    return `${prefix}: return ${rv} ← ${fn}`;
  }

  if (step.event === "error") {
    return `ERROR at ${prefix}: ${step.errorMsg || "unknown error"}`;
  }

  // 'line' event — describe variables that changed in this step
  if (prevStep) {
    const descs = [];
    for (const frame of step.frames || []) {
      const fc = frameChanges[frame.id] || {};

      if (fc.__isNew) {
        const fn =
          frame.name === "Global Frame" ? "<module>" : `${frame.name}()`;
        descs.push(`${fn} entered`);
        continue;
      }

      for (const [vn, ct] of Object.entries(fc)) {
        if (vn.startsWith("__")) continue;
        const val = fmtVal(frame.variables?.[vn]);
        if (ct === "created") descs.push(`${vn} = ${val}`);
        else if (ct === "changed") descs.push(`${vn} → ${val}`);
        else if (ct === "deleted") descs.push(`${vn} gone`);
      }
    }
    if (descs.length) return `${prefix}: ${descs.slice(0, 4).join(", ")}`;
  }

  return lineText ? `${prefix}: ${lineText}` : `Step ${step.stepNum + 1}`;
}

// ─── JS: main post-processor ─────────────────────────────────────────────────

/**
 * Enrich raw steps with change info, log messages, and variable metadata.
 *
 * @param {Array}  rawSteps  – output of run_tracer() parsed from JSON
 * @param {string} code      – original Python source
 * @returns {{ steps: Array, varMeta: object }}
 */
export function postProcessSteps(rawSteps, code) {
  const lines = code.split("\n");
  const varMeta = {}; // key: `${frameId}:${varName}`

  const steps = rawSteps.map((step, idx) => {
    const prevStep = idx > 0 ? rawSteps[idx - 1] : null;
    const { frameChanges, heapChanges } = computeChanges(prevStep, step);

    // Build / update variable metadata (used by the Step Metadata Tooltip)
    for (const frame of step.frames || []) {
      for (const vn of Object.keys(frame.variables || {})) {
        const key = `${frame.id}:${vn}`;
        const fc = frameChanges[frame.id] || {};

        if (!varMeta[key]) {
          varMeta[key] = {
            frameId: frame.id,
            frameName: frame.name,
            varName: vn,
            firstStep: idx,
            firstLine: step.lineNo,
            lastModStep: idx,
            lastModLine: step.lineNo,
            accessCount: 1,
          };
        } else {
          if (fc[vn] === "changed" || fc[vn] === "created") {
            varMeta[key].lastModStep = idx;
            varMeta[key].lastModLine = step.lineNo;
          }
          varMeta[key].accessCount++;
        }
      }
    }

    return {
      ...step,
      frameChanges,
      heapChanges,
      logMsg: buildLogMessage(step, prevStep, lines, frameChanges),
    };
  });

  return { steps, varMeta };
}

// ─── JS: helper – extract all outgoing refs from a heap object ────────────────

/**
 * Returns an array of { cellKey, targetId } for every reference slot in obj.
 * cellKey uniquely identifies the slot within *obj* (used as DOM element IDs
 * for the SVG arrow system in ObjectsPanel).
 */
export function extractRefs(obj) {
  const refs = [];
  if (!obj) return refs;

  if (Array.isArray(obj.elements)) {
    obj.elements.forEach((el, idx) => {
      if (el?.type === "ref")
        refs.push({ cellKey: `e${idx}`, targetId: el.id });
    });
  }

  if (Array.isArray(obj.pairs)) {
    obj.pairs.forEach(([, val], idx) => {
      if (val?.type === "ref")
        refs.push({ cellKey: `p${idx}`, targetId: val.id });
    });
  }

  return refs;
}

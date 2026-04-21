---
name: code-visualizer
description: >
  Build a Python Tutor-style multi-language code execution visualizer as a React artifact powered
  by the Anthropic API. Use this skill whenever the user wants to: visualize code execution
  step-by-step, trace variable state through a program, inspect call stacks or heap memory,
  debug code interactively, learn how code runs, or build an educational coding tool. Trigger
  on phrases like "visualize my code", "trace execution", "step through code", "show me how
  this code runs", "code debugger", "execution trace", "like Python Tutor", "show variable
  state", or any request to build a code learning/tracing tool. Also trigger when a user
  uploads or pastes code and asks to understand what it does step by step. Supports Python,
  JavaScript, Java, C, C++, and Ruby out of the box.
---

# Code Visualizer Skill

Build a **Python Tutor-style multi-language code execution visualizer** as a single React artifact
that uses the Anthropic API to trace and animate code execution step by step.

---

## What This Skill Produces

A fully interactive React artifact with three panels:

| Panel | Contents |
|---|---|
| **Left – Code Editor** | Editable code with line numbers; current line highlighted in real time |
| **Center – Execution Steps** | Numbered step list with progress bar and prev/next controls |
| **Right – Memory State** | Call stack frames with live variables + heap objects panel + stdout |

The Anthropic API acts as the execution engine — it receives the code, simulates step-by-step
execution, and returns a structured JSON trace that the UI plays back interactively.

---

## Supported Languages

Python · JavaScript · Java · C · C++ · Ruby

Each language ships with a built-in example program so users can explore immediately.

---

## Architecture Overview

```
User edits code
      ↓
[▶ Visualize] button
      ↓
fetch("https://api.anthropic.com/v1/messages")
  model: claude-sonnet-4-20250514
  system: <tracer prompt — see Trace Prompt section>
  user: "Trace this {language} code: ```{code}```"
      ↓
Response → parse JSON trace → array of Step objects
      ↓
React state: steps[], currentStep
      ↓
User navigates with ⏮ ◀ ▶ ⏭ controls
      ↓
Each step renders: highlighted line, stack frames, heap objects, stdout-so-far
```

---

## Step Object Schema

Each element of the `steps` array must conform to:

```json
{
  "line": 5,
  "description": "Assign result of fib(4) to x",
  "stack": [
    {
      "name": "global",
      "vars": { "x": null }
    },
    {
      "name": "fib",
      "vars": { "n": 5 }
    }
  ],
  "heap": {
    "list_0": { "type": "list", "value": [1, 2, 3] }
  },
  "stdout": "8\n"
}
```

- `line` — 1-based line number of the currently executing statement
- `description` — ≤60 char human-readable description of what happens
- `stack` — ordered global-first, active-frame-last; each frame has `name` + `vars` dict
- `heap` — only non-primitive objects (lists, arrays, dicts, objects); omit if empty
- `stdout` — cumulative output printed so far (empty string if none yet)

---

## Trace System Prompt

Use this **exact system prompt** when calling the Anthropic API:

```
You are a code execution tracer. Given code in any programming language, simulate
step-by-step execution and return a JSON trace.

Return ONLY valid JSON (no markdown, no explanation). Format:
{
  "steps": [
    {
      "line": <1-based line number>,
      "description": "<what happens at this step, max 60 chars>",
      "stack": [
        {
          "name": "<function/scope name, e.g. 'global', 'main', 'fib'>",
          "vars": { "<varname>": <value> }
        }
      ],
      "heap": {
        "<id>": { "type": "<list|dict|object|array>", "value": <value> }
      },
      "stdout": "<cumulative output so far>"
    }
  ],
  "error": null
}

Rules:
- Stack is ordered with global scope first, active frame last
- Only include heap objects for lists, arrays, dicts, objects (not primitives)
- Track variables as they are assigned and updated
- For recursive functions, show full call stack growing and shrinking
- Each step = one meaningful operation (assignment, comparison, function call, return)
- Keep description concise (under 60 chars)
- stdout accumulates across steps (show total output so far at each step)
- If there's a runtime error, put it in "error" field and stop
- Maximum 60 steps for brevity
```

---

## UI Implementation Guide

### Color System (dark theme)

```css
--bg-base:        #020817   /* page background */
--bg-panel:       #0a0f1e   /* panel headers */
--bg-card:        #0f172a   /* cards, frames */
--border:         #1e293b   /* default borders */
--purple-main:    #7c3aed   /* primary accent */
--purple-light:   #a78bfa   /* secondary accent */
--purple-glow:    #1e1b4b   /* active row background */
--cyan-accent:    #0891b2   /* heap section color */
--green-output:   #34d399   /* stdout color */
--red-error:      #f87171   /* error color */
--text-primary:   #e2e8f0
--text-muted:     #94a3b8
--text-dim:       #64748b
--code-var:       #f472b6   /* variable names */
--code-val:       #34d399   /* variable values */
--code-text:      #c4b5fd   /* code body text */
```

### Typography
- UI labels: `'Segoe UI', sans-serif`
- Code & monospace values: `'JetBrains Mono', monospace` (import from Google Fonts)
- Line numbers: 11px, color `--text-dim`
- Code: 13px, line-height 22px

### Key Interactions

**Language selector** — pill buttons in header; switching language loads the built-in example
and clears any existing trace.

**Code editor** — layer a transparent `<textarea>` over a syntax-highlighted `<div>`. The
textarea captures edits; the div renders line numbers and line highlighting. Never use
`contenteditable`.

**Line highlighting** — on each step change, apply `background: rgba(124,58,237,0.22)` and
`border-left: 3px solid #7c3aed` to the active line div via direct DOM manipulation with
`useEffect`.

**Step list** — scrollable vertical list; clicking any row jumps directly to that step.
Active row has left border `3px solid #7c3aed` and gradient background.

**Progress bar** — thin 4px bar between prev/next buttons, width = `(currentStep+1)/total * 100%`.

**Navigation buttons** — ⏮ ◀ ▶ ⏭; disable and grey out at boundaries.

**Loading spinner** — CSS `border-top-color: transparent` spinning div, shown while API call
is in flight.

### Call Stack Panel

- Render frames in reverse (active frame on top visually)
- Active (top) frame: border `2px solid #7c3aed`, background `#1e1b4b`, badge "ACTIVE"
- Inactive frames: border `1.5px solid #334155`, background `#0f172a`
- Variables: pink name → grey arrow → green value in monospace chip

### Heap Panel

- Only render if `currentState.heap` has keys
- Each object: cyan header `[type]`, content shows array items as chips or key:value pairs
- Header background `#0e7490`, content background `#0c1a2e`

### Stdout Panel (inside Memory State)

- Only render if `currentState.stdout` is non-empty
- Dark green theme: border `#14532d`, background `#052e16`
- `<pre>` tag, `white-space: pre-wrap`

### Error Display

- Show below code editor when `error` is set
- Red theme: label "⚠ ERROR", pre tag with `color: #fca5a5`

---

## Built-in Examples

Provide one example per language so users can explore without writing code:

| Language | Example Program |
|---|---|
| Python | Recursive Fibonacci `fib(5)` |
| JavaScript | Bubble sort on a small array |
| Java | Factorial loop in `main()` |
| C | Sum of array with a helper function |
| C++ | Stack push/pop using `vector` |
| Ruby | Quicksort with `select` |

---

## Response Parsing

Strip any accidental markdown fences before JSON.parse:

```javascript
const clean = raw
  .replace(/^```json\s*/i, "")
  .replace(/^```\s*/i, "")
  .replace(/```\s*$/i, "")
  .trim();
const parsed = JSON.parse(clean);
```

If `parsed.error` is non-null, display it in the error panel and still render whatever
steps were returned before the error.

---

## Performance Notes

- `max_tokens: 4000` is sufficient for traces up to ~60 steps
- Warn users if their code is very long (>50 lines) that the trace may be truncated
- Use `useCallback` on `runVisualization` to avoid unnecessary re-renders
- Line highlighting uses direct DOM refs (`useRef` + `querySelectorAll`) — do NOT store
  per-line state in React state as it causes re-renders on every step

---

## Customisation Hooks

When extending this skill, common additions include:

- **Speed playback** — auto-advance steps on a timer with a speed slider
- **Diff highlighting** — highlight variables that *changed* since the previous step
- **Pointer arrows** — SVG lines from stack variable refs into heap objects
- **Share button** — encode code + language in URL query params
- **Themes** — light/dark toggle; additional language support via the same trace prompt

---

## Complete Reference Implementation

The full working React component is saved at:
`/mnt/user-data/outputs/code-visualizer.jsx`

Use it as the canonical starting point. All component names, prop shapes, and API call
structure in this SKILL.md match that file exactly.

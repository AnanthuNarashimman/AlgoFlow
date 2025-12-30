import React, { useState, useEffect, useRef } from 'react';
import { Zap, MessageSquare, Eye } from 'lucide-react';
import Editor from '@monaco-editor/react';
import CodeFlowChartViewer from '../FlowChartViewer/CodeFlowChartViewer';
// Purple Haze Theme Configuration for Monaco
const PURPLE_HAZE_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b5a8e', fontStyle: 'italic' },
    { token: 'string', foreground: 'a5f3fc' },
    { token: 'keyword', foreground: 'd8b4fe', fontStyle: 'bold' },
    { token: 'number', foreground: 'fca5a5' },
    { token: 'operator', foreground: '94a3b8' },
    { token: 'delimiter', foreground: '94a3b8' },
    { token: 'function', foreground: '818cf8' },
    { token: 'class', foreground: 'f0abfc' },
    { token: 'variable', foreground: 'e2e8f0' },
    { token: 'type', foreground: 'f0abfc' },
    { token: 'decorator', foreground: 'fbbf24' },
    { token: 'tag', foreground: 'f0abfc' },
  ],
  colors: {
    'editor.background': '#050309',
    'editor.foreground': '#e2e8f0',
    'editor.lineHighlightBackground': '#1e162920',
    'editor.selectionBackground': '#a855f7',
    'editorCursor.foreground': '#d8b4fe',
    'editorLineNumber.foreground': '#4c3f6d',
    'editorLineNumber.activeForeground': '#a855f7',
    'editor.lineHighlightBorder': '#00000000',
    'editorGutter.background': '#0f0a19',
    'scrollbar.shadow': '#00000000',
    'editorOverviewRuler.border': '#00000000',
  }
};

const DEFAULT_PYTHON_CODE = `# Python Algorithm Workspace - Interactive Mode
# Try using input() - it works just like an online compiler!
goodName = input("Enter your name:")
print(f"Welcome to AlgoFlow, {goodName}")
`;

export default function PurpleHazeEditor({ onToggleChat, isChatOpen, onCodeChange }) {
  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem('algoflow_code');
    return savedCode || DEFAULT_PYTHON_CODE;
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [flowchartData, setFlowchartData] = useState(() => {
    // Load cached flowchart data from localStorage
    const cached = localStorage.getItem('algoflow_flowchart_data');
    return cached ? JSON.parse(cached) : null;
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastVisualizedCode, setLastVisualizedCode] = useState(() => {
    // Load the code that was last used for visualization
    return localStorage.getItem('algoflow_last_visualized_code') || '';
  });
  const [outputPanelOpen, setOutputPanelOpen] = useState(false);
  const outputPanelHeight = 250;
  const [output, setOutput] = useState(() => {
    // Load output from sessionStorage (cleared on page close/refresh)
    const savedOutput = sessionStorage.getItem('algoflow_output');
    return savedOutput ? JSON.parse(savedOutput) : [];
  });
  const [isRunning, setIsRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const pyodideRef = useRef(null);
  const inputResolverRef = useRef(null);
  const inputFieldRef = useRef(null);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('algoflow_code', code);
    // Notify parent component of code changes
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  // Save output to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('algoflow_output', JSON.stringify(output));
  }, [output]);

  // Clear sessionStorage on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('algoflow_output');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Pyodide
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        if (window.loadPyodide) {
          setOutput(prev => [...prev, { type: 'info', content: 'Loading Python environment...' }]);
          const pyodide = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
          });

          pyodideRef.current = pyodide;
          setPyodideReady(true);
          setOutput(prev => [...prev, { type: 'success', content: 'Python environment ready! Interactive mode enabled.' }]);
        }
      } catch (error) {
        setOutput(prev => [...prev, { type: 'error', content: `Failed to load Python: ${error.message}` }]);
      }
    };
    loadPyodide();
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define and apply the custom theme
    monaco.editor.defineTheme('purple-haze', PURPLE_HAZE_THEME);
    monaco.editor.setTheme('purple-haze');

    // Track cursor position
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column
      });
    });
  };

  const handleRun = async () => {
    if (!pyodideReady) {
      setOutput([{ type: 'error', content: 'Python environment is still loading. Please wait...' }]);
      setOutputPanelOpen(true);
      return;
    }

    if (!code.trim()) {
      setOutput([{ type: 'error', content: 'No code to run!' }]);
      setOutputPanelOpen(true);
      return;
    }

    setIsRunning(true);
    setOutput([]);
    setWaitingForInput(false);

    // Open panel if closed
    if (!outputPanelOpen) {
      setOutputPanelOpen(true);
    }

    try {
      const pyodide = pyodideRef.current;

      // Set up real-time output callbacks
      const outputCallback = (text, type = 'stdout') => {
        setOutput(prev => {
          const lastItem = prev[prev.length - 1];
          // Append to last item if it's the same type
          if (lastItem && lastItem.type === type) {
            return [
              ...prev.slice(0, -1),
              { ...lastItem, content: lastItem.content + text }
            ];
          }
          return [...prev, { type, content: text }];
        });
      };

      pyodide.globals.set('stdout_callback', (text) => outputCallback(text, 'stdout'));
      pyodide.globals.set('stderr_callback', (text) => outputCallback(text, 'stderr'));

      // Create input handler that returns a Promise
      const inputHandler = (prompt) => {
        return new Promise((resolve) => {
          // Display prompt in output
          if (prompt) {
            outputCallback(prompt, 'stdout');
          }

          setWaitingForInput(true);
          inputResolverRef.current = resolve;
          setTimeout(() => {
            if (inputFieldRef.current) {
              inputFieldRef.current.focus();
            }
          }, 100);
        });
      };

      pyodide.globals.set('js_input', inputHandler);

      // Setup interactive IO and AST transformer
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
import builtins
import ast

class InteractiveOutput:
    def __init__(self, callback):
        self.callback = callback
        self.buffer = ""

    def write(self, text):
        self.buffer += text
        self.callback(text)
        return len(text)

    def flush(self):
        pass

sys.stdout = InteractiveOutput(stdout_callback)
sys.stderr = InteractiveOutput(stderr_callback)

# Create a synchronous-looking input that actually awaits
_original_input = builtins.input

async def _async_input_wrapper(prompt=""):
    result = await js_input(prompt)
    return result

# Make input work in async context
builtins.input = _async_input_wrapper

# AST transformer to properly await all input() calls
class InputAwaiter(ast.NodeTransformer):
    def visit_Call(self, node):
        # First, visit children to handle nested calls
        self.generic_visit(node)
        # Check if this is a call to 'input'
        if isinstance(node.func, ast.Name) and node.func.id == 'input':
            # Wrap in an Await node
            return ast.Await(value=node)
        return node

def transform_input_calls(code_str):
    """Transform all input() calls to await input() using AST"""
    try:
        tree = ast.parse(code_str)
        transformer = InputAwaiter()
        new_tree = transformer.visit(tree)
        ast.fix_missing_locations(new_tree)
        return ast.unparse(new_tree)
    except Exception as e:
        # If AST transformation fails, return original code
        return code_str
      `);

      // Transform user code using Python AST to properly await all input() calls
      const transformedCode = await pyodide.runPythonAsync(`transform_input_calls(${JSON.stringify(code)})`);

      // Wrap user code to make all input() calls awaitable
      const wrappedCode = `
import builtins

# Wrap the entire code in an async context
async def __main__():
${transformedCode.split('\n').map(line => '    ' + line).join('\n')}

# Execute the main function
await __main__()
`;

      // Run the wrapped user's code
      await pyodide.runPythonAsync(wrappedCode);

      // Add success message if no output
      setOutput(prev => {
        if (prev.length === 0) {
          return [{ type: 'success', content: 'Code executed successfully (no output)' }];
        }
        return prev;
      });

    } catch (error) {
      setOutput(prev => [...prev, { type: 'error', content: error.message }]);
    } finally {
      setIsRunning(false);
      setWaitingForInput(false);
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputResolverRef.current && inputValue !== null) {
      // Add user input to output
      setOutput(prev => [...prev, { type: 'input', content: inputValue }]);

      // Resolve the promise with the input
      inputResolverRef.current(inputValue + '\n');
      inputResolverRef.current = null;

      // Reset state
      setInputValue('');
      setWaitingForInput(false);
    }
  };




  const handleVisualize = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

    // Check if code hasn't changed since last visualization
    if (code === lastVisualizedCode && flowchartData) {
      // Use cached data - no need to make a new API call
      console.log('Using cached flowchart data (code unchanged)');
      setShowVisualizer(true);
      return;
    }

    // Code has changed or no cached data exists - make a new API call
    console.log('Code changed - generating new flowchart...');
    setIsGenerating(true);
    setShowVisualizer(true);

    try {
      const response = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flowchart');
      }

      const data = await response.json();
      setFlowchartData(data);

      // Cache the flowchart data and the code used to generate it
      localStorage.setItem('algoflow_flowchart_data', JSON.stringify(data));
      localStorage.setItem('algoflow_last_visualized_code', code);
      setLastVisualizedCode(code);
    } catch (error) {
      console.error('Error generating flowchart:', error);
      alert('Failed to generate flowchart. Make sure the backend server is running on port 4000.');
      setShowVisualizer(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#050309',
      fontFamily: 'monospace',
      fontSize: '14px',
      margin: 0,
      padding: 0
    }}>

      {/* --- Header --- */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#0a0612',
        padding: '0 20px',
        flexShrink: 0
      }}>
        {/* Left side - Logo/Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Zap
            size={20}
            color="#a855f7"
            style={{
              filter: 'drop-shadow(0 0 8px #a855f7)'
            }}
          />
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#e2e8f0',
            letterSpacing: '0.05em'
          }}>
            ALGOFLOW EDITOR
          </span>
          <span style={{
            fontSize: '11px',
            color: '#94a3b8',
            padding: '4px 8px',
            backgroundColor: 'rgba(96,165,250,0.15)',
            borderRadius: '4px',
            border: '1px solid rgba(96,165,250,0.3)'
          }}>
            Python
          </span>
        </div>

        {/* Right side - Run Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleRun}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(168,85,247,0.3)',
              backgroundColor: 'rgba(168,85,247,0.15)',
              color: '#e9d5ff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.25)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
            }}
          >
            <Zap size={14} />
            Run Code
          </button>

          <button
            onClick={handleVisualize}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(168,85,247,0.3)',
              backgroundColor: showVisualizer ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)',
              color: '#e9d5ff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.3)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showVisualizer ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
            }}
          >
            <Eye size={14} />
            {isGenerating ? 'Generating...' : 'Visualize'}
          </button>

          <button
            onClick={() => setOutputPanelOpen(!outputPanelOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(168,85,247,0.3)',
              backgroundColor: outputPanelOpen ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)',
              color: '#e9d5ff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.3)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = outputPanelOpen ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
            }}
          >
            <Zap size={14} />
            Output
            {output.length > 0 && !outputPanelOpen && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                width: '8px',
                height: '8px',
                boxShadow: '0 0 4px #ef4444'
              }} />
            )}
          </button>

          <button
            onClick={onToggleChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(168,85,247,0.3)',
              backgroundColor: isChatOpen ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)',
              color: '#e9d5ff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.3)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isChatOpen ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)';
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
            }}
          >
            <MessageSquare size={14} />
            AI Chat
          </button>
        </div>
      </div>

      {/* --- Monaco Editor --- */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        transition: 'opacity 0.7s',
        opacity: isLoaded ? 1 : 0,
        height: outputPanelOpen ? `calc(100% - ${outputPanelHeight}px - 26px)` : 'auto'
      }}>
        <Editor
          height="100%"
          language="python"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="purple-haze"
          options={{
            fontFamily: "Consolas, 'Courier New', monospace",
            fontSize: 14,
            lineHeight: 20,
            fontLigatures: false,
            minimap: {
              enabled: true,
              side: 'right',
              showSlider: 'mouseover',
              renderCharacters: false,
              maxColumn: 80
            },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'hidden',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: false,
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            tabSize: 4,
            automaticLayout: true,
            wordWrap: 'off',
            folding: true,
            glyphMargin: false,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 4,
            renderWhitespace: 'none',
            bracketPairColorization: {
              enabled: true
            },
            scrollBeyondLastLine: false,
            overviewRulerBorder: false
          }}
        />
      </div>

      {/* Visualizer Modal Overlay */}
      {showVisualizer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(10,6,18,0.9)'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#e9d5ff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Eye size={20} color="#a855f7" />
              <span>Flow Visualizer</span>
            </div>
            <button
              onClick={() => setShowVisualizer(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(168,85,247,0.3)',
                backgroundColor: 'rgba(168,85,247,0.15)',
                color: '#e9d5ff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)';
              }}
            >
              Close Visualizer
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeFlowChartViewer
              flowchartData={flowchartData}
              isLoading={isGenerating}
            />
          </div>
        </div>
      )}

      {/* --- Output Panel --- */}
      {outputPanelOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: `${outputPanelHeight}px`,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#0a0612',
          flexShrink: 0
        }}>
          {/* Output Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backgroundColor: '#050309'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#a855f7',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <Zap size={14} />
              <span>Output</span>
              {isRunning && (
                <span style={{
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 400
                }}>
                  (Running...)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setOutput([])}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid rgba(168,85,247,0.2)',
                  backgroundColor: 'rgba(168,85,247,0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.2)';
                  e.currentTarget.style.color = '#e9d5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setOutputPanelOpen(false)}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid rgba(168,85,247,0.2)',
                  backgroundColor: 'rgba(168,85,247,0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.2)';
                  e.currentTarget.style.color = '#e9d5ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                Close
              </button>
            </div>
          </div>

          {/* Output Content */}
          <div
            className="output-terminal-content"
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px 16px',
              fontFamily: 'Consolas, monospace',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
            {output.length === 0 ? (
              <div style={{
                color: '#64748b',
                fontStyle: 'italic',
                textAlign: 'center',
                marginTop: '20px'
              }}>
                No output yet. Run your code to see results.
              </div>
            ) : (
              output.map((item, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: item.type === 'input' ? '4px' : '8px',
                    padding: item.type === 'input' ? '4px 12px' : '8px 12px',
                    borderRadius: '4px',
                    backgroundColor:
                      item.type === 'error' ? 'rgba(239,68,68,0.1)' :
                        item.type === 'stderr' ? 'rgba(251,191,36,0.1)' :
                          item.type === 'success' ? 'rgba(34,197,94,0.1)' :
                            item.type === 'info' ? 'rgba(59,130,246,0.1)' :
                              item.type === 'input' ? 'rgba(139,92,246,0.15)' :
                                'rgba(168,85,247,0.05)',
                    borderLeft: `3px solid ${item.type === 'error' ? '#ef4444' :
                        item.type === 'stderr' ? '#fbbf24' :
                          item.type === 'success' ? '#22c55e' :
                            item.type === 'info' ? '#3b82f6' :
                              item.type === 'input' ? '#8b5cf6' :
                                '#a855f7'
                      }`,
                    color:
                      item.type === 'error' ? '#fca5a5' :
                        item.type === 'stderr' ? '#fcd34d' :
                          item.type === 'success' ? '#86efac' :
                            item.type === 'info' ? '#93c5fd' :
                              item.type === 'input' ? '#c4b5fd' :
                                '#e2e8f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {item.type === 'input' && (
                    <span style={{ color: '#8b5cf6', marginRight: '8px' }}>{'>'}</span>
                  )}
                  {item.content}
                </div>
              ))
            )}

            {/* Interactive Input Field */}
            {waitingForInput && (
              <form onSubmit={handleInputSubmit} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: 'rgba(139,92,246,0.1)',
                borderLeft: '3px solid #8b5cf6'
              }}>
                <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{'>'}</span>
                <input
                  ref={inputFieldRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    borderRadius: '4px',
                    padding: '6px 12px',
                    color: '#e2e8f0',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '13px',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)';
                    e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
                    e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.1)';
                  }}
                  placeholder="Type input and press Enter..."
                />
                <button
                  type="submit"
                  style={{
                    padding: '6px 16px',
                    borderRadius: '4px',
                    border: '1px solid rgba(168,85,247,0.3)',
                    backgroundColor: 'rgba(168,85,247,0.2)',
                    color: '#e9d5ff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.2)';
                  }}
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- Footer / Status Bar --- */}
      <div style={{
        display: 'flex',
        height: '26px',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#080510',
        padding: '0 16px',
        fontSize: '11px',
        color: '#64748b',
        userSelect: 'none',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: pyodideReady ? '#22c55e' : '#fbbf24' }}>
            <div style={{
              height: '6px',
              width: '6px',
              borderRadius: '9999px',
              backgroundColor: pyodideReady ? '#22c55e' : '#fbbf24',
              boxShadow: pyodideReady ? '0 0 4px #22c55e' : '0 0 4px #fbbf24'
            }} />
            <span>{pyodideReady ? 'PYTHON READY' : 'LOADING PYTHON...'}</span>
          </div>
          <span style={{ cursor: 'pointer' }}>main*</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>UTF-8</span>
          <span>Python</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {!isLoaded && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: '#050309'
        }}>
          <Zap
            size={32}
            color="#a855f7"
            style={{
              animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
          <span style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            letterSpacing: '0.2em',
            color: 'rgba(168,85,247,0.5)'
          }}>
            INITIALIZING NEURAL LINK...
          </span>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        
        #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Custom scrollbar for output terminal */
        .output-terminal-content::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .output-terminal-content::-webkit-scrollbar-track {
          background: rgba(15, 10, 25, 0.5);
          border-radius: 3px;
        }
        
        .output-terminal-content::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.3);
          border-radius: 3px;
          transition: background 0.2s;
        }
        
        .output-terminal-content::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
        
        .output-terminal-content::-webkit-scrollbar-thumb:active {
          background: rgba(168, 85, 247, 0.7);
        }
        
        /* Firefox scrollbar */
        .output-terminal-content {
          scrollbar-width: thin;
          scrollbar-color: rgba(168, 85, 247, 0.3) rgba(15, 10, 25, 0.5);
        }
      `}</style>

    </div>
  );
}
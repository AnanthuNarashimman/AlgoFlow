import React, { useState, useEffect, useRef } from 'react';
import { Zap, MessageSquare, Eye } from 'lucide-react';
import Editor from '@monaco-editor/react';
import CodeFlowChartViewer from './CodeFlowChartViewer';
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

const DEFAULT_PYTHON_CODE = `# Python Algorithm Workspace
import sys

def check_prime(n):
    """Check if a number is prime."""
    if n < 2:
        return False
    
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    
    return True

def main():
    number = 17
    result = check_prime(number)
    
    if result:
        print(f"{number} is a prime number")
    else:
        print(f"{number} is not a prime number")

if __name__ == "__main__":
    main()`;

export default function PurpleHazeEditor({ onToggleChat, isChatOpen }) {
  const [code, setCode] = useState(() => {
    const savedCode = localStorage.getItem('algoflow_code');
    return savedCode || DEFAULT_PYTHON_CODE;
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [flowchartData, setFlowchartData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('algoflow_code', code);
  }, [code]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 800);
    return () => clearTimeout(timer);
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

  const handleRun = () => {
    console.log('Running code...');
    // Add run functionality here
  };

  const handleVisualize = async () => {
    if (!code.trim()) {
      alert('Please write some code first!');
      return;
    }

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
            PURPLE HAZE EDITOR
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
        opacity: isLoaded ? 1 : 0
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
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7' }}>
             <div style={{
               height: '6px',
               width: '6px',
               borderRadius: '9999px',
               backgroundColor: '#a855f7',
               boxShadow: '0 0 4px #a855f7'
             }} />
             <span>CONNECTED</span>
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
      `}</style>

    </div>
  );
}
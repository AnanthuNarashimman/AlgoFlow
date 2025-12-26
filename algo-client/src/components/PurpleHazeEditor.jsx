import React, { useState, useEffect, useRef } from 'react';
import { Zap, Code2, Terminal, MessageSquare } from 'lucide-react';
import Editor from '@monaco-editor/react';

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

const CODE_TEMPLATES = {
  javascript: `// Synthwave JS Mode
import React, { useState, useEffect } from 'react';

const CyberComponent = () => {
  const [energy, setEnergy] = useState(100);

  // Initialize the neural link
  useEffect(() => {
    console.log("System Online. Aesthetic: Maximum.");
    return () => disconnect();
  }, []);

  return (
    <div className="neon-container">
      <h1>Hello World</h1>
      <p>Energy Level: {energy}%</p>
    </div>
  );
};`,
  python: `# Cyberpunk Python Script
import os
import sys
from cyber_utils import NeuralLink

class NeonCity:
    def __init__(self, population):
        self.population = population
        self.energy_grid = "STABLE"

    def night_cycle(self):
        """Activates the neon lights."""
        intensity = 0.95
        print(f"City glow set to {intensity * 100}%")
        return True

def main():
    city = NeonCity(5000000)
    if city.night_cycle():
        print("Welcome to the grid.")

if __name__ == "__main__":
    main()`
};

export default function PurpleHazeEditor({ onToggleChat, isChatOpen }) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [isLoaded, setIsLoaded] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

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

  const handleLanguageSwitch = () => {
    const newLang = language === 'javascript' ? 'python' : 'javascript';
    setLanguage(newLang);
    setCode(CODE_TEMPLATES[newLang]);
  };

  const handleRun = () => {
    console.log('Running code...');
    // Add run functionality here
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
        </div>

        {/* Center - Language Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <button
            onClick={() => {
              setLanguage('javascript');
              setCode(CODE_TEMPLATES.javascript);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: language === 'javascript' ? 'rgba(168,85,247,0.2)' : 'transparent',
              color: language === 'javascript' ? '#e9d5ff' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace'
            }}
          >
            <Code2 size={14} color={language === 'javascript' ? '#facc15' : '#64748b'} />
            JavaScript
          </button>
          <button
            onClick={() => {
              setLanguage('python');
              setCode(CODE_TEMPLATES.python);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: language === 'python' ? 'rgba(168,85,247,0.2)' : 'transparent',
              color: language === 'python' ? '#e9d5ff' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'monospace'
            }}
          >
            <Terminal size={14} color={language === 'python' ? '#60a5fa' : '#64748b'} />
            Python
          </button>
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
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          theme="purple-haze"
          options={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: 14,
            lineHeight: 24,
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
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            tabSize: 2,
            automaticLayout: true,
            wordWrap: 'on',
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
           <span style={{ textTransform: 'uppercase' }}>{language}</span>
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
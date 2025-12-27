import React, { useState } from 'react';
import PurpleHazeEditor from '../components/PurpleHazeEditor';
import DraggableSideChat from '../components/DraggableSideChat';

export default function LearnSpace() {
  const [chatWidth, setChatWidth] = useState(400);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editorCode, setEditorCode] = useState('');

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#050309',
      position: 'fixed',
      top: 0,
      left: 0,
      margin: 0,
      padding: 0
    }}>
      
      {/* Editor Section - Takes remaining space */}
      <div style={{
        width: isChatOpen ? `calc(100vw - ${chatWidth}px - 4px)` : '100vw',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <PurpleHazeEditor 
          onToggleChat={() => setIsChatOpen(!isChatOpen)} 
          isChatOpen={isChatOpen}
          onCodeChange={setEditorCode}
        />
      </div>

      {/* Chat Section - Resizable */}
      {isChatOpen && (
        <div style={{
          width: chatWidth,
          height: '100%',
          flexShrink: 0
        }}>
          <DraggableSideChat 
            width={chatWidth} 
            onWidthChange={setChatWidth}
            onClose={() => setIsChatOpen(false)}
            editorCode={editorCode}
          />
        </div>
      )}

      {/* Global styles */}
      <style>{`
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
      `}</style>

    </div>
  );
}

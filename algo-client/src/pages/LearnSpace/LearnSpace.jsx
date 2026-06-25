import React, { useState, useEffect } from 'react';
import PurpleHazeEditor from '../../components/Editor/PurpleHazeEditor';
import DraggableSideChat from '../../components/ChatBot/DraggableSideChat';
import KeyEntryModal from '../../components/KeyEntry/KeyEntryModal';

const API_URL = import.meta.env.VITE_API_URL;

export default function LearnSpace() {
  const [chatWidth, setChatWidth]   = useState(400);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editorCode, setEditorCode] = useState('');

  const [keyValid, setKeyValid]         = useState(false);
  const [keyChecked, setKeyChecked]     = useState(false); // don't render until we know
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/key/status`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setKeyValid(data.valid);
        setShowKeyModal(!data.valid);
      })
      .catch(() => setShowKeyModal(true))
      .finally(() => setKeyChecked(true));
  }, []);

  const handleKeyVerified = () => {
    setKeyValid(true);
    setShowKeyModal(false);
  };

  const handleKeyRemoved = () => {
    setKeyValid(false);
    setShowKeyModal(true);
  };

  const handleKeyExpired = () => {
    setKeyValid(false);
    setShowKeyModal(true);
  };

  if (!keyChecked) return null;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      backgroundColor: '#050309',
      position: 'fixed',
      top: 0, left: 0,
      margin: 0, padding: 0
    }}>
      {/* Editor section */}
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
          keyValid={keyValid}
          onKeyExpired={handleKeyExpired}
          onOpenKeySettings={() => setShowKeyModal(true)}
        />
      </div>

      {/* Chat section */}
      {isChatOpen && (
        <div style={{ width: chatWidth, height: '100%', flexShrink: 0 }}>
          <DraggableSideChat
            width={chatWidth}
            onWidthChange={setChatWidth}
            onClose={() => setIsChatOpen(false)}
            editorCode={editorCode}
            onKeyExpired={handleKeyExpired}
          />
        </div>
      )}

      {/* Key modal */}
      {showKeyModal && (
        <KeyEntryModal
          keyExists={keyValid}
          onKeyVerified={handleKeyVerified}
          onKeyRemoved={handleKeyRemoved}
        />
      )}

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { margin: 0 !important; padding: 0 !important; overflow: hidden; width: 100%; height: 100%; }
        #root { margin: 0; padding: 0; width: 100%; height: 100%; }
      `}</style>
    </div>
  );
}

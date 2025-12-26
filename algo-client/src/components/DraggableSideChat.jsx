import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, GripVertical, User, Bot, 
  Sparkles, Zap, BookOpen, HelpCircle, MoreHorizontal, Code, X
} from 'lucide-react';

const INITIAL_MESSAGES = [
  { 
    id: 1, 
    role: 'ai', 
    text: 'Hello! I\'m your Purple Haze AI companion. I can help you debug, optimize, or explain your code. What would you like to work on today?',
    isCode: false
  }
];

const SUGGESTION_CHIPS = [
  { id: 'explain', label: 'Explain Code', icon: BookOpen },
  { id: 'fix', label: 'Find Bugs', icon: Code },
  { id: 'optimize', label: 'Optimize', icon: Zap },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export default function DraggableSideChat({ width = 400, onWidthChange, onClose }) {
  // --- State ---
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // --- Refs ---
  const chatEndRef = useRef(null);

  // --- Auto-scroll to bottom ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // --- Resizing Logic ---
  const startResizing = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e) => {
    if (isResizing && onWidthChange) {
      const newWidth = window.innerWidth - e.clientX;
      
      // Min/Max constraints
      if (newWidth > 300 && newWidth < 800) {
        onWidthChange(newWidth);
      }
    }
  };

  // Global event listeners for smooth resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // --- Chat Handlers ---
  const sendMessage = (text) => {
    if (!text.trim()) return;
    
    const newMessage = { id: Date.now(), role: 'user', text: text, isCode: false };
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setIsTyping(true);

    // Simulated AI Response
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: "I'm processing that request. This is a standalone demo of the chat interface.",
        isCode: false 
      }]);
    }, 1500);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    sendMessage(chatInput);
  };

  const handleChipClick = (action) => {
    let text = "";
    switch(action) {
      case 'explain': text = "Can you explain the selected code?"; break;
      case 'fix': text = "Are there any bugs in this file?"; break;
      case 'optimize': text = "How can I make this perform better?"; break;
      case 'help': text = "Help me understand the syntax."; break;
      default: text = action;
    }
    sendMessage(text);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      position: 'relative'
    }}>
      
      {/* Resizer Handle */}
      <div 
        onMouseDown={startResizing}
        style={{
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#a855f7' : 'rgba(255,255,255,0.05)',
          transition: 'background-color 0.2s',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isResizing ? '0 0 10px #a855f7' : 'none',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.3)';
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }}
      >
        <GripVertical 
          size={14} 
          color={isResizing ? '#a855f7' : '#475569'} 
          style={{ position: 'absolute' }}
        />
      </div>

      {/* Chat Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0612',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: '#0c0915',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}>
              <Sparkles size={16} color="#a855f7" />
            </div>
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#e2e8f0',
                fontFamily: 'Inter, sans-serif'
              }}>
                Purple Haze AI
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Always ready to help
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          backgroundColor: 'rgba(255,255,255,0.01)',
          flexShrink: 0
        }}>
          {SUGGESTION_CHIPS.map(chip => {
            const ChipIcon = chip.icon;
            return (
              <button 
                key={chip.id} 
                onClick={() => handleChipClick(chip.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '99px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)';
                  e.currentTarget.style.color = '#cbd5e1';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <ChipIcon size={12} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{
                display: 'flex',
                gap: '12px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: msg.role === 'user' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(168, 85, 247, 0.12)',
                color: msg.role === 'user' ? '#94a3b8' : '#a855f7',
                border: msg.role === 'user' ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxWidth: '85%'
              }}>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontFamily: 'Inter, sans-serif',
                  textAlign: msg.role === 'user' ? 'right' : 'left'
                }}>
                  {msg.role === 'user' ? 'You' : 'Purple Haze AI'}
                </div>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  fontFamily: 'Inter, sans-serif',
                  background: msg.role === 'user' ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  color: msg.role === 'user' ? '#cbd5e1' : '#cbd5e1',
                  border: msg.role === 'user' 
                    ? '1px solid rgba(168, 85, 247, 0.15)' 
                    : '1px solid rgba(255, 255, 255, 0.05)',
                  borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                  borderTopLeftRadius: msg.role === 'ai' ? '2px' : '12px',
                  wordWrap: 'break-word'
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              width: 'fit-content',
              marginLeft: '44px'
            }}>
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  style={{
                    width: '6px',
                    height: '6px',
                    background: '#64748b',
                    borderRadius: '50%',
                    animation: 'bounce 0.6s infinite alternate',
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px',
          background: 'rgba(12, 9, 21, 0.8)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          flexShrink: 0
        }}>
          <form 
            onSubmit={handleChatSubmit}
            style={{
              position: 'relative',
              display: 'flex',
              backgroundColor: '#050309',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '4px',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(168, 85, 247, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <input 
              type="text" 
              placeholder="Ask about your code..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#e2e8f0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                padding: '10px 12px',
                minHeight: '40px'
              }}
            />
            <button 
              type="submit" 
              disabled={!chatInput.trim()}
              style={{
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: 'none',
                color: chatInput.trim() ? '#a855f7' : '#475569',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: chatInput.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s',
                alignSelf: 'flex-end',
                marginBottom: '2px'
              }}
              onMouseEnter={(e) => {
                if (chatInput.trim()) {
                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)';
                  e.currentTarget.style.color = '#a855f7';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = chatInput.trim() ? '#a855f7' : '#475569';
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes bounce { 
          0%, 100% { transform: translateY(0); } 
          50% { transform: translateY(-3px); } 
        }

        /* Custom scrollbar */
        div::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: #2d2440;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #3d3050;
        }
      `}</style>

    </div>
  );
}
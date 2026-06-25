import React, { useState, useRef } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader, ExternalLink, Trash2, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const SANS = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

const BTN = {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 18px', borderRadius: '8px', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'monospace', border: '1px solid rgba(168,85,247,0.3)',
    backgroundColor: 'rgba(168,85,247,0.15)', color: '#e9d5ff',
};

const PROVIDERS = [
    { id: 'gemini', label: 'Google Gemini', available: true },
    { id: 'openai', label: 'OpenAI', available: false },
    { id: 'anthropic', label: 'Anthropic', available: false },
];

const STEPS = [
    { id: 'ping',    label: 'Pinging provider'  },
    { id: 'validate',label: 'Validating key'    },
    { id: 'encrypt', label: 'Encrypting'        },
    { id: 'save',    label: 'Saving to session' },
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export default function KeyEntryModal({ keyExists, onKeyVerified, onKeyRemoved }) {
    const [apiKey, setApiKey]           = useState('');
    const [showKey, setShowKey]         = useState(false);
    const [status, setStatus]           = useState('idle'); // idle | verifying | success | error
    const [errorMsg, setErrorMsg]       = useState('');
    const [showUpdate, setShowUpdate]   = useState(!keyExists);
    const [removing, setRemoving]       = useState(false);
    const [providerOpen, setProviderOpen] = useState(false);
    const [provider, setProvider]       = useState('gemini');

    // Progress tracking
    const [activeStep, setActiveStep]       = useState(-1);
    const [doneSteps, setDoneSteps]         = useState(new Set());
    const step1TimerRef                     = useRef(null);

    const resetProgress = () => {
        setActiveStep(-1);
        setDoneSteps(new Set());
    };

    const handleVerify = async () => {
        if (!apiKey.trim()) return;

        setStatus('verifying');
        setErrorMsg('');
        setActiveStep(0);
        setDoneSteps(new Set());

        // Advance to step 1 after 700 ms regardless of request speed
        step1TimerRef.current = setTimeout(() => {
            setDoneSteps(new Set([0]));
            setActiveStep(1);
        }, 700);

        try {
            const res = await fetch(`${API_URL}/api/key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ apiKey: apiKey.trim() }),
            });
            const data = await res.json();

            if (!res.ok) {
                clearTimeout(step1TimerRef.current);
                resetProgress();
                setStatus('error');
                setErrorMsg(res.status === 429
                    ? (data.message || 'Quota exhausted. Check aistudio.google.com')
                    : (data.message || 'Key rejected. Verify it at aistudio.google.com'));
                return;
            }

            // Success — walk through remaining steps
            clearTimeout(step1TimerRef.current);
            setDoneSteps(new Set([0, 1]));
            setActiveStep(2);

            await delay(420);
            setDoneSteps(new Set([0, 1, 2]));
            setActiveStep(3);

            await delay(420);
            setDoneSteps(new Set([0, 1, 2, 3]));
            setActiveStep(-1);
            setStatus('success');

            await delay(540);
            onKeyVerified();

        } catch {
            clearTimeout(step1TimerRef.current);
            resetProgress();
            setStatus('error');
            setErrorMsg('Could not reach server. Is the backend running?');
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        try {
            await fetch(`${API_URL}/api/key`, { method: 'DELETE', credentials: 'include' });
            onKeyRemoved();
        } finally {
            setRemoving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && apiKey.trim() && status !== 'verifying') handleVerify();
    };

    const isVerifying = status === 'verifying' || status === 'success';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(5,3,9,0.85)',
            backdropFilter: 'blur(12px)',
        }}>
            {/* Top-right corner grid */}
            <div style={{
                position: 'absolute', top: 0, right: 0,
                width: '62%', height: '62%',
                backgroundImage: `
                    linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)
                `,
                backgroundSize: '28px 28px',
                WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 100% 0%, black 0%, transparent 78%)',
                maskImage: 'radial-gradient(ellipse 100% 100% at 100% 0%, black 0%, transparent 78%)',
                pointerEvents: 'none',
            }} />
            {/* Bottom-left corner grid */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0,
                width: '62%', height: '62%',
                backgroundImage: `
                    linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)
                `,
                backgroundSize: '28px 28px',
                WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 0% 100%, black 0%, transparent 78%)',
                maskImage: 'radial-gradient(ellipse 100% 100% at 0% 100%, black 0%, transparent 78%)',
                pointerEvents: 'none',
            }} />

            <div style={{
                width: '100%', maxWidth: '440px', margin: '0 16px',
                backgroundColor: '#0a0612',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: '16px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.05)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                        background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Key size={18} color="#a855f7" />
                    </div>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace' }}>
                            {keyExists ? 'Manage API Key' : 'Enter your API Key'}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '5px', lineHeight: 1.6, fontFamily: SANS, fontWeight: 400 }}>
                            {keyExists
                                ? 'Your key is encrypted and stored in a secure cookie.'
                                : 'Your key is encrypted and never stored in plain text.'}
                        </div>
                    </div>
                </div>

                <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Current key display */}
                    {keyExists && !showUpdate && (
                        <div style={{
                            padding: '12px 14px', borderRadius: '8px',
                            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <CheckCircle size={15} color="#6ee7b7" />
                            <span style={{ fontSize: '13px', color: '#6ee7b7', fontFamily: 'monospace' }}>
                                Key active — ●●●●●●●●●●●●●●●●●●
                            </span>
                        </div>
                    )}

                    {/* Key input form */}
                    {(!keyExists || showUpdate) && (
                        <>
                            {/* Provider dropdown */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#475569', fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                    Provider
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setProviderOpen(v => !v)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 14px', borderRadius: '8px',
                                            background: '#050309', border: '1px solid rgba(255,255,255,0.1)',
                                            color: '#e2e8f0', cursor: 'pointer',
                                            fontFamily: SANS, fontSize: '13px', fontWeight: 500,
                                            transition: 'border-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; }}
                                        onMouseLeave={(e) => { if (!providerOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '4px',
                                                background: 'linear-gradient(135deg, #4285F4, #34A853)',
                                                flexShrink: 0,
                                            }} />
                                            Google Gemini
                                        </div>
                                        <ChevronDown
                                            size={14} color="#64748b"
                                            style={{ transform: providerOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                        />
                                    </button>

                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 10,
                                            background: '#0c0915',
                                            border: `1px solid ${providerOpen ? 'rgba(168,85,247,0.2)' : 'transparent'}`,
                                            borderRadius: '10px', overflow: 'hidden',
                                            boxShadow: providerOpen ? '0 8px 24px rgba(0,0,0,0.5)' : 'none',
                                            maxHeight: providerOpen ? '200px' : '0px',
                                            opacity: providerOpen ? 1 : 0,
                                            transform: providerOpen ? 'translateY(0)' : 'translateY(-8px)',
                                            transition: 'max-height 0.22s ease, opacity 0.18s ease, transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                                            pointerEvents: providerOpen ? 'auto' : 'none',
                                        }}>
                                            {PROVIDERS.map((p, i) => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => { if (p.available) { setProvider(p.id); setProviderOpen(false); } }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        padding: '10px 14px',
                                                        borderBottom: i < PROVIDERS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                        cursor: p.available ? 'pointer' : 'default',
                                                        opacity: p.available ? 1 : 0.4,
                                                        transition: 'background 0.15s',
                                                        fontFamily: SANS, fontSize: '13px', color: '#e2e8f0',
                                                    }}
                                                    onMouseEnter={(e) => { if (p.available) e.currentTarget.style.background = 'rgba(168,85,247,0.08)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {p.id === 'gemini' && (
                                                            <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'linear-gradient(135deg, #4285F4, #34A853)', flexShrink: 0 }} />
                                                        )}
                                                        {p.id === 'openai' && (
                                                            <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: '#10a37f', flexShrink: 0 }} />
                                                        )}
                                                        {p.id === 'anthropic' && (
                                                            <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: '#cc9b7a', flexShrink: 0 }} />
                                                        )}
                                                        {p.label}
                                                    </div>
                                                    {!p.available && (
                                                        <span style={{
                                                            fontSize: '10px', fontFamily: SANS, fontWeight: 500,
                                                            color: '#475569', background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            padding: '2px 7px', borderRadius: '4px',
                                                        }}>
                                                            Coming soon
                                                        </span>
                                                    )}
                                                    {p.available && provider === p.id && (
                                                        <CheckCircle size={13} color="#a855f7" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                </div>
                            </div>

                            {/* API key input */}
                            <div>
                                <div style={{ fontSize: '11px', color: '#475569', fontFamily: SANS, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                    API Key
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => { setApiKey(e.target.value); setStatus('idle'); setErrorMsg(''); resetProgress(); }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="AIza..."
                                        autoFocus
                                        disabled={isVerifying}
                                        style={{
                                            width: '100%', boxSizing: 'border-box',
                                            padding: '11px 44px 11px 14px', borderRadius: '8px',
                                            background: '#050309',
                                            border: `1px solid ${status === 'error' ? 'rgba(239,68,68,0.5)' : status === 'success' ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                            color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace',
                                            outline: 'none', transition: 'border-color 0.2s',
                                            opacity: isVerifying ? 0.5 : 1,
                                        }}
                                        onFocus={(e) => { if (status === 'idle') e.target.style.borderColor = 'rgba(168,85,247,0.5)'; }}
                                        onBlur={(e) => { if (status === 'idle') e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(v => !v)}
                                        style={{
                                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#64748b', display: 'flex', padding: '2px',
                                        }}
                                    >
                                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Progress panel */}
                            {isVerifying && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: '10px',
                                    background: 'rgba(168,85,247,0.05)',
                                    border: '1px solid rgba(168,85,247,0.15)',
                                    display: 'flex', flexDirection: 'column', gap: '10px',
                                    animation: 'fadeSlideIn 0.2s ease-out',
                                }}>
                                    {STEPS.map((step, i) => {
                                        const isDone   = doneSteps.has(i);
                                        const isActive = activeStep === i;
                                        const isPending = !isDone && !isActive;
                                        return (
                                            <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '18px', height: '18px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {isDone && <CheckCircle size={15} color="#6ee7b7" />}
                                                    {isActive && <Loader size={14} color="#a855f7" style={{ animation: 'spin 0.7s linear infinite' }} />}
                                                    {isPending && (
                                                        <div style={{
                                                            width: '8px', height: '8px', borderRadius: '50%',
                                                            background: 'rgba(255,255,255,0.1)',
                                                            border: '1px solid rgba(255,255,255,0.12)',
                                                        }} />
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: '12.5px', fontFamily: SANS,
                                                    color: isDone ? '#6ee7b7' : isActive ? '#e2e8f0' : '#334155',
                                                    fontWeight: isActive ? 500 : 400,
                                                    transition: 'color 0.3s',
                                                }}>
                                                    {step.label}{isActive ? '...' : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Error message */}
                            {status === 'error' && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                                    padding: '10px 12px', borderRadius: '8px',
                                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                                }}>
                                    <AlertCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    <span style={{ fontSize: '13px', color: '#f87171', lineHeight: 1.6, fontFamily: SANS }}>{errorMsg}</span>
                                </div>
                            )}

                            {/* Verify button */}
                            {!isVerifying && (
                                <button
                                    onClick={handleVerify}
                                    disabled={!apiKey.trim() || status === 'verifying'}
                                    style={{
                                        ...BTN, justifyContent: 'center',
                                        opacity: !apiKey.trim() ? 0.4 : 1,
                                        cursor: !apiKey.trim() ? 'not-allowed' : 'pointer',
                                    }}
                                    onMouseEnter={(e) => { if (apiKey.trim()) e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.28)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)'; }}
                                >
                                    Verify & Continue
                                </button>
                            )}

                            {keyExists && showUpdate && !isVerifying && (
                                <button
                                    onClick={() => { setShowUpdate(false); setApiKey(''); setStatus('idle'); setErrorMsg(''); resetProgress(); }}
                                    style={{ ...BTN, justifyContent: 'center', backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}
                                >
                                    Cancel
                                </button>
                            )}
                        </>
                    )}

                    {/* Management buttons */}
                    {keyExists && !showUpdate && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowUpdate(true)}
                                style={{ ...BTN, flex: 1, justifyContent: 'center' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.25)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)'; }}
                            >
                                Update Key
                            </button>
                            <button
                                onClick={handleRemove}
                                disabled={removing}
                                style={{
                                    ...BTN, flex: 1, justifyContent: 'center',
                                    borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                                    opacity: removing ? 0.5 : 1, cursor: removing ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={(e) => { if (!removing) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                            >
                                {removing ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
                                {removing ? 'Removing...' : 'Remove Key'}
                            </button>
                        </div>
                    )}

                    {/* Get key link */}
                    {!keyExists && !isVerifying && (
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                fontSize: '13px', color: '#64748b', textDecoration: 'none',
                                fontFamily: SANS, fontWeight: 400, letterSpacing: '0.01em',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#a855f7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                        >
                            Get a free key at aistudio.google.com
                            <ExternalLink size={11} />
                        </a>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}

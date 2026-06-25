import { Key, ShieldCheck, SlidersHorizontal, ArrowRight } from 'lucide-react';
import './LPBYOK.css';

const PILLARS = [
    {
        icon: Key,
        title: 'Bring Your Own Key',
        description: 'Paste your Gemini API key from aistudio.google.com. Free tier keys work — no credit card required to start.',
    },
    {
        icon: ShieldCheck,
        title: 'Reaches the Server — Never Stored',
        description: 'Your key travels to our server over HTTPS to be validated and encrypted. It is never written to any database, file, or log. The server encrypts it with AES-256-GCM and sends it straight back to your browser as an HttpOnly cookie — invisible to JavaScript, including ours.',
    },
    {
        icon: SlidersHorizontal,
        title: 'Always in Control',
        description: 'Remove your key with one click. It expires automatically in 7 days. Every request decrypts it in-memory for that call only — nothing persists on our end between requests.',
    },
];

const STEPS = [
    { num: '01', label: 'Enter key' },
    { num: '02', label: 'Server validates' },
    { num: '03', label: 'Encrypted → cookie' },
    { num: '04', label: 'Decrypted per request' },
];

export default function LPBYOK() {
    return (
        <section className="byok-section">
            <h2 className="byok-section-title">BYOK.</h2>
            <div className="byok-outer">
                <div className="byok-inner">

                    <div className="byok-badge">
                        <ShieldCheck size={11} strokeWidth={2.5} />
                        <span>API Security</span>
                    </div>

                    <h2 className="byok-title">Your key. Your control.</h2>
                    <p className="byok-subtitle">
                        Your key reaches our server to be validated — then it's encrypted and
                        sent back to your browser. We never write it to a database or keep it between requests.
                    </p>

                    <div className="byok-grid">
                        {PILLARS.map((p, i) => {
                            const Icon = p.icon;
                            return (
                                <div key={i} className="byok-card">
                                    <div className="byok-card-icon">
                                        <Icon size={20} strokeWidth={1.75} />
                                    </div>
                                    <h3 className="byok-card-title">{p.title}</h3>
                                    <p className="byok-card-desc">{p.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="byok-steps">
                        {STEPS.map((s, i) => (
                            <div key={i} className="byok-step-group">
                                <div className="byok-step">
                                    <span className="byok-step-num">{s.num}</span>
                                    <span className="byok-step-label">{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <ArrowRight size={13} className="byok-step-arrow" />
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}

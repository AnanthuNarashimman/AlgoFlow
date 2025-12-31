import { useState, useEffect } from "react";
import LPHero from "../../components/LPHero/LPHero";
import LPFeature from "../../components/LPFeatures/LPFeature";
import LPUse from "../../components/LPUse/LPUse";
import MagicBento from "../../components/MagicBento/MagicBento";
import LPGIT from "../../components/LPGit/LPGIT";
import LPFooter from "../../components/LPFooter/LPFooter";
import PillNav from "../../components/LPNav/PillNav";


import "./LandingPage.css"
import Logo from "../../assets/code.png";

function LandingPage() {
    const [serverStatus, setServerStatus] = useState('checking'); // 'checking', 'ready', 'error', 'hidden'
    const [statusMessage, setStatusMessage] = useState('Connecting to server...');

    useEffect(() => {
        const checkServerHealth = async () => {
            const API_URL = import.meta.env.VITE_API_URL;
            const maxAttempts = 12;
            let attempt = 0;

            const ping = async () => {
                attempt++;

                try {
                    const response = await fetch(`${API_URL}/api/health`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (response.ok) {
                        setServerStatus('ready');
                        setStatusMessage('Server active');

                        // Hide indicator after 2 seconds
                        setTimeout(() => {
                            setServerStatus('hidden');
                        }, 2000);

                        return true;
                    }
                } catch (error) {
                    console.log(`Health check attempt ${attempt} failed:`, error.message);
                }

                // Update status message based on elapsed time
                if (attempt <= 5) {
                    setStatusMessage('Connecting to server...');
                } else if (attempt <= 10) {
                    setStatusMessage('Starting server (free tier takes ~30s)...');
                } else {
                    setStatusMessage('Almost there... having trouble connecting?');
                }

                // Retry logic
                if (attempt < maxAttempts) {
                    const delay = attempt <= 5 ? 3000 : 5000; // 3s for first 5, then 5s
                    setTimeout(ping, delay);
                } else {
                    setServerStatus('error');
                    setStatusMessage('Unable to connect to server');
                }
            };

            ping();
        };

        checkServerHealth();
    }, []);

    return (
        <div className="landing-page">
            {/* Server Status Indicator */}
            {serverStatus !== 'hidden' && (
                <div className={`server-status-indicator ${serverStatus === 'ready' ? 'fade-out' : ''}`} title={statusMessage}>
                    <div className={`status-spinner ${serverStatus === 'error' ? 'error' : ''} ${serverStatus === 'ready' ? 'success' : ''}`}>
                        {serverStatus === 'checking' ? (
                            <div className="spinner"></div>
                        ) : serverStatus === 'ready' ? (
                            <span className="success-icon">✓</span>
                        ) : (
                            <span className="error-icon">✕</span>
                        )}
                    </div>
                    <span className="status-tooltip">{statusMessage}</span>
                </div>
            )}
            <PillNav
                logo={Logo}
                logoAlt="AlgoFlow Logo"
                items={[
                    { label: 'Home', href: '#home' },
                    { label: 'Features', href: '#features' },
                    { label: 'Tech Stack', href: '#tech-stack' },
                    { label: 'Community', href: '#community' },
                    { label: 'Contact', href: '#contact' }
                ]}
                className="custom-nav"
                ease="power2.easeOut"
                baseColor="#ffffff"
                pillColor="#1a1a1a"
                hoveredPillTextColor="#000000"
                pillTextColor="#ffffff"
            />

            <section id="home">
                <LPHero />
            </section>

            <section id="features">
                <LPFeature />
            </section>

            <section id="about">
                <LPUse />
            </section>

            <section id="tech-stack">
                <MagicBento
                    textAutoHide={true}
                    enableStars={true}
                    enableSpotlight={true}
                    enableBorderGlow={true}
                    enableTilt={true}
                    enableMagnetism={true}
                    clickEffect={true}
                    spotlightRadius={300}
                    particleCount={12}
                    glowColor="132, 0, 255"
                />
            </section>

            <section id="community">
                <LPGIT />
            </section>

            <section id="contact">
                <LPFooter />
            </section>
        </div>
    )
}

export default LandingPage

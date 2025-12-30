import PillNav from "../components/LPNav/PillNav";
import LPHero from "../components/LPHero/LPHero";
import LPFeature from "../components/LPFeatures/LPFeature";
import LPUse from "../components/LPUse/LPUse";
import MagicBento from "../components/MagicBento/MagicBento";
import LPGIT from "../components/LPGit/LPGIT";
import LPFooter from "../components/LPFooter/LPFooter";

import "../Styles/LandingPage.css"
import Logo from "../assets/code.png";

function LandingPage() {
    return (
        <div className="landing-page">
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

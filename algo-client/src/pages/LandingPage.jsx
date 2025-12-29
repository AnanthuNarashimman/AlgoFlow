import PillNav from "../components/LPNav/PillNav";
import LPHero from "../components/LPHero/LPHero";
import LPFeature from "../components/LPFeatures/LPFeature";
import LPUse from "../components/LPUse/LPUse";

import "../Styles/LandingPage.css"
import Logo from "../assets/code.png";

function LandingPage() {
    return (
        <div className="landing-page">
            <PillNav
                logo={Logo}
                logoAlt="Company Logo"
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'Features', href: '/features' },
                    { label: 'Services', href: '/services' },
                    { label: 'Contact', href: '/contact' }
                ]}
                activeHref="/"
                className="custom-nav"
                ease="power2.easeOut"
                baseColor="#ffffff"
                pillColor="#1a1a1a"
                hoveredPillTextColor="#000000"
                pillTextColor="#ffffff"
            />

            <LPHero />

            <LPFeature />

            <LPUse />
        </div>
    )
}

export default LandingPage

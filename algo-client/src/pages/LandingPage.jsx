import PillNav from "../components/LPNav/PillNav";
import LPHero from "../components/LPHero/LPHero";

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
                    { label: 'About', href: '/about' },
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
        </div>
    )
}

export default LandingPage

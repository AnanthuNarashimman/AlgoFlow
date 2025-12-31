import "./LPHero.css";

import Hero1 from "../../assets/Hero1.jpeg";
import Hero2 from "../../assets/Hero2.jpeg";


import { useNavigate } from "react-router-dom";

function LPHero() {
    const navigate = useNavigate();
    return (
        <main className="landing-main">
            <section className="hero-section">
                <div className="hero-content">
                    <div className="brand-pill">
                        <span>AlgoFlow</span>
                    </div>
                    <h1 className="hero-title">Master algorithms comes <br/>from visual clarity.</h1>
                    <p className="hero-subtitle">Stop tracing loops in your head. Start seeing them on screen.<br/>Turn complex code into clear visualizations. Learn faster, code smarter.</p>
                    <div className="hero-cta">
                        <button className="cta-primary" onClick={() => {navigate("/login")}}>Get Started</button>
                        <button className="cta-secondary">Watch Demo</button>
                    </div>
                    <div className="hero-demos">
                        <img src={Hero1} alt="Platform demo 1" className="demo-image" />
                        <img src={Hero2} alt="Platform demo 2" className="demo-image" />
                    </div>
                </div>
            </section>
        </main>
    )
}

export default LPHero

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
                    <h1 className="hero-title">
                        Master algorithms <span className="break-mobile">from visual clarity</span>
                    </h1>
                    <p className="hero-subtitle">
                        <span className="desktop-text">Stop tracing loops in your head. Start seeing them on screen. <br></br>Turn complex code into clear visualizations. Learn faster, code smarter.</span>
                        <span className="mobile-text">Visualize algorithms in real-time. <br></br>Learn faster, code smarter.</span>
                    </p>
                    <div className="hero-cta">
                        <button className="cta-primary" onClick={() => {navigate("/learn-space")}}>Try It Free</button>
                        <a href="https://youtu.be/j5MJTo73bes?si=JX1ssAckxzdPvdZE" target="__blank"><button className="cta-secondary">Watch Demo</button></a>
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

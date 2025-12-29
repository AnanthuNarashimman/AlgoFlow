import "./LPHero.css";

import Hero1 from "../../assets/Hero1.jpeg";
import Hero2 from "../../assets/Hero2.jpeg";

import ExecVideo from "../../assets/Videos/Execution.mp4";

function LPHero() {
    return (
        <main className="landing-main">
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Master algorithms comes <br/>from visual clarity.</h1>
                    <p className="hero-subtitle">Stop tracing loops in your head. Start seeing them on screen.<br/>Turn complex code into clear visualizations. Learn faster, code smarter.</p>
                    <div className="hero-cta">
                        <button className="cta-primary">Get Started</button>
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

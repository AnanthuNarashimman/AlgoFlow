import { useState } from "react";
import "./LPFeature.css";
import ExecVideo from "../../assets/Videos/Execution.mp4";
import ChatVideo from "../../assets/Videos/Chat.mp4";
import FlowVideo from "../../assets/Videos/Flow.mp4";

import PixelTransition from "../PixelTransition/PixelTransition";

import { Play, MessageSquare, GitBranch } from "lucide-react";

function LPFeature() {
    const [activeFeature, setActiveFeature] = useState('execution');

    const features = {
        execution: {
            title: "Instant Code Execution on Browser",
            titleMobile: "Instant Code Execution",
            description: "Run your algorithms in real-time, right in your browser. No setup required, just write and execute the code.",
            descriptionMobile: "Run algorithms in real-time. No setup required.",
            video: ExecVideo
        },
        ai: {
            title: "AI-Powered Chat Assistant",
            titleMobile: "AI Chat Assistant",
            description: "Get intelligent help with your code. Ask questions, debug issues, and learn algorithms with AI guidance.",
            descriptionMobile: "Get AI help with your code. Debug and learn faster.",
            video: ChatVideo
        },
        flowchart: {
            title: "Visual Flowchart Generator",
            titleMobile: "Flowchart Generator",
            description: "Transform your code into clear flowcharts automatically. Understand complex logic at a glance.",
            descriptionMobile: "Transform code into clear flowcharts automatically.",
            video: FlowVideo
        }
    };

    const currentFeature = features[activeFeature];

    return (
        <section className="features-section">
            <div className="feature-container">
                <div className="feature-header">
                    <h2 className="feature-main-title">
                        <span className="desktop-text">Visualize and master.</span>
                        <span className="mobile-text">Visualize & Master</span>
                    </h2>
                    <p className="feature-tagline">
                        <span className="desktop-text">Code. Flowcharts. AI. Execution.<br></br>AlgoFlow takes you from confusion to clarity.</span>
                        <span className="mobile-text">Code, visualize, and master algorithms with AI-powered tools.</span>
                    </p>
                </div>

                <div className="feature-cards">
                    <div onClick={() => setActiveFeature('execution')}>
                        <PixelTransition
                            firstContent={
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center"
                                    }}
                                >
                                    <Play size={40} color="#ffffff" strokeWidth={1.5} />
                                </div>
                            }
                            secondContent={
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center"
                                    }}
                                >
                                    <p style={{ fontWeight: 500, fontSize: "1.3rem", color: "#ffffff", fontFamily: "Figtree" }}>Execute</p>
                                </div>
                            }
                            gridSize={12}
                            pixelColor='#ffffff'
                            once={false}
                            animationStepDuration={0.4}
                            className={activeFeature === 'execution' ? 'active' : ''}
                        />
                    </div>

                    <div onClick={() => setActiveFeature('ai')}>
                        <PixelTransition
                            firstContent={
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center"
                                    }}
                                >
                                    <MessageSquare size={40} color="#ffffff" strokeWidth={1.5} />
                                </div>
                            }
                            secondContent={
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center"
                                    }}
                                >
                                    <p style={{ fontWeight: 500, fontSize: "1.3rem", color: "#ffffff", fontFamily: "Figtree" }}>Chat</p>
                                </div>
                            }
                            gridSize={12}
                            pixelColor='#ffffff'
                            once={false}
                            animationStepDuration={0.4}
                            className={activeFeature === 'ai' ? 'active' : ''}
                        />
                    </div>

                    <div onClick={() => setActiveFeature('flowchart')}>
                        <PixelTransition
                            firstContent={
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center"
                                    }}
                                >
                                    <GitBranch size={40} color="#ffffff" strokeWidth={1.5} />
                                </div>
                            }
                            secondContent={
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "grid",
                                        placeItems: "center"
                                    }}
                                >
                                    <p style={{ fontWeight: 500, fontSize: "1.3rem", color: "#ffffff", fontFamily: "Figtree" }}>Analyze</p>
                                </div>
                            }
                            gridSize={12}
                            pixelColor='#ffffff'
                            once={false}
                            animationStepDuration={0.4}
                            className={activeFeature === 'flowchart' ? 'active' : ''}
                        />
                    </div>

                </div>

                <div className="feature-demo" key={activeFeature}>
                    <div className="feature-demo-content">
                        <h3 className="feature-demo-title">
                            <span className="desktop-text">{currentFeature.title}</span>
                            <span className="mobile-text">{currentFeature.titleMobile}</span>
                        </h3>
                        <p className="feature-demo-description">
                            <span className="desktop-text">{currentFeature.description}</span>
                            <span className="mobile-text">{currentFeature.descriptionMobile}</span>
                        </p>
                    </div>
                    <div className="feature-demo-media">
                        <video
                            className="feature-demo-video"
                            autoPlay
                            loop
                            muted
                            playsInline
                        >
                            <source src={currentFeature.video} type="video/mp4" />
                        </video>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LPFeature
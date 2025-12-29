import { useState } from "react";
import "./LPFeature.css";
import ExecVideo from "../../assets/Videos/Execution.mp4";
import ChatVideo from "../../assets/Videos/Chat.mp4";
import FlowVideo from "../../assets/Videos/Flow.mp4";

import PixelTransition from "../PixelTransition/PixelTransition";

import Chat from "../../assets/Chat.png";
import Flow from "../../assets/Flow.png";
import Execution from "../../assets/Execution.png";

function LPFeature() {
    const [activeFeature, setActiveFeature] = useState('execution');

    const features = {
        execution: {
            title: "Instant Code Execution",
            description: "Run your algorithms in real-time, right in your browser. No setup required, just write and execute.",
            video: ExecVideo,
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
            )
        },
        ai: {
            title: "AI-Powered Chat Assistant",
            description: "Get intelligent help with your code. Ask questions, debug issues, and learn algorithms with AI guidance.",
            video: ChatVideo, // placeholder
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            )
        },
        flowchart: {
            title: "Visual Flowchart Generator",
            description: "Transform your code into clear flowcharts automatically. Understand complex logic at a glance.",
            video: FlowVideo, // placeholder
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <rect x="8" y="6" width="8" height="6" rx="1" />
                    <rect x="8" y="12" width="8" height="6" rx="1" />
                </svg>
            )
        }
    };

    const currentFeature = features[activeFeature];

    return (
        <section className="features-section">
            <div className="feature-container">
                <div className="feature-header">
                    <h2 className="feature-main-title">Visualize and master.</h2>
                    <p className="feature-tagline">
                        Code. Flowcharts. AI. Execution.<br></br>AlgoFlow takes you from confusion to clarity.
                    </p>
                </div>

                <div className="feature-cards">
                    <div onClick={() => setActiveFeature('execution')}>
                        <PixelTransition
                            firstContent={
                                <img
                                    src={Execution}
                                    alt="default pixel transition content, a cat!"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
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
                                    <p style={{ fontWeight: 500, fontSize: "1.5rem", color: "#ffffff", fontFamily: "Figtree" }}>Execution</p>
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
                                <img
                                    src={Chat}
                                    alt="default pixel transition content, a cat!"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
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
                                    <p style={{ fontWeight: 500, fontSize: "1.5rem", color: "#ffffff", fontFamily: "Figtree" }}>Chat</p>
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
                                <img
                                    src={Flow}
                                    alt="default pixel transition content, a cat!"
                                    style={{ width: "100%", height: "100%", objectFit: "cover"}}
                                />
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
                                    <p style={{ fontWeight: 500, fontSize: "1.5rem", color: "#ffffff", fontFamily: "Figtree" }}>Flow Chart</p>
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
                        <h3 className="feature-demo-title">{currentFeature.title}</h3>
                        <p className="feature-demo-description">{currentFeature.description}</p>
                    </div>
                    <div className="feature-demo-media">
                        {currentFeature.video ? (
                            <video
                                className="feature-demo-video"
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                <source src={currentFeature.video} type="video/mp4" />
                            </video>
                        ) : (
                            <div className="feature-demo-placeholder">
                                <div className="placeholder-icon">{currentFeature.icon}</div>
                                <p>Demo coming soon</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default LPFeature

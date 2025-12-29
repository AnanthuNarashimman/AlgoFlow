import './LPUse.css';
import Students from "../../assets/Students.png";
import Grads from "../../assets/Grads.png";
import Preps from "../../assets/Preps.png";
import Visual from "../../assets/Visual.png";

import CircularText from '../CircularText/CircularText';

function LPUse() {
  const cards = [
    {
      id: 1,
      title: "Computer Science Students",
      description: "Ace exams by seeing algorithms, not just reading them.",
      image: Students
    },
    {
      id: 2,
      title: "Software Engineers Preparing for Interviews",
      description: "Master coding interviews with visual problem breakdowns.",
      image: Preps
    },
    {
      id: 3,
      title: "Coding Bootcamp Grads",
      description: "Bridge from tutorials to real algorithmic understanding.",
      image: Grads
    },
    {
      id: 4,
      title: "Developers Who Think Visually",
      description: "Understand code through flowcharts, not text walls.",
      image: Visual
    }
  ];

  return (
    <div className="lpuse-container">
      {/* <h2 className="lpuse-heading">Who AlgoFlow Is For</h2> */}
      <div className="lpuse-wrapper">
        <div className="lpuse-grid">
          {cards.map((card) => (
            <div key={card.id} className="lpuse-card" style={{ backgroundImage: `url(${card.image})` }}>
              <div className="lpuse-card-overlay">
                <h3 className="lpuse-card-title">{card.title}</h3>
                <p className="lpuse-card-description">{card.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lpuse-center-background"></div>

        <div className="lpuse-center-circle">
          <CircularText
            text="BUILT*FOR*YOU*"
            onHover="speedUp"
            spinDuration={20}
            className="lpuse-circular-text"
          />
        </div>
      </div>
    </div>
  );
}

export default LPUse;

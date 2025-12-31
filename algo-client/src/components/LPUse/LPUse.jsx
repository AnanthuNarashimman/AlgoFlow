import './LPUse.css';
import Students from "../../assets/Students.png";
import Grads from "../../assets/Grads.png";
import Preps from "../../assets/Preps.png";
import Visual from "../../assets/Visual.png";

import star from "../../assets/star.png";

import CircularText from '../CircularText/CircularText';

function LPUse() {
  const useCases = [
    {
      id: 1,
      title: "Students",
      description: "Ace exams by seeing algorithms, not just reading them.",
      image: Students
    },
    {
      id: 2,
      title: "Aspirants",
      description: "Master coding interviews with visual problem breakdowns.",
      image: Preps
    },
    {
      id: 3,
      title: "Starters",
      description: "Bridge from tutorials to real algorithmic understanding.",
      image: Grads
    },
    {
      id: 4,
      title: "Thinkers",
      description: "Understand code clearly through flowcharts, not text walls.",
      image: Visual
    }
  ];

  return (
    <div className="lpuse-container">
      <h2 className="lpuse-header">Learn your way</h2>
      <p className="lpuse-subheader">AlgoFlow supports every step of your journey</p>
      <div className="lpuse-cards">
        {useCases.map((useCase) => (
          <div
            key={useCase.id}
            className={`lpuse-card ${useCase.id === 1 ? 'first-card' : ''}`}
            style={{ '--bg-image': `url(${useCase.image})` }}
          >
            <div className="lpuse-pattern lpuse-pattern-top"></div>
            <div className="lpuse-pattern lpuse-pattern-bottom"></div>
            <div className="lpuse-card-circular">
              <CircularText
                text="YOU*YOU*YOU*YOU*YOU*YOU*"
                onHover="speedUp"
                spinDuration={20}
                className="lpuse-circular-text"
              />
            </div>
            <div className="lpuse-card-content">
              <h3 className="lpuse-card-title">{useCase.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LPUse

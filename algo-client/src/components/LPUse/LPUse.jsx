import './LPUse.css';

function LPUse() {
  const cards = [
    {
      id: 1,
      title: "Computer Science Students",
      description: "Ace exams by seeing algorithms, not just reading them.",
      image: "/path/to/student-image.jpg" // Replace with actual image path
    },
    {
      id: 2,
      title: "Software Engineers Preparing for Interviews",
      description: "Master coding interviews with visual problem breakdowns.",
      image: "/path/to/engineer-image.jpg" // Replace with actual image path
    },
    {
      id: 3,
      title: "Coding Bootcamp Grads",
      description: "Bridge from tutorials to real algorithmic understanding.",
      image: "/path/to/bootcamp-image.jpg" // Replace with actual image path
    },
    {
      id: 4,
      title: "Developers Who Think Visually",
      description: "Understand code through flowcharts, not text walls.",
      image: "/path/to/developer-image.jpg" // Replace with actual image path
    }
  ];

  return (
    <div className="lpuse-container">
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
    </div>
  );
}

export default LPUse;

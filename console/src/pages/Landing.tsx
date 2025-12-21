// Epic Space Landing Page for Morgus.ai
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export function Landing() {
  const [doorState, setDoorState] = useState<'open' | 'closing' | 'closed' | 'opening'>('open');
  const [showContent, setShowContent] = useState(false);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
  const navigate = useNavigate();

  // Generate random stars on mount
  useEffect(() => {
    const generatedStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
    }));
    setStars(generatedStars);
  }, []);

  const handleEnter = () => {
    // First close the doors
    setDoorState('closing');
    
    // After doors close, open them and show portal
    setTimeout(() => {
      setDoorState('opening');
      setShowContent(true);
    }, 1500);
    
    // Navigate after the full animation
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  };

  return (
    <div className="landing-container">
      {/* Starfield Background */}
      <div className="starfield">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Giant Metal Doors - Vertical (Top/Bottom) */}
      <div className={`doors-container ${doorState}`}>
        {/* Top Door */}
        <div className="door door-top">
          <div className="door-panel">
            <div className="door-rivets">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rivet" />
              ))}
            </div>
            <div className="door-stripe" />
            <div className="door-stripe" />
            <div className="door-glow" />
          </div>
        </div>

        {/* Bottom Door */}
        <div className="door door-bottom">
          <div className="door-panel">
            <div className="door-rivets">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rivet" />
              ))}
            </div>
            <div className="door-stripe" />
            <div className="door-stripe" />
            <div className="door-glow" />
          </div>
        </div>

        {/* Center seam glow - horizontal */}
        <div className="door-seam" />
      </div>

      {/* Main Content */}
      <div className={`landing-content ${doorState === 'closing' || doorState === 'closed' || doorState === 'opening' ? 'fading' : ''}`}>
        {/* Bill the Marketing Hog */}
        <div className="bill-container">
          <div className="bill-glow" />
          <img 
            src="/bill-full.jpg" 
            alt="Bill the Marketing Hog" 
            className="bill-image"
          />
          <div className="bill-reflection" />
        </div>

        {/* Title and CTA */}
        <div className="landing-text">
          <h1 className="landing-title">
            <span className="title-morgus">MORGUS</span>
            <span className="title-ai">.AI</span>
          </h1>
          <p className="landing-tagline">Your Autonomous AI Agent</p>
          <p className="landing-subtitle">
            Meet Bill and the Morgys — your team of specialized AI agents ready to tackle any challenge
          </p>
          
          <button className="enter-button" onClick={handleEnter}>
            <span className="button-text">Enter the Hog House</span>
            <span className="button-icon">🚀</span>
            <div className="button-glow" />
          </button>
        </div>
      </div>

      {/* Portal light effect when opening */}
      {showContent && (
        <div className="portal-light" />
      )}

      {/* Neon frame around the viewport */}
      <div className="neon-frame">
        <div className="neon-corner top-left" />
        <div className="neon-corner top-right" />
        <div className="neon-corner bottom-left" />
        <div className="neon-corner bottom-right" />
      </div>
    </div>
  );
}

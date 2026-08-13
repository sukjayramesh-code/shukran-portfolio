import React from "react";
import "../styles/Art.css";
import FadeInSection from "./FadeInSection";
import { Link } from "react-router-dom";

// Importing your Top 6 highlight images
import joker from "../assets/art/Joker.png";
import magneto from "../assets/art/Magneto.png";
import hellboy from "../assets/art/Hellboy.png";
import ghostRider from "../assets/art/GhostRider.png";
import twoFace from "../assets/art/TwoFace.png";
import lobo from "../assets/art/Lobo.png";

const Art = () => {
  const topArt = [
    { src: joker, title: "The Joker" },
    { src: magneto, title: "Magneto" },
    { src: hellboy, title: "Hellboy" },
    { src: ghostRider, title: "Ghost Rider" },
    { src: twoFace, title: "Two-Face" },
    { src: lobo, title: "Lobo" }
  ];

  return (
    <div id="art">
      <div className="section-header">
        <span className="section-title">/ art</span>
        <Link to="/art" className="explore-link">
          Explore collection
        </Link>
      </div>
      <FadeInSection delay="200ms">
        <div className="art-description">
          A collection of my digital and traditional artwork, exploring different styles and mediums.
        </div>
      </FadeInSection>
      <div className="art-container">
        <div className="art-grid">
          {topArt.map((art, i) => (
            <FadeInSection key={i} delay={(i + 1) * 100 + "ms"}>
              <div className="art-card">
                <img src={art.src} alt={art.title} className="art-image" />
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Art;
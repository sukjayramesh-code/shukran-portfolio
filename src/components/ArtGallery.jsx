import React from "react";
import "../styles/ArtGallery.css";
import FadeInSection from "./FadeInSection";
import { Link } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import joker from "../assets/art/Joker.png";
import magneto from "../assets/art/Magneto.png";
import hellboy from "../assets/art/Hellboy.png";
import ghostRider from "../assets/art/GhostRider.png";
import twoFace from "../assets/art/TwoFace.png";
import lobo from "../assets/art/Lobo.png";

const ArtGallery = () => {
  const allArt = [
    { src: joker, title: "The Joker" },
    { src: magneto, title: "Magneto" },
    { src: hellboy, title: "Hellboy" },
    { src: ghostRider, title: "Ghost Rider" },
    { src: twoFace, title: "Two-Face" },
    { src: lobo, title: "Lobo" }
  ];

  return (
    <div className="art-gallery-page">
      <div className="section-header">
        <Link to="/" className="back-button">
          <ArrowBackRoundedIcon />
        </Link>
        <span className="section-title">/ art gallery</span>
      </div>
      <FadeInSection delay="200ms">
        <div className="gallery-description">
          A collection of my digital and traditional artwork, exploring different styles and mediums.
        </div>
      </FadeInSection>
      <div className="gallery-grid">
        {allArt.map((art, i) => (
          <FadeInSection key={i} delay={(i + 1) * 100 + "ms"}>
            <div className="gallery-card">
              <img src={art.src} alt={art.title} className="gallery-image" />
            </div>
          </FadeInSection>
        ))}
      </div>
    </div>
  );
};

export default ArtGallery;
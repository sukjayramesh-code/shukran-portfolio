import React from "react";
import "../styles/Projects.css";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import FadeInSection from "./FadeInSection";
import { Carousel } from "react-bootstrap";
import ExternalLinks from "./ExternalLinks";

const base = import.meta.env.BASE_URL;

const spotlightProjects = {
  Pos: {
    title: "Twistello — Stall POS",
    desc: "A Point of Sale system for a food stall, handling menu items, add-ons, order tickets, and totals.",
    techStack: "C# (UNITY)",
    link: "https://github.com/sukjayramesh-code/Point-of-sale-",
    open: "https://sukjayramesh-code.github.io/Point-of-sale-/",
    image: base + "assets/pos.png",
  },
  Jarvis: {
    title: "J.A.R.V.I.S",
    desc: "A Discord bot that responds to user commands and simulated AI-style queries.",
    techStack: "JavaScript (Discord.js)",
    link: "https://github.com/sukjayramesh-code/J.A.R.V.I.S",
    open: "https://github.com/sukjayramesh-code/J.A.R.V.I.S",
    image: base + "assets/jarvis.png",
  },
  Srikandi: {
    title: "Srikandi Guard",
    desc: "A women's safety mobile app (FYP, in progress) with live GPS location sharing and an SOS alert system.",
    techStack: "Mobile App Dev",
    link: "https://github.com/sukjayramesh-code/Srikandi-Guard-V1",
    open: "https://github.com/sukjayramesh-code/Srikandi-Guard-V1",
    image: base + "assets/srikandi.png",
  },
};

const Projects = () => {
  return (
    <div id="projects">
      <div className="section-header ">
        <span className="section-title">/ software</span>
        <a
          href="https://github.com/sukjayramesh-code"
          className="explore-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          View all projects
        </a>
      </div>
      <div className="spotlight-projects-desktop">
        <Carousel interval={null}>
          {Object.keys(spotlightProjects).map((key, i) => (
            <Carousel.Item key={i}>
              <img
                className="d-block w-100"
                src={spotlightProjects[key]["image"]}
                alt={key}
              />
              <Carousel.Caption>
                <h3>{spotlightProjects[key]["title"]}</h3>
                <div>
                  {spotlightProjects[key]["desc"]}
                  <div className="techStack">
                    {spotlightProjects[key]["techStack"]}
                  </div>
                </div>
                <ExternalLinks
                  githubLink={spotlightProjects[key]["link"]}
                  openLink={spotlightProjects[key]["open"]}
                />
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      <div className="spotlight-projects-mobile">
        {Object.keys(spotlightProjects).map((key, i) => (
          <FadeInSection key={i} delay={(i + 1) * 100 + "ms"}>
            <div className="projects-card">
              <div className="card-header">
                <div className="folder-icon">
                  <FolderOpenRoundedIcon sx={{ fontSize: 35 }} />
                </div>
                <ExternalLinks
                  githubLink={spotlightProjects[key]["link"]}
                  openLink={spotlightProjects[key]["open"]}
                />
              </div>

              <a
                href={
                  spotlightProjects[key]["open"] ||
                  spotlightProjects[key]["link"]
                }
                target="_blank"
                rel="noopener noreferrer"
                className="project-card-link"
              >
                <div className="card-title">
                  {spotlightProjects[key]["title"]}
                </div>
                <div className="spotlight-mobile-image">
                  <img src={spotlightProjects[key]["image"]} alt={key} />
                </div>
              </a>
              <div className="card-desc">{spotlightProjects[key]["desc"]}</div>
              <div className="card-tech">{spotlightProjects[key]["techStack"]}</div>
            </div>
          </FadeInSection>
        ))}
      </div>
    </div>
  );
};

export default Projects;
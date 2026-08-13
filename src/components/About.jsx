import React from "react";
import "../styles/About.css";
import FadeInSection from "./FadeInSection";

const About = () => {
  const one = (
    <p>
      I am a 20-year-old student at <b>Politeknik Balik Pulau</b>, specializing in{" "}
      <b>Mobile App and Web Development</b>. I also work part-time as crew at{" "}
      <a href="https://www.mcdonalds.com.my/">McDonald's</a> and am looking forward to starting my software development internship later in 2026.
    </p>
  );
  
  const two = (
    <p>
      In my free time, I love hunting down rare Image, DC, and Marvel comics, tinkering with the technical specs of my Perodua Myvi Gen 3, and listening to music.
    </p>
  );

  const techStack = [
    "Java",
    "PHP",
    "MySQL & SQLite",
    "Android Studio",
    "Adobe Photoshop",
    "Adobe Illustrator",
  ];

  return (
    <div id="about">
      <FadeInSection>
        <div className="section-header ">
          <span className="section-title">/ about me</span>
        </div>
        <div className="about-content">
          <div className="about-description">
            {one}
            {"Here are some technologies I have been working with:"}
            <ul className="tech-stack">
              {techStack.map((techItem, i) => (
                <FadeInSection key={i} delay={(i + 1) * 100 + "ms"}>
                  <li>{techItem}</li>
                </FadeInSection>
              ))}
            </ul>
            {two}
          </div>
          <div className="about-image">
            <img alt="Shukran" src="/assets/me2.jpg" />
          </div>
        </div>
      </FadeInSection>
    </div>
  );
};

export default About;
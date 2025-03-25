import React, { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true); // Sidebar state

  return (
    <div style={{ ...styles.sidebar, width: isOpen ? "200px" : "50px" }}>
      <button onClick={() => setIsOpen(!isOpen)} style={styles.toggleButton}>
        {isOpen ? "←" : "→"}
      </button>
      {isOpen && <h2>Schedule App</h2>}
      <nav>
        <ul style={styles.navList}>
          <li>
            <Link to="/manage-schedule" style={styles.link}>
              {isOpen ? "View & Add Schedule" : "📅"}
            </Link>
          </li>
          <li>
            <Link to="/view-schedule" style={styles.link}>
              {isOpen ? "Manage Schedule" : "👀"}
            </Link>
          </li>
          <li>
            <Link to="/feedback" style={styles.link}>
              {isOpen ? "Feedback" : "📝"}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const styles = {
  sidebar: {
    height: "100vh",
    background: "grey",
    color: "#fff",
    padding: "20px",
    position: "fixed",
    top: 0,
    left: 0,
    transition: "width 0.3s ease",
    overflow: "hidden",
  },
  toggleButton: {
    background: "#333",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "20px",
    padding: "10px",
    marginBottom: "10px",
    display: "block",
    width: "100%",
    textAlign: "center",
  },
  navList: {
    listStyle: "none",
    padding: 0,
  },
  link: {
    textDecoration: "none",
    color: "white",
    display: "block",
    padding: "10px 0",
  },
};

export default Sidebar;

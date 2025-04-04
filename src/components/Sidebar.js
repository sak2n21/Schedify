import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  // Check if current path matches the link path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div
      style={{
        ...styles.sidebar,
        width: isOpen ? "250px" : "60px",
      }}
    >
      {/* Header */}
      <div style={styles.header}>
        {isOpen ? (
          <h2 style={styles.title}>Schedify</h2>
        ) : (
          <span style={styles.iconOnly}>📅</span>
        )}
      </div>

      {/* Toggle button */}
      {/* <button 
        onClick={() => setIsOpen(!isOpen)}
        style={styles.toggleButton}
      >
        {isOpen ? "←" : "→"}
      </button> */}

      {/* Navigation */}
      <nav style={styles.nav}>
        {isOpen && (
          <div style={styles.sectionLabel}>
            <p style={styles.sectionText}>WORKSPACE</p>
          </div>
        )}
        <ul style={styles.navList}>
          <li>
            <Link
              to="/Dashboard"
              style={{
                ...styles.link,
                ...(isActive("/Dashboard") ? styles.activeLink : {}),
              }}
            >
              <span style={styles.icon}>📅</span>
              {isOpen && <span>Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/manage-schedule"
              style={{
                ...styles.link,
                ...(isActive("/manage-schedule") ? styles.activeLink : {}),
              }}
            >
              <span style={styles.icon}>📅</span>
              {isOpen && <span>Manage Schedule</span>}
            </Link>
          </li>

          {/* <li>
            <Link 
              to="/view-schedule" 
              style={{
                ...styles.link,
                ...(isActive("/view-schedule") ? styles.activeLink : {})
              }}
            >
              <span style={styles.icon}>👀</span>
              {isOpen && <span>Manage Schedule</span>}
            </Link>
          </li> */}
          <li>
            <Link
              to="/feedback"
              style={{
                ...styles.link,
                ...(isActive("/feedback") ? styles.activeLink : {}),
              }}
            >
              <span style={styles.icon}>📝</span>
              {isOpen && <span>Feedback</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* User section at bottom */}
      <div style={styles.userSection}>
        <div style={styles.avatar}>U</div>
        {isOpen && <span style={styles.userName}>User</span>}
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    height: "100vh",
    backgroundColor: "white",
    color: "#333",
    position: "fixed",
    top: 0,
    left: 0,
    transition: "width 0.3s ease",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
  },
  header: {
    padding: "16px",
    borderBottom: "1px solid #f1f1f1",
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#333",
    margin: 0,
  },
  iconOnly: {
    fontSize: "20px",
    margin: "0 auto",
  },
  toggleButton: {
    position: "absolute",
    top: "16px",
    right: "10px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    color: "#6b7280",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    flexGrow: 1,
    marginTop: "20px",
  },
  sectionLabel: {
    padding: "0 16px",
    marginBottom: "8px",
  },
  sectionText: {
    fontSize: "11px",
    fontWeight: 500,
    color: "#6b7280",
    letterSpacing: "0.05em",
    margin: "0 0 8px 8px",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  link: {
    display: "flex",
    alignItems: "center",
    padding: "8px 16px",
    textDecoration: "none",
    color: "#333",
    fontSize: "14px",
    borderRadius: "4px",
    margin: "2px 8px",
    transition: "background-color 0.2s",
  },
  activeLink: {
    backgroundColor: "#f3f4f6",
    fontWeight: 500,
  },
  icon: {
    marginRight: "12px",
    fontSize: "16px",
    color: "#6b7280",
  },
  userSection: {
    marginTop: "auto",
    padding: "16px",
    borderTop: "1px solid #f1f1f1",
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: 500,
  },
  userName: {
    marginLeft: "12px",
    fontSize: "14px",
  },
};

export default Sidebar;

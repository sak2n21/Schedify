import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [userName, setUserName] = useState("User");
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const nameFromEmail = user.email?.split("@")[0];
        setUserName(user.displayName || nameFromEmail || "User");
      }
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
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

      {/* Navigation */}
      <nav style={styles.nav}>
        {isOpen && (
          <div style={styles.sectionLabel}>
            <p style={styles.sectionText}>WORKSPACE</p>
          </div>
        )}
        <ul style={styles.navList}>
          {[
            { path: "/Dashboard", label: "Dashboard", icon: "📊" },
            { path: "/manage-schedule", label: "Manage Schedule", icon: "📅" },
            { path: "/feedback", label: "Feedback", icon: "📝" },
          ].map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  ...styles.link,
                  ...(isActive(item.path) ? styles.activeLink : {}),
                }}
              >
                <span style={styles.icon}>{item.icon}</span>
                {isOpen && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div style={styles.userSection}>
        <div style={styles.avatar}>{userName.charAt(0).toUpperCase()}</div>
        {isOpen && (
          <div style={styles.userInfo}>
            <p style={styles.userName}>{userName}</p>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        )}
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
    padding: "20px",
    borderBottom: "1px solid #f1f1f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "18px",
    fontWeight: 700,
    margin: 0,
    color: "#333",
  },
  iconOnly: {
    fontSize: "22px",
    margin: "0 auto",
  },
  nav: {
    flexGrow: 1,
    marginTop: "20px",
  },
  sectionLabel: {
    padding: "0 20px",
    marginBottom: "8px",
  },
  sectionText: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    letterSpacing: "0.05em",
    margin: "0 0 8px 8px",
    textTransform: "uppercase",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  link: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    textDecoration: "none",
    color: "#333",
    fontSize: "14px",
    borderRadius: "6px",
    margin: "4px 12px",
    transition: "background-color 0.2s",
  },
  activeLink: {
    backgroundColor: "#f3f4f6",
    fontWeight: 600,
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
    gap: "12px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  userName: {
    fontSize: "14px",
    fontWeight: 500,
    margin: 0,
    color: "#333",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default Sidebar;

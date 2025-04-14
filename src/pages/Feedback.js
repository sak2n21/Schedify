import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import { useMediaQuery } from "react-responsive";
import { onAuthStateChanged } from "firebase/auth";
import {  where } from "firebase/firestore";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Suggestion");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState("form"); // "form" or "history"
  const isMobile = useMediaQuery({ maxWidth: 768 });

  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email);
        fetchFeedbacks(user.uid); // pass UID directly
      }
    });

    return () => unsubscribe(); // cleanup on unmount
  }, [isMobile]);

  const fetchFeedbacks = async (uid) => {
    try {
      const feedbackQuery = query(
        collection(db, "feedbacks"),
        where("userId", "==", uid),
        orderBy("timestamp", "desc")
      );

      const querySnapshot = await getDocs(feedbackQuery);
      const fetchedFeedbacks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setFeedbacks(fetchedFeedbacks);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      showNotification("Failed to load feedback history", "error");
    }
  };

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "" }),
      4000
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showNotification("Please enter your feedback", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const timestamp = new Date();

      const newFeedback = {
        userName: currentUser.displayName || currentUser.email,
        userId: currentUser.uid, // 🔹 include userId
        message: message.trim(),
        category,
        date: timestamp.toISOString().split("T")[0],
        timestamp,
        status: "New",
      };

      await addDoc(collection(db, "feedbacks"), newFeedback);

      // Add to the local state
      setFeedbacks([
        { ...newFeedback, id: Date.now().toString() },
        ...feedbacks,
      ]);

      showNotification("Feedback submitted successfully");

      setMessage("");
      setCategory("Suggestion");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      showNotification("Failed to submit feedback", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (category) => {
    const badgeColors = {
      Suggestion: { bg: "#E8F5E9", text: "#2E7D32" },
      Bug: { bg: "#FFEBEE", text: "#C62828" },
      Other: { bg: "#E3F2FD", text: "#1565C0" },
    };

    const color = badgeColors[category] || badgeColors.Other;

    return (
      <span
        style={{
          backgroundColor: color.bg,
          color: color.text,
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
        }}
      >
        {category}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        style={{
          ...styles.container,
          marginLeft: isMobile ? 0 : isSidebarOpen ? "260px" : "60px",
          padding: isMobile ? "16px" : "40px",
          overflow: "auto",
        }}
      >
        <div style={styles.header}>
          <h1 style={styles.title}>Feedback</h1>
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                borderBottom:
                  viewMode === "form" ? "2px solid #007bff" : "none",
              }}
              onClick={() => setViewMode("form")}
            >
              Submit Feedback
            </button>
            <button
              style={{
                ...styles.tabButton,
                borderBottom:
                  viewMode === "history" ? "2px solid #007bff" : "none",
              }}
              onClick={() => setViewMode("history")}
            >
              History
            </button>
          </div>
        </div>

        {notification.show && (
          <div
            style={{
              ...styles.notification,
              backgroundColor:
                notification.type === "error" ? "#FFEBEE" : "#E8F5E9",
              color: notification.type === "error" ? "#C62828" : "#2E7D32",
            }}
          >
            {notification.message}
          </div>
        )}

        {viewMode === "form" ? (
          <div style={styles.formContainer}>
            <div style={styles.card}>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Your name</label>
                  <input
                    type="text"
                    value={userName}
                    readOnly
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="Suggestion">Suggestion</option>
                    <option value="Bug">Bug</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Your feedback</label>
                  <textarea
                    placeholder="What's on your mind? We'd love to hear your thoughts..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={styles.textarea}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    opacity: isSubmitting ? 0.7 : 1,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div style={styles.historyContainer}>
            {feedbacks.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No feedback has been submitted yet.</p>
              </div>
            ) : (
              <div>
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} style={styles.feedbackCard}>
                    <div style={styles.feedbackHeader}>
                      <div style={styles.feedbackUser}>{feedback.userName}</div>
                      <div style={styles.feedbackMeta}>
                        {getCategoryBadge(feedback.category)}
                        <span style={styles.feedbackDate}>{feedback.date}</span>
                      </div>
                    </div>
                    <div style={styles.feedbackMessage}>{feedback.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    transition: "margin-left 0.3s ease",
    backgroundColor: "#f7f7f7",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#333",
    margin: "0 0 16px 0",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #e0e0e0",
    marginTop: "8px",
  },
  tabButton: {
    background: "none",
    border: "none",
    padding: "12px 24px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#555",
    transition: "all 0.2s ease",
  },
  notification: {
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "500",
    animation: "fadeIn 0.3s ease-in-out",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    padding: "24px",
    maxWidth: "700px",
  },
  formContainer: {
    marginTop: "20px",
    width:"800px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
  },
  input: {
    width: "97%",
    padding: "10px 12px",
    fontSize: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    backgroundColor: "#f9f9f9",
    color: "#777",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    backgroundColor: "#fff",
  },
  textarea: {
    width: "97%",
    padding: "12px",
    height: "150px",
    fontSize: "15px",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  button: {
    padding: "12px 20px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
    alignSelf: "flex-start",
  },
  historyContainer: {
    marginTop: "20px",
  },
  feedbackCard: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    padding: "20px",
    marginBottom: "16px",
  },
  feedbackHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  feedbackUser: {
    fontWeight: "500",
    fontSize: "15px",
    color: "#333",
  },
  feedbackMeta: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  feedbackDate: {
    fontSize: "13px",
    color: "#777",
  },
  feedbackMessage: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#444",
    whiteSpace: "pre-wrap",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 0",
    color: "#777",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
};

export default Feedback;

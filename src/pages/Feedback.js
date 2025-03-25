import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import Sidebar from "../components/Sidebar";

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [userName, setUserName] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Suggestion");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Fetch logged-in user details
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.email);
    }

    // Fetch existing feedbacks from Firestore
    const fetchFeedbacks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "feedbacks"));
        const fetchedFeedbacks = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFeedbacks(fetchedFeedbacks);
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) {
      alert("Please enter your feedback.");
      return;
    }

    try {
      const newFeedback = {
        userName,
        message,
        category,
        date: new Date().toISOString().split("T")[0],
      };

      await addDoc(collection(db, "feedbacks"), newFeedback);
      setFeedbacks([...feedbacks, newFeedback]);

      setSuccessMessage("Feedback submitted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Reset form
      setMessage("");
      setCategory("Suggestion");
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        style={{
          ...styles.container,
          marginLeft: isSidebarOpen ? "260px" : "60px",
        }}
      >
        <h2 style={styles.title}>Feedback Page</h2>

        {successMessage && (
          <p style={styles.successMessage}>{successMessage}</p>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Your Name</label>
          <input
            type="text"
            value={userName}
            readOnly // Prevent editing
            style={styles.input}
          />

          <label style={styles.label}>Feedback Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.select}
          >
            <option value="Suggestion">Suggestion</option>
            <option value="Bug">Bug</option>
            <option value="Other">Other</option>
          </select>

          <label style={styles.label}>Your Feedback</label>
          <textarea
            placeholder="Write your feedback here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.textarea}
          ></textarea>

          <button type="submit" style={styles.button}>
            Submit Feedback
          </button>
        </form>

        <h3>Submitted Feedback</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Message</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback) => (
              <tr key={feedback.id}>
                <td style={styles.td}>{feedback.userName}</td>
                <td style={styles.td}>{feedback.message}</td>
                <td style={styles.td}>{feedback.category}</td>
                <td style={styles.td}>{feedback.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    transition: "margin-left 0.3s ease",
    width: "100%",
  },
  title: { marginBottom: "20px", color: "#333" },
  successMessage: { color: "green", fontWeight: "bold", marginBottom: "10px" },
  form: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "500px",
    marginBottom: "20px",
  },
  label: { marginBottom: "5px", fontWeight: "bold" },
  input: {
    padding: "10px",
    marginBottom: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#f0f0f0",
  },
  textarea: {
    padding: "10px",
    height: "100px",
    marginBottom: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  select: {
    padding: "10px",
    marginBottom: "10px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "5px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    borderRadius: "5px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    background: "#fff",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  th: {
    border: "1px solid #ddd",
    padding: "10px",
    background: "#f8f9fa",
    fontWeight: "bold",
  },
  td: { border: "1px solid #ddd", padding: "10px", textAlign: "center" },
};

export default Feedback;

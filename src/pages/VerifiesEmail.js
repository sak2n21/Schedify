import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const handleCheck = async () => {
    setChecking(true);
    await auth.currentUser.reload();

    if (auth.currentUser.emailVerified) {
      alert("Email verified successfully!");
      navigate("/dashboard");
    } else {
      alert("Email not verified yet. Please check your inbox.");
    }

    setChecking(false);
  };

  return (
    <div style={styles.container}>
      <h2>Email Verification</h2>
      <p>A verification link has been sent to your email.</p>
      <p>Please click the link and then press the button below:</p>
      <button onClick={handleCheck} disabled={checking} style={styles.button}>
        {checking ? "Checking..." : "I have verified"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    textAlign: "center",
  },
  button: {
    marginTop: "1rem",
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default VerifyEmail;

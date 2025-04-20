import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload(); // reload user data

      if (auth.currentUser?.emailVerified) {
        clearInterval(interval);
        alert("✅ Email verified successfully!");
        navigate("/");
      }

      setChecking(false);
    }, 3000); // check every 3 seconds

    return () => clearInterval(interval); // clean up on unmount
  }, [navigate]);

  return (
    <div style={styles.container}>
      <h2>Email Verification</h2>
      <p>A verification link has been sent to your email.</p>
      <p>Please click the link and we’ll redirect you once it's verified.</p>
      {checking && <p>⏳ Waiting for verification...</p>}
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

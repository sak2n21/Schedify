import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const VerifyMfa = () => {
  const [status, setStatus] = useState('verifying');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Check if current URL is a sign-in link
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setStatus('invalid');
          return;
        }

        // Get the email from localStorage
        let email = localStorage.getItem('emailForMfa');
        
        // If email not found, prompt user
        if (!email) {
          email = window.prompt('Please provide your email for confirmation:');
          if (!email) {
            setStatus('cancelled');
            return;
          }
        }
        
        // Complete the sign-in
        await signInWithEmailLink(auth, email, window.location.href);
        console.log("Email verification successful");
        
        // Get the user ID from URL parameters
        const params = new URLSearchParams(location.search);
        const uid = params.get('uid');
        
        if (uid) {
          // Update the user document to enable MFA
          await updateDoc(doc(db, "users", uid), {
            mfaEnabled: true,
            mfaSetupInProgress: false
          });
          
          // Clear the stored email
          localStorage.removeItem('emailForMfa');
          
          setStatus('success');
          
          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/manage-schedule');
          }, 3000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus('error');
      }
    };
    
    verifyEmail();
  }, [navigate, location]);
  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <h1 style={styles.logo}>SCHEDIFY</h1>
        </div>
        
        {status === 'verifying' && (
          <div style={styles.statusContainer}>
            <h2 style={styles.title}>Verifying your email...</h2>
            <p style={styles.message}>Please wait while we complete your verification.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div style={styles.statusContainer}>
            <h2 style={styles.title}>Verification Successful!</h2>
            <p style={styles.message}>
              Your multi-factor authentication has been successfully set up.
              You will be redirected to your dashboard shortly.
            </p>
          </div>
        )}
        
        {status === 'invalid' && (
          <div style={styles.statusContainer}>
            <h2 style={styles.title}>Invalid Verification Link</h2>
            <p style={styles.message}>
              This verification link is invalid or has expired.
              Please try logging in again to receive a new verification link.
            </p>
            <button 
              onClick={() => navigate('/')} 
              style={styles.button}
            >
              Return to Login
            </button>
          </div>
        )}
        
        {status === 'cancelled' && (
          <div style={styles.statusContainer}>
            <h2 style={styles.title}>Verification Cancelled</h2>
            <p style={styles.message}>
              You cancelled the verification process.
              Please try logging in again when you're ready.
            </p>
            <button 
              onClick={() => navigate('/')} 
              style={styles.button}
            >
              Return to Login
            </button>
          </div>
        )}
        
        {status === 'error' && (
          <div style={styles.statusContainer}>
            <h2 style={styles.title}>Verification Error</h2>
            <p style={styles.message}>
              There was an error during the verification process.
              Please try logging in again or contact support.
            </p>
            <button 
              onClick={() => navigate('/')} 
              style={styles.button}
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#f7f6f3",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    boxShadow:
      "rgba(15, 15, 15, 0.03) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 3px 6px, rgba(15, 15, 15, 0.05) 0px 9px 24px",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logo: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#37352f",
    margin: 0,
    letterSpacing: "0.5px",
  },
  statusContainer: {
    textAlign: "center",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#37352f",
    marginBottom: "16px",
  },
  message: {
    fontSize: "16px",
    color: "#6b6b6b",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  button: {
    backgroundColor: "#000000",
    color: "white",
    border: "none",
    borderRadius: "3px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default VerifyMfa;
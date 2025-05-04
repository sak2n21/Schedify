import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationCodeInput, ] =
    useState(false);
  const [, setCurrentUser] = useState(null);
  // const [expectedCode, setExpectedCode] = useState("");
  const googleProvider = new GoogleAuthProvider();

  const navigate = useNavigate();

  // // Generate a random 6-digit code
  // const generateRandomCode = () => {
  //   return Math.floor(100000 + Math.random() * 900000).toString();
  // };

  // Send verification email with OTP code
  // Change this function to accept a userId parameter instead of using currentUser
  // const sendVerificationEmail = async (userEmail, code, userId) => {
  //   try {
  //     if (!userId) {
  //       throw new Error("User ID is required");
  //     }

  //     // Store the code in Firestore using the passed userId
  //     await updateDoc(doc(db, "users", userId), {
  //       mfaCode: code,
  //       mfaCodeTimestamp: Date.now(),
  //     });

  //     // Rest of the function...
  //     alert(
  //       `Your verification code is ${code}`
  //     );

  //     return true;
  //   } catch (error) {
  //     console.error("Error sending verification email:", error);
  //     return false;
  //   }
  // };

  // // Handle verification code submission
  // const handleVerifyCode = async () => {
  //   try {
  //     setIsLoading(true);

  //     if (!currentUser) {
  //       setError("User session expired. Please log in again.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     // Get the stored code and timestamp from Firestore
  //     const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  //     const userData = userDoc.data();

  //     if (!userData.mfaCode) {
  //       setError("No verification code found. Please request a new code.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     // Check if code is expired (15 minutes)
  //     const codeTimestamp = userData.mfaCodeTimestamp;
  //     const currentTime = Date.now();
  //     const fifteenMinutesInMs = 15 * 60 * 1000;

  //     if (currentTime - codeTimestamp > fifteenMinutesInMs) {
  //       setError("Verification code has expired. Please request a new code.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     // Verify the code
  //     if (verificationCode === userData.mfaCode) {
  //       // Code is valid, mark MFA as complete
  //       await updateDoc(doc(db, "users", currentUser.uid), {
  //         mfaEnabled: true,
  //         mfaCode: null, // Clear the code
  //         mfaCodeTimestamp: null, // Clear the timestamp
  //       });

  //       setShowVerificationCodeInput(false);
  //       alert("Multi-factor authentication has been successfully completed!");

  //       navigate("/manage-schedule");
  //     } else {
  //       setError("Incorrect verification code. Please try again.");
  //     }
  //   } catch (error) {
  //     console.error("Verification error:", error);
  //     setError(`Failed to verify code: ${error.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // // Request a new verification code
  // const handleResendCode = async () => {
  //   try {
  //     setIsLoading(true);

  //     if (!currentUser) {
  //       setError("User session expired. Please log in again.");
  //       setIsLoading(false);
  //       return;
  //     }

  //     const newCode = generateRandomCode();
  //     const sent = await sendVerificationEmail(
  //       currentUser.email,
  //       newCode,
  //       currentUser.uid
  //     );

  //     if (sent) {
  //       setExpectedCode(newCode);
  //       alert("A new verification code has been sent to your email.");
  //     } else {
  //       setError("Failed to send verification code. Please try again.");
  //     }
  //   } catch (error) {
  //     console.error("Error resending code:", error);
  //     setError(`Failed to send new code: ${error.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  // Handle main login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Step 1: Sign in with email and password
      console.log("Attempting to sign in with email:", email);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setCurrentUser(user);
      console.log("Sign in successful, user ID:", user.uid);

      // Step 2: Check if email is verified
      if (!user.emailVerified) {
        console.log("Email not verified");
        setError("Please verify your email before logging in.");
        setIsLoading(false);
        return;
      }

      // Step 3: Get user info from Firestore
      console.log("Fetching user data from Firestore");
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log("User document not found in Firestore");
        setError("User not found in the database.");
        setIsLoading(false);
        return;
      }

      // const userData = userDoc.data();

      // // Step 4: Check if MFA is enabled for this user
      // if (userData.mfaEnabled) {
      //   // MFA is enabled, send verification code
      //   // Inside handleLogin, where you call sendVerificationEmail:
      //   const code = generateRandomCode();
      //   const sent = await sendVerificationEmail(user.email, code, user.uid); // Make sure to pass user.uid
      //   if (sent) {
      //     setExpectedCode(code);
      //     setShowVerificationCodeInput(true);
      //     setIsLoading(false);
      //     return;
      //   } else {
      //     setError("Failed to send verification code. Please try again.");
      //     setIsLoading(false);
      //     return;
      //   }
      // } else {
      //   // Check if this is first login or if MFA should be enabled
      //   const shouldEnableMfa = window.confirm(
      //     "Would you like to enable multi-factor authentication for better security?"
      //   );

      //   if (shouldEnableMfa) {
      //     // Generate and send verification code
      //     const code = generateRandomCode();
      //     const sent = await sendVerificationEmail(user.email, code, user.uid);

      //     if (sent) {
      //       setExpectedCode(code);
      //       setShowVerificationCodeInput(true);
      //       setIsLoading(false);
      //       return;
      //     } else {
      //       setError("Failed to send verification code. Please try again.");
      //       setIsLoading(false);
      //       return;
      //     }
      //   }
      // }

      // No MFA required or user declined, proceed to dashboard
      console.log("Login successful, navigating to dashboard");
      navigate("/manage-schedule");
    } catch (error) {
      console.error("Login Error:", error);

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError(error.message.replace("Firebase: ", ""));
      }

      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }

    setIsLoading(true);
    try {
      // Create action code settings with redirect URL
      const actionCodeSettings = {
        url: window.location.origin + "/", // This will direct back to your login page
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      alert(
        "Password reset email sent! Please check your inbox and spam folder."
      );
    } catch (error) {
      setError(error.message.replace("Firebase: ", ""));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Save user to Firestore if it's their first time logging in
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
      });

      alert("Signed in successfully with Google!");
      navigate("/dashboard"); // Change this to your desired landing page
    } catch (error) {
      console.error("Google Sign-In Error:", error.message);
      setError("Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.background}>
      <div style={styles.container}>
        <div style={styles.formPanel}>
          <div style={styles.logoContainer}>
            <h1 style={styles.logo}>SCHEDIFY</h1>
          </div>

          <div style={styles.formContainer}>
            <h2 style={styles.title}>Sign in</h2>
            <p style={styles.subtitle}>to continue to your workspace</p>

            {error && (
              <div style={styles.errorContainer}>
                <p style={styles.errorText}>{error}</p>
              </div>
            )}

            {showVerificationCodeInput ? (
              <div style={styles.verificationContainer}>
                <h3 style={styles.verificationTitle}>
                  Enter Verification Code
                </h3>
                <p style={styles.verificationText}>
                  Please enter the 6-digit code sent to your email:
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  style={styles.input}
                />
                {/* <div style={styles.verificationButtonsContainer}>
                  <button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || isLoading}
                    style={
                      isLoading || verificationCode.length !== 6
                        ? { ...styles.button, ...styles.buttonLoading }
                        : styles.button
                    }
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </button>
                  <button
                    onClick={handleResendCode}
                    style={styles.secondaryButton}
                    disabled={isLoading}
                  >
                    Resend Code
                  </button>
                  <button
                    onClick={() => {
                      setShowVerificationCodeInput(false);
                      setError(
                        "Verification canceled. You can try again later."
                      );
                    }}
                    style={styles.cancelButton}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div> */}
              </div>
            ) : (
              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label htmlFor="email" style={styles.label}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="name@example.com"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label htmlFor="password" style={styles.label}>
                    Password
                  </label>
                  <div style={styles.passwordInputContainer}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={styles.passwordInput}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      style={styles.passwordToggle}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div style={styles.forgotPasswordContainer}>
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    style={styles.forgotPasswordLink}
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  style={
                    isLoading
                      ? { ...styles.button, ...styles.buttonLoading }
                      : styles.button
                  }
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            )}

            {!showVerificationCodeInput && (
              <>
                <div style={styles.divider}>
                  <span style={styles.dividerLine}></span>
                  <span style={styles.dividerText}>or</span>
                  <span style={styles.dividerLine}></span>
                </div>

                <Link to="/signup" style={styles.createAccountButton}>
                  Create new account
                </Link>

                <button
                  onClick={handleGoogleSignIn}
                  style={styles.googleButton}
                >
                  Continue with Google
                </button>
              </>
            )}
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              © 2025 SCHEDIFY. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  background: {
    backgroundColor: "#f7f6f3",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  },
  container: {
    maxWidth: "480px",
    width: "100%",
    minHeight: "500px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow:
      "rgba(15, 15, 15, 0.03) 0px 0px 0px 1px, rgba(15, 15, 15, 0.04) 0px 3px 6px, rgba(15, 15, 15, 0.05) 0px 9px 24px",
    backgroundColor: "white",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
    paddingTop: "40px",
  },
  logo: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#37352f",
    margin: 0,
    letterSpacing: "0.5px",
  },
  formPanel: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    height: "100%",
    backgroundColor: "white",
  },
  formContainer: {
    padding: "0 40px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#37352f",
    marginBottom: "4px",
    marginTop: 0,
    textAlign: "center",
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b6b6b",
    marginBottom: "32px",
    textAlign: "center",
    marginTop: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#6b6b6b",
  },
  input: {
    padding: "8px 10px",
    borderRadius: "3px",
    border: "1px solid #e6e6e6",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  passwordInputContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    padding: "8px 10px",
    borderRadius: "3px",
    border: "1px solid #e6e6e6",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    paddingRight: "60px", // Space for the show/hide button
  },
  passwordToggle: {
    position: "absolute",
    top: "50%",
    right: "8px",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#6b6b6b",
    fontSize: "12px",
    cursor: "pointer",
    padding: "2px 5px",
    fontWeight: "500",
  },
  forgotPasswordContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "-5px",
  },
  forgotPasswordLink: {
    fontSize: "12px",
    color: "#6b6b6b",
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.2s",
  },
  button: {
    backgroundColor: "#000000",
    color: "white",
    border: "none",
    borderRadius: "3px",
    padding: "8px 14px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "10px",
  },
  buttonLoading: {
    backgroundColor: "#333333",
    cursor: "not-allowed",
  },
  secondaryButton: {
    backgroundColor: "#f1f1f1",
    color: "#333",
    border: "none",
    borderRadius: "3px",
    padding: "8px 14px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    margin: "24px 0",
    gap: "12px",
  },
  dividerLine: {
    flex: "1",
    height: "1px",
    backgroundColor: "#e6e6e6",
  },
  dividerText: {
    color: "#6b6b6b",
    fontSize: "12px",
    fontWeight: "500",
  },
  createAccountButton: {
    display: "block",
    width: "100%",
    padding: "8px 14px",
    backgroundColor: "transparent",
    color: "#37352f",
    border: "1px solid #e6e6e6",
    borderRadius: "3px",
    textAlign: "center",
    fontWeight: "500",
    textDecoration: "none",
    fontSize: "14px",
    transition: "background-color 0.2s",
    boxSizing: "border-box",
  },
  errorContainer: {
    backgroundColor: "rgba(235, 87, 87, 0.1)",
    border: "1px solid rgba(235, 87, 87, 0.2)",
    borderRadius: "3px",
    padding: "8px 12px",
    marginBottom: "16px",
  },
  errorText: {
    color: "#eb5757",
    fontSize: "13px",
    margin: 0,
  },
  footer: {
    textAlign: "center",
    padding: "20px 0",
    borderTop: "1px solid #f1f1f1",
    marginTop: "40px",
  },
  footerText: {
    fontSize: "12px",
    color: "#6b6b6b",
    margin: 0,
  },
  googleButton: {
    backgroundColor: "#ffffff",
    color: "#000",
    border: "1px solid #ddd",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
    marginTop: "10px",
  },
  verificationContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  verificationTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#37352f",
    marginBottom: "4px",
    marginTop: 0,
  },
  verificationText: {
    fontSize: "14px",
    color: "#6b6b6b",
    marginBottom: "16px",
    marginTop: 0,
  },
  verificationButtonsContainer: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  cancelButton: {
    backgroundColor: "transparent",
    color: "#6b6b6b",
    border: "1px solid #e6e6e6",
    borderRadius: "3px",
    padding: "8px 14px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
};

export default Login;

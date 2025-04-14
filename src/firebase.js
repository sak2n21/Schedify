import { initializeApp } from "firebase/app";
import { getAuth ,sendEmailVerification} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBz6buYaBQwi6cyvqXbjdaLF1Cag6EG-IE",
  authDomain: "appointmentapplication-9c371.firebaseapp.com",
  projectId: "appointmentapplication-9c371",
  storageBucket: "appointmentapplication-9c371.appspot.com", // Fixed storage bucket
  messagingSenderId: "191339301810",
  appId: "1:191339301810:web:207112751a774ec8efb2ab",
  measurementId: "G-2JTK3NC9ZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, sendEmailVerification};
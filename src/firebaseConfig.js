import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration


const firebaseConfig = {
  apiKey: "AIzaSyCuUwe4JjbXgChbSUeSLLV1WwJYfTasxwM",
  authDomain: "interview-gpt-8807d.firebaseapp.com",
  projectId: "interview-gpt-8807d",
  storageBucket: "interview-gpt-8807d.firebasestorage.app",
  messagingSenderId: "263072294695",
  appId: "1:263072294695:web:deeff1a04a0cefc29f6b02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore instance
export const db = getFirestore(app);






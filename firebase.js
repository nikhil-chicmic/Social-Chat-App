import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSkYJSxYMwziBu5g_y5kntKuvlf5RCFew",
  authDomain: "fir-project-7d5a4.firebaseapp.com",
  projectId: "fir-project-7d5a4",
  storageBucket: "fir-project-7d5a4.firebasestorage.app",
  messagingSenderId: "5431749753",
  appId: "1:5431749753:web:ba3ab68054ebb60e5638a8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

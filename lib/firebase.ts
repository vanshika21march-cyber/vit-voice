import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTnkOYjUTdXVtbvIP5HLUh4opV_FUfiPI",
  authDomain: "problem2project-vit.firebaseapp.com",
  projectId: "problem2project-vit",
  storageBucket: "problem2project-vit.firebasestorage.app",
  messagingSenderId: "785244698981",
  appId: "1:785244698981:web:e22312f72dd28fdc9f498c",
  measurementId: "G-5DGL8SLQXZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

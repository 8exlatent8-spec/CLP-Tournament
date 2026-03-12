import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGbJD8vBio57JnIetAQ0h8HO0JB39ct_0",
  authDomain: "claped-91d06.firebaseapp.com",
  projectId: "claped-91d06",
  storageBucket: "claped-91d06.firebasestorage.app",
  messagingSenderId: "520079791634",
  appId: "1:520079791634:web:126f243072437ede60aacb"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const database = getFirestore(app);
export const auth = getAuth(app)
// export const analytics = () => getAnalytics(app);

export default app
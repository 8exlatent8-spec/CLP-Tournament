import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/backend/Firebase";

export async function adminLogin(password) {
  await signInWithEmailAndPassword(auth, "admin@gmail.com", password);
}

export async function adminLogout() {
  await signOut(auth);
}
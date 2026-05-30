import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createUserDoc = async (uid, { displayName }) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
  displayName: displayName,
  createdAt: serverTimestamp(),
  currentStreak: 0,
  bestStreak: 0,
  lastCheckIn: null,
  badges: [],
  urges: [],
}, { merge: true });
};
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const createUserDoc = async (uid, { displayName }) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: displayName,
      createdAt: serverTimestamp(),
      currentStreak: 0,
      bestStreak: 0,
      lastCheckIn: null,
      badges: [],
      urges: [],
    });
  } else {
    await updateDoc(userRef, {
      lastCheckIn: serverTimestamp(),
    });
  }
};
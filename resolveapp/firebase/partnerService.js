import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export async function connectPartner(code, setConnected) {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const partnerRef = doc(db, "users", code);
    const partnerSnap = await getDoc(partnerRef);

    if (!partnerSnap.exists()) {
      console.log("Invalid partner code");
      return false;
    }

    await setDoc(doc(db, "users", user.uid), { partnerCode: code }, { merge: true });

    setConnected(code);
    return true;

  } catch (e) {
    console.error(e);
    return false;
  }
}

import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

export async function getThreadData(setThreads) {
  // fetch from Firestore OR your local threads array
}

export async function addForumPost(threadId, text, reset) {
  const user = auth.currentUser;
  if (!user) return;

  const newPost = {
    id: "p" + Date.now(),
    text,
    upvotes: 0,
    replies: [],
    createdAt: serverTimestamp(),
    userId: user.uid,
  };

  await setDoc(
    doc(db, "threads", threadId),
    { posts: arrayUnion(newPost) },
    { merge: true }
  );

  reset("");
}

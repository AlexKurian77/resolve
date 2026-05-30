import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '473284279604-6s58jt5jmrvak34g9o1thfs2feccprt2.apps.googleusercontent.com',
});

export const signUp = async (email, password) => {
  return await createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signInWithGoogle = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  
  try {
    // Sign out from local Google session to force the account chooser every time
    await GoogleSignin.signOut();
  } catch (e) {
    // Ignore if not previously signed in
  }
  
  const response = await GoogleSignin.signIn();
  
  // v16+ returns response.data.idToken, older versions return response.idToken
  const idToken = response?.data?.idToken || response?.idToken;
  
  if (!idToken) throw new Error("Google Sign-In failed: No ID token returned");
  
  const googleCredential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, googleCredential);
};
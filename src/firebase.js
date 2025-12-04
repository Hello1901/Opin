// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDIOKsNlkgdsnPmOuMZKh_t9G_-PUTCDpk",
    authDomain: "opin-voting.firebaseapp.com",
    projectId: "opin-voting",
    storageBucket: "opin-voting.firebasestorage.app",
    messagingSenderId: "161636127648",
    appId: "1:161636127648:web:b9fc135d43f2ad3c914ac5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence based on user preference
export async function setAuthPersistence(keepLoggedIn) {
    const persistence = keepLoggedIn ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
}

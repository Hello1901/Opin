// Authentication Module
import { auth, setAuthPersistence } from './firebase.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

/**
 * Register a new user and automatically log them in
 */
export async function register(email, password, keepLoggedIn = false) {
    await setAuthPersistence(keepLoggedIn);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Log in an existing user
 */
export async function login(email, password, keepLoggedIn = false) {
    await setAuthPersistence(keepLoggedIn);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Log out the current user
 */
export async function logout() {
    await signOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return auth.currentUser;
}

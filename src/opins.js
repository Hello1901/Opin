// Opins Management Module
import { db } from './firebase.js';
import { getCurrentUser } from './auth.js';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';

const OPINS_COLLECTION = 'opins';

/**
 * Generate a unique 8-character link ID
 */
function generateLinkId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Create a new Opin
 */
export async function createOpin({ name, question, options, expiresAt, multiSelect, maxSelections, anonymous }) {
    const user = getCurrentUser();
    if (!user) throw new Error('You must be logged in to create an Opin');

    const linkId = generateLinkId();

    const opinData = {
        name,
        question,
        options, // Array of option strings
        expiresAt: Timestamp.fromDate(new Date(expiresAt)),
        multiSelect: multiSelect || false,
        maxSelections: multiSelect ? (maxSelections || 1) : 1,
        anonymous: anonymous || false,
        status: 'active', // active, paused, ended
        creatorId: user.uid,
        creatorEmail: user.email,
        linkId,
        createdAt: serverTimestamp(),
        votes: {} // Map of optionIndex -> vote count
    };

    // Initialize vote counts
    options.forEach((_, index) => {
        opinData.votes[index] = 0;
    });

    const docRef = await addDoc(collection(db, OPINS_COLLECTION), opinData);
    return { id: docRef.id, linkId };
}

/**
 * Get all Opins created by the current user
 */
export async function getMyOpins() {
    const user = getCurrentUser();
    if (!user) return [];

    const q = query(
        collection(db, OPINS_COLLECTION),
        where('creatorId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    const opins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort client-side by createdAt descending
    return opins.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
    });
}

/**
 * Get an Opin by its link ID (for voting page)
 */
export async function getOpinByLinkId(linkId) {
    const q = query(
        collection(db, OPINS_COLLECTION),
        where('linkId', '==', linkId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

/**
 * Get an Opin by its document ID
 */
export async function getOpinById(id) {
    const docRef = doc(db, OPINS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
}

/**
 * Pause an Opin
 */
export async function pauseOpin(id) {
    const user = getCurrentUser();
    const opin = await getOpinById(id);

    if (!opin) throw new Error('Opin not found');
    if (opin.creatorId !== user.uid) throw new Error('You can only pause your own Opins');
    if (opin.status === 'ended') throw new Error('Cannot pause an ended Opin');

    await updateDoc(doc(db, OPINS_COLLECTION, id), {
        status: 'paused'
    });
}

/**
 * Reactivate a paused Opin
 */
export async function reactivateOpin(id) {
    const user = getCurrentUser();
    const opin = await getOpinById(id);

    if (!opin) throw new Error('Opin not found');
    if (opin.creatorId !== user.uid) throw new Error('You can only reactivate your own Opins');
    if (opin.status !== 'paused') throw new Error('Only paused Opins can be reactivated');

    await updateDoc(doc(db, OPINS_COLLECTION, id), {
        status: 'active'
    });
}

/**
 * End an Opin permanently
 */
export async function endOpin(id) {
    const user = getCurrentUser();
    const opin = await getOpinById(id);

    if (!opin) throw new Error('Opin not found');
    if (opin.creatorId !== user.uid) throw new Error('You can only end your own Opins');

    await updateDoc(doc(db, OPINS_COLLECTION, id), {
        status: 'ended'
    });
}

/**
 * Check and auto-end expired Opins
 */
export async function checkExpiredOpins() {
    const user = getCurrentUser();
    if (!user) return;

    const now = Timestamp.now();

    // Get all user's opins and filter client-side to avoid needing composite index
    const q = query(
        collection(db, OPINS_COLLECTION),
        where('creatorId', '==', user.uid)
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Check if active/paused and expired
        if ((data.status === 'active' || data.status === 'paused') &&
            data.expiresAt && data.expiresAt.toMillis() < now.toMillis()) {
            await updateDoc(doc(db, OPINS_COLLECTION, docSnap.id), {
                status: 'ended'
            });
        }
    }
}

/**
 * Get the share URL for an Opin
 */
export function getShareUrl(linkId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/vote/${linkId}`;
}

/**
 * Get the graph share URL for an Opin
 */
export function getGraphShareUrl(linkId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/graph/${linkId}`;
}

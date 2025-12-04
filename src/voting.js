// Voting Module
import { db } from './firebase.js';
import { getCurrentUser } from './auth.js';
import { getOpinById } from './opins.js';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    updateDoc,
    query,
    where,
    increment
} from 'firebase/firestore';

const VOTES_COLLECTION = 'votes';
const OPINS_COLLECTION = 'opins';

/**
 * Submit a vote for an Opin
 * @param {string} opinId - The Opin document ID
 * @param {number[]} selectedOptions - Array of selected option indices
 */
export async function submitVote(opinId, selectedOptions) {
    const user = getCurrentUser();
    if (!user) throw new Error('You must be logged in to vote');

    const opin = await getOpinById(opinId);
    if (!opin) throw new Error('Opin not found');
    if (opin.status !== 'active') throw new Error('This Opin is not accepting votes');

    // Check if user already voted
    const hasVoted = await hasUserVoted(opinId);
    if (hasVoted) throw new Error('You have already voted on this Opin');

    // Validate selections
    if (selectedOptions.length === 0) {
        throw new Error('Please select at least one option');
    }

    if (!opin.multiSelect && selectedOptions.length > 1) {
        throw new Error('You can only select one option');
    }

    if (opin.multiSelect && selectedOptions.length > opin.maxSelections) {
        throw new Error(`You can select at most ${opin.maxSelections} options`);
    }

    // Record the vote
    await addDoc(collection(db, VOTES_COLLECTION), {
        opinId,
        oderId: user.uid,
        voterEmail: user.email,
        selectedOptions,
        votedAt: new Date()
    });

    // Update vote counts on the Opin
    const updates = {};
    selectedOptions.forEach(optionIndex => {
        updates[`votes.${optionIndex}`] = increment(1);
    });

    await updateDoc(doc(db, OPINS_COLLECTION, opinId), updates);
}

/**
 * Check if the current user has already voted on an Opin
 */
export async function hasUserVoted(opinId) {
    const user = getCurrentUser();
    if (!user) return false;

    const q = query(
        collection(db, VOTES_COLLECTION),
        where('opinId', '==', opinId),
        where('oderId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

/**
 * Get all votes for an Opin (for graph display)
 */
export async function getVotes(opinId) {
    const q = query(
        collection(db, VOTES_COLLECTION),
        where('opinId', '==', opinId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get vote counts and voter emails per option
 */
export async function getVoteDetails(opinId) {
    const opin = await getOpinById(opinId);
    if (!opin) return null;

    const votes = await getVotes(opinId);

    // Organize votes by option
    const optionDetails = opin.options.map((optionText, index) => {
        const votersForOption = votes
            .filter(vote => vote.selectedOptions.includes(index))
            .map(vote => vote.voterEmail);

        return {
            text: optionText,
            count: opin.votes[index] || 0,
            voters: opin.anonymous ? [] : votersForOption
        };
    });

    return {
        opin,
        options: optionDetails,
        totalVotes: votes.length
    };
}

// Main Application Entry Point
import './style.css';
import { register, login, logout, onAuthChange, getCurrentUser } from './auth.js';
import {
    createOpin,
    getMyOpins,
    pauseOpin,
    reactivateOpin,
    endOpin,
    checkExpiredOpins,
    getOpinByLinkId,
    getOpinById,
    getShareUrl,
    getGraphShareUrl
} from './opins.js';
import { submitVote, hasUserVoted, getVoteDetails } from './voting.js';
import { drawGraph, renderVoterDropdowns, exportPNG, exportJPG, exportExcel, exportGoogleSheets } from './graph.js';
import { notify } from './notifications.js';
import { showLoader, hideLoader, withLoader } from './loader.js';

// DOM Elements
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const voteSection = document.getElementById('vote-section');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const createOpinBtn = document.getElementById('create-opin-btn');

const activeOpinsList = document.getElementById('active-opins-list');
const endedOpinsList = document.getElementById('ended-opins-list');

// Modals
const createModal = document.getElementById('create-modal');
const shareModal = document.getElementById('share-modal');
const graphModal = document.getElementById('graph-modal');

// Current state
let currentOpins = [];
let currentGraphOpin = null;

// ============================================
// Routing
// ============================================
function getRoute() {
    const path = window.location.pathname;

    // Check for vote route: /vote/{linkId}
    const voteMatch = path.match(/^\/vote\/([a-zA-Z0-9]+)$/);
    if (voteMatch) {
        return { type: 'vote', linkId: voteMatch[1] };
    }

    // Check for graph route: /graph/{linkId}
    const graphMatch = path.match(/^\/graph\/([a-zA-Z0-9]+)$/);
    if (graphMatch) {
        return { type: 'graph', linkId: graphMatch[1] };
    }

    return { type: 'main' };
}

async function handleRoute() {
    const route = getRoute();

    if (route.type === 'vote') {
        await handleVoteRoute(route.linkId);
    } else if (route.type === 'graph') {
        await handleGraphRoute(route.linkId);
    }
    // Main route is handled by auth state
}

async function handleVoteRoute(linkId) {
    showLoader();

    try {
        const opin = await getOpinByLinkId(linkId);

        if (!opin) {
            hideLoader();
            authSection.classList.add('hidden');
            mainSection.classList.add('hidden');
            voteSection.classList.remove('hidden');
            document.getElementById('vote-title').textContent = 'Opin Not Found';
            document.getElementById('vote-question').textContent = 'This voting link is invalid or has been removed.';
            document.getElementById('vote-form').classList.add('hidden');
            return;
        }

        // Wait for auth state
        onAuthChange(async (user) => {
            hideLoader();

            if (!user) {
                // Show login, then redirect back
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                authSection.classList.remove('hidden');
                mainSection.classList.add('hidden');
                voteSection.classList.add('hidden');
                notify.info('Please log in to vote');
                return;
            }

            await renderVotePage(opin);
        });
    } catch (error) {
        hideLoader();
        notify.error('Failed to load voting page');
        console.error(error);
    }
}

async function handleGraphRoute(linkId) {
    // For now, redirect to main and show graph modal
    // This is a simplified implementation
    window.location.href = '/';
}

async function renderVotePage(opin) {
    authSection.classList.add('hidden');
    mainSection.classList.add('hidden');
    voteSection.classList.remove('hidden');

    document.getElementById('vote-title').textContent = opin.name;
    document.getElementById('vote-question').textContent = opin.question;

    const statusMessage = document.getElementById('vote-status-message');
    const voteForm = document.getElementById('vote-form');
    const alreadyVoted = document.getElementById('already-voted-message');

    // Check status
    if (opin.status === 'paused') {
        statusMessage.textContent = 'This Opin is currently paused. Please check back later.';
        statusMessage.className = 'vote-status-message paused';
        statusMessage.classList.remove('hidden');
        voteForm.classList.add('hidden');
        alreadyVoted.classList.add('hidden');
        return;
    }

    if (opin.status === 'ended') {
        statusMessage.textContent = 'This Opin has ended and is no longer accepting votes.';
        statusMessage.className = 'vote-status-message ended';
        statusMessage.classList.remove('hidden');
        voteForm.classList.add('hidden');
        alreadyVoted.classList.add('hidden');
        return;
    }

    // Check if already voted
    const voted = await hasUserVoted(opin.id);
    if (voted) {
        statusMessage.classList.add('hidden');
        voteForm.classList.add('hidden');
        alreadyVoted.classList.remove('hidden');
        return;
    }

    statusMessage.classList.add('hidden');
    voteForm.classList.remove('hidden');
    alreadyVoted.classList.add('hidden');

    // Render options
    const optionsContainer = document.getElementById('vote-options');
    optionsContainer.innerHTML = '';

    const inputType = opin.multiSelect ? 'checkbox' : 'radio';

    opin.options.forEach((optionText, index) => {
        const label = document.createElement('label');
        label.className = 'vote-option';
        label.innerHTML = `
      <input type="${inputType}" name="vote-option" value="${index}">
      <span>${optionText}</span>
    `;

        label.addEventListener('click', () => {
            if (!opin.multiSelect) {
                document.querySelectorAll('.vote-option').forEach(el => el.classList.remove('selected'));
            }
            label.classList.toggle('selected');

            // Check max selections for multi-select
            if (opin.multiSelect) {
                const selected = document.querySelectorAll('.vote-option.selected');
                if (selected.length > opin.maxSelections) {
                    label.classList.remove('selected');
                    label.querySelector('input').checked = false;
                    notify.warning(`You can only select up to ${opin.maxSelections} options`);
                }
            }
        });

        optionsContainer.appendChild(label);
    });

    // Handle vote submission
    voteForm.onsubmit = async (e) => {
        e.preventDefault();

        const selected = Array.from(document.querySelectorAll('.vote-option.selected input'))
            .map(input => parseInt(input.value));

        if (selected.length === 0) {
            notify.warning('Please select at least one option');
            return;
        }

        try {
            await withLoader(async () => {
                await submitVote(opin.id, selected);
            });
            notify.success('Your vote has been submitted!');
            voteForm.classList.add('hidden');
            alreadyVoted.classList.remove('hidden');
        } catch (error) {
            notify.error(error.message);
        }
    };
}

// ============================================
// Authentication
// ============================================
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const keepLoggedIn = document.getElementById('keep-logged-in').checked;

    try {
        await withLoader(async () => {
            await login(email, password, keepLoggedIn);
        });
        notify.success('Welcome back!');
    } catch (error) {
        notify.error(getAuthErrorMessage(error.code));
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    if (password !== confirm) {
        notify.error('Passwords do not match');
        return;
    }

    try {
        await withLoader(async () => {
            await register(email, password, true);
        });
        notify.success('Account created successfully!');
    } catch (error) {
        notify.error(getAuthErrorMessage(error.code));
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await logout();
        notify.info('You have been logged out');
    } catch (error) {
        notify.error('Failed to log out');
    }
});

function getAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-credential': 'Invalid email or password'
    };
    return messages[code] || 'An error occurred. Please try again.';
}

// ============================================
// Auth State Listener
// ============================================
onAuthChange(async (user) => {
    const route = getRoute();

    // If on vote page, let that handler deal with it
    if (route.type === 'vote') {
        return;
    }

    if (user) {
        // Check for redirect
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect) {
            sessionStorage.removeItem('redirectAfterLogin');
            window.location.href = redirect;
            return;
        }

        authSection.classList.add('hidden');
        mainSection.classList.remove('hidden');
        voteSection.classList.add('hidden');
        userEmailSpan.textContent = user.email;

        // Load opins and check for expired ones
        await loadOpins();

        // Start expiration check interval
        setInterval(async () => {
            await checkExpiredOpins();
            await loadOpins();
        }, 60000); // Check every minute
    } else {
        authSection.classList.remove('hidden');
        mainSection.classList.add('hidden');
        voteSection.classList.add('hidden');
    }
});

// ============================================
// Load and Render Opins
// ============================================
async function loadOpins() {
    try {
        await checkExpiredOpins();
        currentOpins = await getMyOpins();
        renderOpins();
    } catch (error) {
        notify.error('Failed to load your Opins');
        console.error(error);
    }
}

function renderOpins() {
    const activeOpins = currentOpins.filter(o => o.status === 'active' || o.status === 'paused');
    const endedOpins = currentOpins.filter(o => o.status === 'ended');

    // Render active/paused
    if (activeOpins.length === 0) {
        activeOpinsList.innerHTML = '<p class="empty-message">No active Opins yet. Create one to get started!</p>';
    } else {
        activeOpinsList.innerHTML = activeOpins.map(opin => createOpinCard(opin, false)).join('');
        attachOpinCardListeners(activeOpinsList);
    }

    // Render ended
    if (endedOpins.length === 0) {
        endedOpinsList.innerHTML = '<p class="empty-message">No ended Opins yet.</p>';
    } else {
        endedOpinsList.innerHTML = endedOpins.map(opin => createOpinCard(opin, true)).join('');
        attachOpinCardListeners(endedOpinsList);
    }
}

function createOpinCard(opin, isEnded) {
    const expiresAt = opin.expiresAt?.toDate?.() || new Date(opin.expiresAt);
    const formattedDate = expiresAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusClass = opin.status;
    const statusText = opin.status.charAt(0).toUpperCase() + opin.status.slice(1);

    let actions = '';

    if (isEnded) {
        actions = `
      <button class="btn btn-secondary btn-small btn-graph" data-id="${opin.id}">📊 Graph</button>
    `;
    } else {
        const pauseBtn = opin.status === 'paused'
            ? `<button class="btn btn-success btn-small btn-reactivate" data-id="${opin.id}">▶ Reactivate</button>`
            : `<button class="btn btn-warning btn-small btn-pause" data-id="${opin.id}">⏸ Pause</button>`;

        actions = `
      <span class="opin-status ${statusClass}">${statusText}</span>
      ${pauseBtn}
      <button class="btn btn-danger btn-small btn-end" data-id="${opin.id}">⏹ End</button>
      <button class="btn btn-secondary btn-small btn-graph" data-id="${opin.id}">📊 Graph</button>
      <button class="btn btn-secondary btn-small btn-share" data-id="${opin.id}" data-link="${opin.linkId}">🔗 Share</button>
    `;
    }

    return `
    <div class="opin-card" data-id="${opin.id}">
      <div class="opin-info">
        <div class="opin-name">${escapeHtml(opin.name)}</div>
        <div class="opin-meta">Expires: ${formattedDate} • ${Object.values(opin.votes).reduce((a, b) => a + b, 0)} votes</div>
      </div>
      <div class="opin-actions">
        ${actions}
      </div>
    </div>
  `;
}

function attachOpinCardListeners(container) {
    // Pause buttons
    container.querySelectorAll('.btn-pause').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            try {
                await withLoader(async () => {
                    await pauseOpin(id);
                    await loadOpins();
                });
                notify.success('Opin paused');
            } catch (error) {
                notify.error(error.message);
            }
        });
    });

    // Reactivate buttons
    container.querySelectorAll('.btn-reactivate').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            try {
                await withLoader(async () => {
                    await reactivateOpin(id);
                    await loadOpins();
                });
                notify.success('Opin reactivated');
            } catch (error) {
                notify.error(error.message);
            }
        });
    });

    // End buttons
    container.querySelectorAll('.btn-end').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (confirm('Are you sure you want to end this Opin? This cannot be undone.')) {
                try {
                    await withLoader(async () => {
                        await endOpin(id);
                        await loadOpins();
                    });
                    notify.success('Opin ended');
                } catch (error) {
                    notify.error(error.message);
                }
            }
        });
    });

    // Share buttons
    container.querySelectorAll('.btn-share').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const linkId = btn.dataset.link;
            showShareModal(linkId);
        });
    });

    // Graph buttons
    container.querySelectorAll('.btn-graph').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await showGraphModal(id);
        });
    });
}

// ============================================
// Create Opin Modal
// ============================================
createOpinBtn.addEventListener('click', () => {
    createModal.classList.remove('hidden');
    resetCreateForm();
});

document.getElementById('close-create-modal').addEventListener('click', () => {
    createModal.classList.add('hidden');
});

createModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    createModal.classList.add('hidden');
});

// Add option button
document.getElementById('add-option-btn').addEventListener('click', () => {
    const container = document.getElementById('options-container');
    const optionCount = container.children.length + 1;

    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
    <input type="text" class="option-input" required placeholder="Option ${optionCount}">
    <button type="button" class="btn-remove">✕</button>
  `;

    row.querySelector('.btn-remove').addEventListener('click', () => {
        if (container.children.length > 2) {
            row.remove();
        } else {
            notify.warning('You need at least 2 options');
        }
    });

    container.appendChild(row);
});

// Multi-select toggle
document.getElementById('multi-select-toggle').addEventListener('change', (e) => {
    const maxContainer = document.getElementById('max-selections-container');
    if (e.target.checked) {
        maxContainer.classList.remove('hidden');
    } else {
        maxContainer.classList.add('hidden');
    }
});

// Create Opin form submission
document.getElementById('create-opin-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('opin-name').value.trim();
    const expiration = document.getElementById('opin-expiration').value;
    const question = document.getElementById('opin-question').value.trim();
    const multiSelect = document.getElementById('multi-select-toggle').checked;
    const maxSelections = parseInt(document.getElementById('max-selections').value) || 1;
    const anonymous = document.getElementById('anonymous-toggle').checked;

    // Get options
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs).map(input => input.value.trim()).filter(v => v);

    if (options.length < 2) {
        notify.warning('Please add at least 2 options');
        return;
    }

    // Validate expiration is in the future
    if (new Date(expiration) <= new Date()) {
        notify.warning('Expiration date must be in the future');
        return;
    }

    try {
        const result = await withLoader(async () => {
            return await createOpin({
                name,
                question,
                options,
                expiresAt: expiration,
                multiSelect,
                maxSelections,
                anonymous
            });
        });

        notify.success('Opin created successfully!');
        createModal.classList.add('hidden');
        showShareModal(result.linkId);
        await loadOpins();
    } catch (error) {
        notify.error(error.message);
    }
});

function resetCreateForm() {
    document.getElementById('create-opin-form').reset();
    document.getElementById('max-selections-container').classList.add('hidden');

    const container = document.getElementById('options-container');
    container.innerHTML = `
    <div class="option-row">
      <input type="text" class="option-input" required placeholder="Option 1">
    </div>
    <div class="option-row">
      <input type="text" class="option-input" required placeholder="Option 2">
    </div>
  `;

    // Set default expiration to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('opin-expiration').value = tomorrow.toISOString().slice(0, 16);
}

// ============================================
// Share Modal
// ============================================
function showShareModal(linkId) {
    shareModal.classList.remove('hidden');
    const shareUrl = getShareUrl(linkId);
    document.getElementById('share-link-input').value = shareUrl;
}

document.getElementById('close-share-modal').addEventListener('click', () => {
    shareModal.classList.add('hidden');
});

shareModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    shareModal.classList.add('hidden');
});

document.getElementById('copy-link-btn').addEventListener('click', async () => {
    const input = document.getElementById('share-link-input');
    try {
        await navigator.clipboard.writeText(input.value);
        notify.success('Link copied to clipboard!');
    } catch {
        input.select();
        document.execCommand('copy');
        notify.success('Link copied to clipboard!');
    }
});

// ============================================
// Graph Modal
// ============================================
async function showGraphModal(opinId) {
    graphModal.classList.remove('hidden');

    const opin = currentOpins.find(o => o.id === opinId);
    currentGraphOpin = opin;

    document.getElementById('graph-title').textContent = opin.name + ' - Results';

    // Show/hide download actions based on status
    const graphActions = document.getElementById('graph-actions');
    if (opin.status === 'ended') {
        graphActions.classList.remove('hidden');
    } else {
        graphActions.classList.add('hidden');
    }

    try {
        const data = await withLoader(async () => {
            return await getVoteDetails(opinId);
        });

        const canvas = document.getElementById('graph-canvas');
        drawGraph(canvas, data);

        const voterDropdowns = document.getElementById('voter-dropdowns');
        renderVoterDropdowns(voterDropdowns, data);

        // Store data for exports
        canvas.graphData = data;
    } catch (error) {
        notify.error('Failed to load graph data');
        console.error(error);
    }
}

document.getElementById('close-graph-modal').addEventListener('click', () => {
    graphModal.classList.add('hidden');
});

graphModal.querySelector('.modal-backdrop').addEventListener('click', () => {
    graphModal.classList.add('hidden');
});

// Export buttons
document.getElementById('export-png').addEventListener('click', () => {
    const canvas = document.getElementById('graph-canvas');
    exportPNG(canvas, currentGraphOpin?.name || 'opin-results');
    notify.success('PNG downloaded!');
});

document.getElementById('export-jpg').addEventListener('click', () => {
    const canvas = document.getElementById('graph-canvas');
    exportJPG(canvas, currentGraphOpin?.name || 'opin-results');
    notify.success('JPG downloaded!');
});

document.getElementById('export-excel').addEventListener('click', () => {
    const canvas = document.getElementById('graph-canvas');
    if (canvas.graphData) {
        exportExcel(canvas.graphData, currentGraphOpin?.name || 'opin-results');
        notify.success('Excel file downloaded!');
    }
});

document.getElementById('export-sheets').addEventListener('click', () => {
    const canvas = document.getElementById('graph-canvas');
    if (canvas.graphData) {
        exportGoogleSheets(canvas.graphData);
        notify.info('CSV downloaded. Import it into Google Sheets.');
    }
});

document.getElementById('share-graph-btn').addEventListener('click', async () => {
    if (currentGraphOpin) {
        const graphUrl = getGraphShareUrl(currentGraphOpin.linkId);
        try {
            await navigator.clipboard.writeText(graphUrl);
            notify.success('Graph link copied to clipboard!');
        } catch {
            notify.info('Graph URL: ' + graphUrl);
        }
    }
});

// ============================================
// Utility Functions
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Initialize
// ============================================
handleRoute();

// Loader Module (uis3 style)

const overlay = document.getElementById('loader-overlay');

/**
 * Show the loading overlay
 */
export function showLoader() {
    overlay.classList.remove('hidden');
}

/**
 * Hide the loading overlay
 */
export function hideLoader() {
    overlay.classList.add('hidden');
}

/**
 * Execute an async function with loader
 */
export async function withLoader(asyncFn) {
    showLoader();
    try {
        return await asyncFn();
    } finally {
        hideLoader();
    }
}

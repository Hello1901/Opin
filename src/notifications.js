// Notifications Module (uis2 style)

const container = document.getElementById('notification-container');

const icons = {
    success: `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
  </svg>`,
    info: `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
  </svg>`,
    warning: `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
  </svg>`,
    error: `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
  </svg>`
};

const closeIcon = `<svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"></path>
</svg>`;

/**
 * Show a notification
 * @param {string} type - success, info, warning, or error
 * @param {string} message - The notification message
 * @param {number} duration - Time in ms before auto-dismiss (default: 5000)
 */
export function showNotification(type, message, duration = 5000) {
    const notification = document.createElement('li');
    notification.className = `notification-item ${type}`;

    notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${icons[type] || icons.info}</div>
      <div class="notification-text">${message}</div>
    </div>
    <div class="notification-icon notification-close">${closeIcon}</div>
    <div class="notification-progress-bar" style="animation-duration: ${duration}ms"></div>
  `;

    container.appendChild(notification);

    // Close on click
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => removeNotification(notification));

    // Auto dismiss
    const timeout = setTimeout(() => removeNotification(notification), duration);
    notification.dataset.timeout = timeout;
}

function removeNotification(notification) {
    if (notification.dataset.timeout) {
        clearTimeout(parseInt(notification.dataset.timeout));
    }
    notification.classList.add('removing');
    setTimeout(() => notification.remove(), 300);
}

// Convenience methods
export const notify = {
    success: (msg, duration) => showNotification('success', msg, duration),
    info: (msg, duration) => showNotification('info', msg, duration),
    warning: (msg, duration) => showNotification('warning', msg, duration),
    error: (msg, duration) => showNotification('error', msg, duration)
};

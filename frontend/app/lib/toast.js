/**
 * Toast notifications — show brief messages for actions
 */

const TOAST_CONTAINER_ID = "ls-toast-container";

function getOrCreateContainer() {
  let el = document.getElementById(TOAST_CONTAINER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = TOAST_CONTAINER_ID;
    el.className = "toast-container";
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  return el;
}

/**
 * @param {string} message
 * @param {'success'|'error'|'info'|'default'} [variant='default']
 * @param {number} [duration=3000]
 */
export function showToast(message, variant = "default", duration = 3000) {
  const container = getOrCreateContainer();
  const id = "toast-" + Date.now();
  const toast = document.createElement("div");
  toast.id = id;
  toast.className = `toast toast--${variant} ls-toast`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span class="toast__message">${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add("toast--out");
    setTimeout(() => toast.remove(), 200);
  };

  if (duration > 0) setTimeout(remove, duration);
  return remove;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

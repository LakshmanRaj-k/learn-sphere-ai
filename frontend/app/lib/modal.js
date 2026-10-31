/**
 * Modal — show content in a glassmorphism overlay; confirm variant for delete etc.
 */

const MODAL_ID = "ls-modal-root";

function getOrCreateRoot() {
  let root = document.getElementById(MODAL_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = MODAL_ID;
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
  }
  return root;
}

function render(content, opts = {}) {
  const { onClose, closeOnOverlay = true } = opts;
  const root = getOrCreateRoot();
  root.innerHTML = `
    <div class="modal-overlay ls-modal-overlay" id="ls-modal-overlay" role="dialog" aria-modal="true">
      <div class="modal-backdrop" data-modal-close></div>
      <div class="modal-content ls-modal-content modal-content--glass">${content}</div>
    </div>
  `;
  const overlay = root.querySelector(".modal-overlay");
  const backdrop = root.querySelector("[data-modal-close]");

  function close() {
    overlay.classList.add("modal-overlay--out");
    setTimeout(() => {
      root.innerHTML = "";
      onClose?.();
    }, 200);
  }

  backdrop.addEventListener("click", () => closeOnOverlay && close());
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
  const focusable = overlay.querySelector('button, [href], input, select, textarea');
  if (focusable) focusable.focus();
  return close;
}

/**
 * Show a custom modal with HTML content. Returns a close function.
 */
export function showModal(htmlContent, opts = {}) {
  return render(htmlContent, opts);
}

/**
 * Show confirmation modal. Returns a Promise<boolean> (true = confirmed, false = cancelled).
 */
export function confirmModal(opts = {}) {
  const {
    title = "Confirm",
    body = "Are you sure?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
  } = opts;
  return new Promise((resolve) => {
    const content = `
      <div class="modal-inner">
        <h2 class="modal-title">${escapeHtml(title)}</h2>
        <p class="modal-body">${escapeHtml(body)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline modal-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"} modal-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    const close = render(content, { closeOnOverlay: true, onClose: () => resolve(false) });
    const root = getOrCreateRoot();
    root.querySelector(".modal-cancel")?.addEventListener("click", () => {
      close();
      resolve(false);
    });
    root.querySelector(".modal-confirm")?.addEventListener("click", () => {
      close();
      resolve(true);
    });
  });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

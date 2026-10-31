/**
 * Full-page loader / spinner — show during route transitions
 */

const LOADER_ID = "ls-loader";

function getOrCreate() {
  let el = document.getElementById(LOADER_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = LOADER_ID;
    el.className = "loader-overlay";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-busy", "true");
    el.innerHTML = `
      <div class="loader-spinner ls-spinner" aria-hidden="true"></div>
      <span class="loader-label">Loading...</span>
    `;
    document.body.appendChild(el);
  }
  return el;
}

export function showLoader() {
  const el = getOrCreate();
  el.classList.add("loader-overlay--visible");
  el.setAttribute("aria-busy", "true");
}

export function hideLoader() {
  const el = document.getElementById(LOADER_ID);
  if (el) {
    el.classList.remove("loader-overlay--visible");
    el.setAttribute("aria-busy", "false");
  }
}

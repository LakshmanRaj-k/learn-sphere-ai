/**
 * Navbar component — reusable top bar with brand and actions
 * @param {Object} opts
 * @param {string} [opts.brand='LearnSphere AI']
 * @param {string} [opts.rightHtml=''] — e.g. login button or user menu
 */
export function Navbar(opts = {}) {
  const brand = opts.brand ?? "LearnSphere AI";
  const rightHtml = opts.rightHtml ?? "";
  return `
    <header class="container ls-navbar-wrap">
      <nav class="navbar ls-transition" aria-label="Main">
        <a href="/" class="navbar__brand" data-link>${escapeHtml(brand)}</a>
        <div class="navbar__actions">${rightHtml}</div>
      </nav>
    </header>
  `;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

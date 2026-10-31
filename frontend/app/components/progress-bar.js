/**
 * Progress bar component — animated 0 → value
 * @param {Object} opts
 * @param {number} opts.value — 0–100
 * @param {string} [opts.label]
 * @param {string} [opts.className='']
 * @param {boolean} [opts.animate=true]
 */
export function ProgressBar(opts = {}) {
  const { value = 0, label = "", className = "", animate = true } = opts;
  const pct = Math.min(100, Math.max(0, Number(value)));
  const animClass = animate ? " ls-progress-bar-fill" : "";
  return `
    <div class="progress-bar ${className}" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"${label ? ` aria-label="${escapeAttr(label)}"` : ""}>
      ${label ? `<span class="progress-bar__label">${escapeHtml(label)}</span>` : ""}
      <div class="progress-bar__track">
        <div class="progress-bar__fill ${animClass}" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
function escapeAttr(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML.replace(/"/g, "&quot;");
}

/**
 * Button component — use for consistent buttons with optional ripple
 * @param {Object} opts
 * @param {string} opts.label
 * @param {string} [opts.variant='primary'] — primary | secondary | success | outline
 * @param {string} [opts.href] — if set, renders as <a>
 * @param {string} [opts.type='button']
 * @param {string} [opts.className='']
 * @param {boolean} [opts.ripple=true]
 */
export function Button(opts = {}) {
  const {
    label,
    variant = "primary",
    href,
    type = "button",
    className = "",
    ripple = true,
  } = opts;
  const baseClass = "btn btn-" + variant;
  const classes = `ls-btn-scale ${baseClass} ${className}`.trim();
  const rippleClass = ripple ? " ls-ripple-container" : "";
  const content = `<span class="btn__inner">${escapeHtml(label)}</span>`;

  if (href !== undefined && href !== "") {
    const dataLink = href.startsWith("http") ? "" : ' data-link';
    return `<a href="${escapeAttr(href)}" class="${classes}${rippleClass}"${dataLink}>${content}</a>`;
  }
  return `<button type="${escapeAttr(type)}" class="${classes}${rippleClass}">${content}</button>`;
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

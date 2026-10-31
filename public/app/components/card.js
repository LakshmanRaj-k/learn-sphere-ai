/**
 * Card component — reusable content card with optional hover animation
 * @param {Object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.subtitle]
 * @param {string} [opts.body] — inner HTML content
 * @param {string} [opts.className=''] — extra classes (e.g. 'card--compact ls-card-hover')
 * @param {string} [opts.ariaLabel]
 */
export function Card(opts = {}) {
  const { title, subtitle, body = "", className = "", ariaLabel = "" } = opts;
  const aria = ariaLabel ? ` aria-label="${escapeHtml(ariaLabel)}"` : "";
  const titleHtml = title ? `<h2 class="card__title">${escapeHtml(title)}</h2>` : "";
  const subtitleHtml = subtitle ? `<p class="card__subtitle">${subtitle}</p>` : "";
  return `
    <article class="card ${className}"${aria}>
      ${titleHtml}
      ${subtitleHtml}
      ${body ? `<div class="card__body">${body}</div>` : ""}
    </article>
  `;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

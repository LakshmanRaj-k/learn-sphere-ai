/**
 * Sidebar component — collapsible nav for dashboard layouts
 * @param {Object} opts
 * @param {string} opts.role — 'student' | 'lecturer'
 * @param {string} opts.currentPath — current route path
 * @param {boolean} [opts.collapsed=false]
 */
export function Sidebar(opts) {
  const { role, currentPath, collapsed = false } = opts;
  const collapsedClass = collapsed ? " sidebar--collapsed" : "";

  const navItems =
    role === "lecturer"
      ? [
          { path: "/lecturer-dashboard", icon: "D", label: "Dashboard" },
          { path: "/create-class", icon: "C", label: "Create Class" },
          { path: "/analytics", icon: "R", label: "Reports" },
          { path: "#", icon: "S", label: "Settings", disabled: true },
        ]
      : [
          { path: "/student-dashboard", icon: "🏠", label: "Dashboard" },
          { path: "/student-dashboard#ask-ai", icon: "💬", label: "Ask AI" },
          { path: "/student-dashboard#learning-space", icon: "📚", label: "Personalized Learning Space" },
          { path: "/student-dashboard#quiz", icon: "📝", label: "Quiz" },
          { path: "/student-dashboard#analytics", icon: "📊", label: "Analytics" },
          { path: "#", icon: "S", label: "Settings", disabled: true },
        ];

  const links = navItems
    .map(
      (item) => {
        const currentHash = (typeof window !== "undefined" && window.location?.hash) || "";
        const itemHash = item.path.includes("#") ? item.path.split("#")[1] : "";
        const pathMatch = item.path.split("#")[0] === currentPath.split("#")[0];
        const isDashboard = item.path === "/student-dashboard" && !item.path.includes("#");
        const hashMatch = isDashboard ? (!currentHash || currentHash === "") : (currentHash === "#" + itemHash);
        const active = pathMatch && hashMatch && !item.disabled ? ' aria-current="page"' : "";
        const disabled = item.disabled ? ' aria-disabled="true"' : "";
        const dataNav = item.disabled ? "" : ` data-nav="${item.path}"`;
        return `
          <a href="${item.path}" class="sidebar__link" data-link${dataNav}${active}${disabled}>
            <span class="sidebar__icon" aria-hidden="true">${item.icon}</span>
            <span class="sidebar__label">${escapeHtml(item.label)}</span>
          </a>
        `;
      }
    )
    .join("");

  return `
    <aside class="sidebar ls-sidebar${collapsedClass}" aria-label="${role === "lecturer" ? "Lecturer" : "Student"} navigation" id="app-sidebar">
      <div class="sidebar__head">
        <a href="${role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard"}" class="sidebar__brand" data-link>LearnSphere AI</a>
        <button type="button" class="sidebar__toggle" id="sidebar-toggle" aria-label="${collapsed ? "Expand" : "Collapse"} sidebar">
          <span class="sidebar__toggle-icon" aria-hidden="true">${collapsed ? "→" : "←"}</span>
        </button>
      </div>
      <nav class="sidebar__nav">${links}</nav>
    </aside>
  `;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

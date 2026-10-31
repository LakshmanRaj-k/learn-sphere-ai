import { getState, getCurrentRole, setUser, setDarkMode, toggleSidebar, setSidebarCollapsed, addToRevisionList, getRevisionList, removeFromRevisionList, toggleBookmark, isBookmarked, addDiscussedTopic, getDiscussedTopics, addChatMessage, getFreeAIChat, setFreeAIContext, getFreeAIContext, addQuizAttempt, getQuizAttempts, getLecturerClasses, getLecturerClassById, addLecturerClass, removeLecturerClass, addLearningModule, getLearningModules } from "./state.js";
import { showToast } from "./lib/toast.js";
import { showLoader, hideLoader } from "./lib/loader.js";
import { confirmModal } from "./lib/modal.js";
import { Navbar } from "./components/navbar.js";
import { Sidebar } from "./components/sidebar.js";
import { Card } from "./components/card.js";
import { Button } from "./components/button.js";
import { ProgressBar } from "./components/progress-bar.js";
import { mockClasses, mockTopics, mockQuizQuestions, mockLecturerStats, mockAnalyticsScores, mockWeakTopics, mockClassDetails, SUBJECT_TOPICS_MAP, AI_KNOWLEDGE } from "./mockData.js";

const outlet = document.getElementById("app");
const routeStyle = document.getElementById("route-style");

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

function pullToRefresh(selector, onRefresh) {
  const el = document.querySelector(selector);
  if (!el) return;
  let startY = 0;
  el.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
  el.addEventListener("touchend", () => {
    if (startY > 0 && window.scrollY < 30) {
      showToast("Refreshing...", "info");
      setTimeout(() => { onRefresh?.(); showToast("Updated!", "success"); }, 400);
    }
  }, { passive: true });
}

function countUp(id, from, to, durationMs, stepMs = 40, suffix = "") {
  const el = document.getElementById(id);
  if (!el) return;
  const steps = Math.max(1, Math.round(durationMs / stepMs));
  let step = 0;
  const timer = setInterval(() => {
    step++;
    const t = step / steps;
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const val = Math.round(from + (to - from) * eased);
    el.textContent = val + suffix;
    if (step >= steps) {
      clearInterval(timer);
      el.textContent = to + suffix;
    }
  }, stepMs);
}

function setTitle(title) {
  document.title = title ? `${title} • LearnSphere AI` : "LearnSphere AI";
}

function isInternalLink(a) {
  if (!a) return false;
  if (a.target && a.target !== "_self") return false;
  if (a.hasAttribute("download")) return false;
  const href = a.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("http://") || href.startsWith("https://")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  return true;
}

export function navigate(path) {
  showLoader();
  history.pushState({}, "", path);
  setTimeout(() => {
    render();
    setTimeout(hideLoader, 220);
  }, 180);
}

function normalizePath(pathname) {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0].split("#")[0];
  if (clean.startsWith("/class/")) return "/class";
  if (clean.startsWith("/course/")) return "/course";
  if (clean.startsWith("/lecturer-class-view/")) return "/lecturer-class-view";
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean || "/";
}

/** Mock + lecturer-created classes for student flows */
function getMergedClasses() {
  const extras = getLecturerClasses().map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    lecturer: c.lecturerName || "Lecturer",
    description: c.subject,
    progress: c.completionPct ?? 0,
  }));
  return [...mockClasses, ...extras];
}

/** Class learning page details: mock or from lecturer-created class */
function getClassDetailsForCourse(course) {
  const lc = getLecturerClassById(course.id);
  if (lc) {
    const topics = (lc.topics || []).map((t, i) => ({
      id: `${lc.id}-t${i}`,
      title: t.title,
      description: t.description || `Study unit: ${t.title}`,
    }));
    return {
      deadline: lc.deadline || "TBD",
      topics: topics.length ? topics : [{ id: `${lc.id}-t0`, title: "Getting started", description: "Overview of the course." }],
      materials: [{ id: `${lc.id}-m1`, title: "Course outline", type: "PDF" }],
      assessments: [
        { id: `${lc.id}-a1`, title: "Practice quiz", topic: topics[0]?.title || lc.subject },
        {
          id: "final",
          title: `Final: ${
            lc.finalAssessmentSummary ||
            (lc.assessmentQuestions?.length
              ? `${lc.assessmentQuestions.length} MCQ question(s)`
              : String(lc.finalAssessment || "Assessment").slice(0, 44))
          }`,
          topic: "Whole course",
        },
      ],
      analytics: {
        scores: [
          { id: "s1", title: "Quiz 1", score: lc.avgAssessmentScore ?? 72 },
          { id: "s2", title: "Quiz 2", score: (lc.avgAssessmentScore ?? 72) - 8 },
        ],
        topicsCompleted: 1,
        totalTopics: Math.max(1, topics.length),
        assessmentsCompleted: 0,
        totalAssessments: 2,
      },
    };
  }
  return mockClassDetails[course.id] || null;
}

function layoutDashboard(role, currentPath, mainContent) {
  const collapsed = getState().sidebarCollapsed;
  const darkMode = getState().darkMode;
  const isClassRoute = currentPath.startsWith("/class");
  const sidebarHtml = isClassRoute ? "" : Sidebar({ role, currentPath, collapsed });
  return `
    <div class="dash ls-fade-in${isClassRoute ? " dash--no-sidebar" : ""}">
      ${sidebarHtml}
      <main class="content${isClassRoute ? " content--no-sidebar" : ""}">
        <div class="content__toolbar">
          <button type="button" class="btn btn-outline btn-sm" id="dark-mode-toggle" aria-label="Toggle dark mode">
            ${darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
        ${mainContent}
      </main>
    </div>
  `;
}

const routes = {
  "/": {
    title: "",
    style: `
      .hero {
        min-height: calc(100vh - 72px - var(--section-gap) * 2);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: var(--space-3);
      }
      .hero__title { margin: 0; font-size: clamp(32px, 5vw, 42px); letter-spacing: -0.03em; }
      .hero__subtitle { margin: 0; max-width: 540px; }
      .hero__cta { margin-top: var(--space-5); }
      .features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-5); margin-bottom: var(--section-gap); }
      @media (max-width: 900px) { .features { grid-template-columns: 1fr; } }
      .feature-icon { width: 48px; height: 48px; border-radius: var(--radius-lg); display: inline-flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-bottom: var(--space-2); color: #fff; }
      .feature-icon--learn { background: var(--color-primary); }
      .feature-icon--think { background: var(--color-secondary); }
      .feature-icon--analyze { background: var(--color-success); }
    `,
    view: () => {
      const loginBtn = Button({ label: "Login", href: "/login", variant: "primary" });
      const getStartedBtn = Button({ label: "Get Started", href: "/login", variant: "primary" });
      return `
        ${Navbar({ rightHtml: loginBtn })}
        <main class="container ls-fade-in">
          <section class="section hero">
            <div class="ls-slide-up">
              <h1 class="hero__title">Learn Smarter with AI</h1>
              <p class="hero__subtitle muted">LearnSphere AI helps students and educators analyze content, deepen understanding, and make data-driven learning decisions with intelligent tools.</p>
            </div>
            <div class="hero__cta ls-slide-up ls-slide-up-delay-1">${getStartedBtn}</div>
          </section>
          <section class="section">
            <div class="features">
              <article class="card ls-card-hover ls-slide-up ls-slide-up-delay-1">
                <div class="feature-icon feature-icon--learn">L</div>
                <h3 class="card__title">Learn</h3>
                <p class="card__subtitle">Curated AI-assisted modules that adapt to your pace and academic goals.</p>
              </article>
              <article class="card ls-card-hover ls-slide-up ls-slide-up-delay-2">
                <div class="feature-icon feature-icon--think">T</div>
                <h3 class="card__title">Think</h3>
                <p class="card__subtitle">Structured prompts that encourage critical thinking, not just answers.</p>
              </article>
              <article class="card ls-card-hover ls-slide-up ls-slide-up-delay-3">
                <div class="feature-icon feature-icon--analyze">A</div>
                <h3 class="card__title">Analyze</h3>
                <p class="card__subtitle">Visualize performance, identify gaps, and refine learning strategies with clarity.</p>
              </article>
            </div>
          </section>
        </main>
      `;
    },
  },

  "/login": {
    title: "Login",
    style: `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--section-gap);
      }

      .auth-card {
        width: 100%;
        max-width: 400px;
        background: var(--color-card);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-card);
        padding: 32px;
      }

      .auth-title {
        margin: 0 0 16px;
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-bottom: 16px;
      }

      .field label {
        font-size: 14px;
        font-weight: 500;
        color: var(--color-text);
      }

      .field input[type="email"],
      .field input[type="password"] {
        padding: 10px 12px;
        border-radius: 6px;
        border: 1px solid rgba(15, 23, 42, 0.16);
        font: inherit;
        background: #ffffff;
      }

      .field input:focus-visible {
        outline: none;
        box-shadow: var(--focus-ring);
        border-color: transparent;
      }

      .roles {
        display: flex;
        gap: 16px;
        margin-top: 4px;
        margin-bottom: 16px;
      }

      .role-option {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
      }

      .auth-button {
        width: 100%;
        height: 45px;
      }

      .register {
        margin-top: 12px;
        text-align: center;
        font-size: 14px;
      }

      .register a {
        color: var(--color-secondary);
        font-weight: 500;
        text-decoration: none;
      }

      .register a:hover {
        text-decoration: underline;
      }
    `,
    view: () => `
      <main class="auth-page">
        <section class="auth-card" aria-labelledby="login-title">
          <h1 id="login-title" class="auth-title">Login</h1>

          <form id="loginForm">
            <div class="field">
              <label for="email">Email (optional for prototype)</label>
              <input id="email" name="email" type="email" placeholder="you@example.com" />
            </div>

            <div class="field">
              <label for="password">Password (optional for prototype)</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter any password"
              />
            </div>

            <div class="field">
              <span>Role</span>
              <div class="roles">
                <label class="role-option">
                  <input type="radio" name="role" value="student" checked />
                  <span>Student</span>
                </label>
                <label class="role-option">
                  <input type="radio" name="role" value="lecturer" />
                  <span>Lecturer</span>
                </label>
              </div>
            </div>

            <button class="btn btn-primary auth-button" type="submit">
              Login
            </button>
          </form>

          <div class="register">
            <a href="/login" data-link>Register</a>
          </div>
        </section>
      </main>
    `,
    mount: () => {
      const form = document.getElementById("loginForm");

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const email = String(formData.get("email") || "").trim() || "demo@learnsphere.ai";
        const role = String(formData.get("role") || "student") === "lecturer" ? "lecturer" : "student";

        const userId = `prototype-${Date.now()}`;
        setUser({ userId, role, email });
        showToast(`Prototype login successful as ${role}.`, "success");
        navigate(role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard");
      });
    },
  },

  "/student-dashboard": {
    title: "Student Dashboard",
    style: `
      .dash { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; }
      .content { background: var(--color-bg); padding: var(--section-gap); overflow: auto; }
      .mode-panel { display: none; animation: ls-fade-in 0.25s var(--ease-out); }
      .mode-panel--active { display: block; }
      .chat-area { min-height: 360px; max-height: calc(100vh - 220px); overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4); }
      .chat-msg { max-width: 85%; padding: var(--space-3) var(--space-4); border-radius: var(--radius-lg); line-height: 1.6; font-size: 0.9375rem; }
      .chat-msg--user { align-self: flex-end; background: var(--color-primary); color: #fff; }
      .chat-msg--assistant { align-self: flex-start; background: var(--color-card); border: 1px solid rgba(148,163,184,0.25); box-shadow: var(--shadow-sm); }
      .chat-input-row { display: flex; gap: var(--space-2); margin-top: var(--space-3); padding: var(--space-3); background: var(--color-card); border-radius: var(--radius-lg); border: 1px solid rgba(148,163,184,0.2); }
      .chat-input-row input { flex: 1; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(148,163,184,0.3); font: inherit; }
      .chat-input-row input:focus-visible { outline: none; box-shadow: var(--focus-ring); }
      .learn-form { display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--space-3); align-items: end; flex-wrap: wrap; padding: var(--space-5); background: var(--color-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); margin-bottom: var(--space-5); }
      .learn-form .field { display: flex; flex-direction: column; gap: 6px; }
      .learn-form .field label { font-size: 0.875rem; font-weight: 600; }
      .learn-form .field input { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(148,163,184,0.3); font: inherit; }
      .learn-content { padding: var(--space-5); background: var(--color-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); min-height: 200px; }
      .learn-content__body { font-size: 0.9375rem; line-height: 1.7; color: var(--color-text-muted); white-space: pre-wrap; }
      .topic-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
      .topic-card { padding: var(--space-5); background: var(--color-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); border: 1px solid rgba(148,163,184,0.12); transition: all var(--duration-normal) var(--ease-out); }
      .topic-card:hover { box-shadow: var(--shadow-card-hover); border-color: rgba(37,99,235,0.25); }
      .topic-card__name { font-size: 1rem; font-weight: 700; margin: 0 0 4px; }
      .topic-card__date { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0 0 var(--space-3); }
      .quiz-panel { display: none; }
      .quiz-panel--active { display: block; }
      .quiz-question { padding: var(--space-5); background: var(--color-card); border-radius: var(--radius-lg); margin-bottom: var(--space-4); }
      .quiz-option { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(148,163,184,0.2); cursor: pointer; margin-bottom: 8px; transition: all var(--duration-fast); }
      .quiz-option:hover { border-color: rgba(37,99,235,0.4); }
      .quiz-results { padding: var(--space-5); background: var(--color-card); border-radius: var(--radius-lg); }
      .quiz-results__score { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: var(--space-3); }
      .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); }
      .analytics-card { padding: var(--space-5); background: var(--color-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }
      .progress-bar-custom { height: 10px; background: rgba(148,163,184,0.2); border-radius: 999px; overflow: hidden; margin-top: 8px; }
      .progress-bar-custom__fill { height: 100%; background: var(--color-primary); border-radius: 999px; transition: width var(--duration-normal); }
      .recommendations-list { margin: var(--space-3) 0 0; padding-left: 20px; }
      .welcome { padding: var(--space-5); }
      .welcome__row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
      .welcome__title { margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
      .welcome__subtitle { margin: var(--space-1) 0 0; color: var(--color-text-muted); }
      .join-card { margin-top: var(--section-gap); padding: var(--space-5); }
      .join-form { display: flex; gap: var(--space-2); margin-top: var(--space-3); flex-wrap: wrap; }
      .join-form input[type="text"] { flex: 1 1 200px; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid rgba(15,23,42,0.16); font: inherit; background: var(--color-card); }
      .join-button { white-space: nowrap; }
      .joined-list { margin-top: var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-2); min-height: 44px; }
      .joined-item { background: var(--color-card); border-radius: 999px; padding: var(--space-1) var(--space-3); font-size: 0.8125rem; box-shadow: var(--shadow-sm); border: 1px solid rgba(15,23,42,0.08); }
      .classes-toggle { margin-top: var(--space-4); border-radius: var(--radius-lg); border: 1px solid rgba(15,23,42,0.08); background: var(--color-card); padding: var(--space-4) var(--space-5); box-shadow: var(--shadow-card-soft); }
      .classes-toggle__header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
      .classes-toggle__title { margin: 0; font-size: 0.9375rem; font-weight: 600; letter-spacing: -0.01em; }
      .classes-toggle__hint { margin: 4px 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
      .classes-toggle__btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(148,163,184,0.5); background: rgba(255,255,255,0.3); font-size: 0.8125rem; cursor: pointer; color: inherit; }
      .classes-toggle__chevron { display: inline-block; transition: transform var(--duration-fast) var(--ease-out); }
      .classes-toggle--open .classes-toggle__chevron { transform: rotate(180deg); }
      .classes-toggle__body { margin-top: var(--space-4); overflow: hidden; max-height: 0; opacity: 0; transform: translateY(-4px); transition: max-height var(--duration-normal) var(--ease-out), opacity var(--duration-fast) var(--ease-out), transform var(--duration-fast) var(--ease-out); }
      .classes-toggle--open .classes-toggle__body { max-height: 900px; opacity: 1; transform: translateY(0); }
      .classes-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--space-4); }
      .class-meta { display: flex; flex-direction: column; gap: 4px; }
      .class-meta__name { font-size: 0.9375rem; font-weight: 600; }
      .class-meta__lecturer { font-size: 0.8125rem; color: var(--color-text-muted); }
      .class-meta__desc { margin: 4px 0 0; font-size: 0.8125rem; color: var(--color-text-muted); }
      .class-card__footer { margin-top: var(--space-4); display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
      .empty-state { padding: var(--space-3); border-radius: var(--radius-md); background: rgba(148,163,184,0.08); font-size: 0.875rem; color: var(--color-text-muted); }
      .empty-state__text { margin: 0; }
      @media (max-width: 980px) { .dash { grid-template-columns: 1fr; } .learn-form { grid-template-columns: 1fr; } }
      @media (max-width: 767px) {
        .chat-msg { max-width: 100%; }
        .chat-input-row { position: sticky; bottom: 0; z-index: 10; margin-left: -var(--space-5); margin-right: -var(--space-5); margin-bottom: -var(--space-5); border-radius: 0; border-left: none; border-right: none; border-bottom: none; }
      }
    `,
    view: () => {
      const role = getCurrentRole();
      const hash = (location.hash || "").replace(/^#/, "");
      const mode = ["dashboard", "learning-space", "quiz", "analytics", "ask-ai", "workspace"].includes(hash) ? hash : "dashboard";
      const chatHistory = getFreeAIChat();
      const discussedTopics = getDiscussedTopics();
      const chatHtml = chatHistory.length > 0
        ? chatHistory.map((m) => `<div class="chat-msg chat-msg--${m.role}">${escapeHtml(m.content)}</div>`).join("")
        : `<div class="chat-msg chat-msg--assistant">Hi! I'm your AI tutor. Ask me anything—doubts, explanations, or help with problems. I'll provide step-by-step solutions and examples.</div>`;
      const topicCardsHtml = discussedTopics.length > 0
        ? discussedTopics.map((t) => `
            <div class="topic-card" data-topic="${escapeAttr(t.subject)}|${escapeAttr(t.topic)}">
              <h3 class="topic-card__name">${escapeHtml(t.subject)}: ${escapeHtml(t.topic)}</h3>
              <p class="topic-card__date">Discussed On: ${escapeHtml(t.date)}</p>
              <button type="button" class="btn btn-primary ls-btn-scale" data-generate-quiz>Generate Quiz</button>
            </div>
          `).join("")
        : `<p class="muted">No topics discussed yet. Go to <a href="/student-dashboard#learning-space" data-link>Learning Space</a> to study a topic first, then come back here to generate quizzes.</p>`;
      const quizAttempts = getQuizAttempts();
      const weakTopics = quizAttempts.filter((a) => a.score < 50).map((a) => a.topic);
      const uniqueWeak = [...new Set(weakTopics)];
      const avgScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length)
        : 0;
      const mergedClasses = getMergedClasses();
      const joinedItems = mergedClasses.map((c) => `${c.code} – ${c.name}`);
      const joinedListHtml = joinedItems.length > 0
        ? joinedItems.map((t) => `<span class="joined-item">${escapeHtml(t)}</span>`).join("")
        : `<div class="empty-state"><p class="empty-state__text">You haven't joined any classes yet. Enter a class code above to start learning.</p></div>`;
      const classesCardsHtml = mergedClasses.length > 0
        ? `<div class="classes-grid">
            ${mergedClasses.map((c) => {
              const continueBtn = Button({
                label: "Continue Learning",
                variant: "primary",
                href: `/class/${c.id}`,
                className: "class-card__cta",
              });
              const pb = ProgressBar({
                value: c.progress ?? 0,
                label: `${c.progress ?? 0}% complete`,
                className: "class-card__progress",
                animate: true,
              });
              const body = `
                <div class="class-meta">
                  <div class="class-meta__name">${escapeHtml(c.name)}</div>
                  <div class="class-meta__lecturer">Lecturer: ${escapeHtml(c.lecturer || "TBA")}</div>
                  <p class="class-meta__desc">${escapeHtml(c.description || "")}</p>
                </div>
                <div class="class-card__footer">
                  ${continueBtn}
                  ${pb}
                </div>
              `;
              return Card({ body, className: "ls-card-hover", ariaLabel: `${c.name} class` });
            }).join("")}
          </div>`
        : `<div class="empty-state"><p class="empty-state__text">You haven't joined any classes yet. Enter a class code above to start learning.</p></div>`;
      const mainContent = `
        <div class="mode-panel" data-mode="ask-ai" id="mode-ask-ai">
          <h1 class="card__title" style="margin-bottom:var(--space-4);">Ask AI</h1>
          <section class="card" aria-label="AI Chat">
            <div class="chat-area" id="free-ai-chat" aria-live="polite">
              ${chatHtml}
            </div>
            <form id="free-ai-form" class="chat-input-row">
              <input type="text" id="free-ai-input" placeholder="Ask a question..." aria-label="Message to AI tutor" autocomplete="off" required />
              <button class="btn btn-primary" type="submit" id="free-ai-submit" aria-label="Send message">Send</button>
            </form>
          </section>
        </div>
        <div class="mode-panel mode-panel--active" data-mode="dashboard" id="mode-dashboard">
          <section class="card welcome ls-card-hover ls-slide-up">
            <div class="welcome__row">
              <div>
                <h1 class="welcome__title">Welcome back</h1>
                <p class="welcome__subtitle">Continue learning with your classes and personalized insights.</p>
              </div>
              <span class="badge badge-success">Active</span>
            </div>
          </section>
          <section class="card join-card ls-slide-up ls-slide-up-delay-1" aria-label="Join a class">
            <h2 class="card__title">Join a Class</h2>
            <div class="join-form">
              <input type="text" placeholder="Enter Class Code" aria-label="Class code" id="join-class-input" />
              <button class="btn btn-secondary join-button ls-btn-scale" type="button" id="join-class-btn">Join</button>
            </div>
            <div class="joined-list" id="joined-list" aria-label="Joined classes">${joinedListHtml}</div>
            <div class="classes-toggle ls-slide-up ls-slide-up-delay-1" id="my-classes-toggle">
              <div class="classes-toggle__header">
                <div>
                  <h3 class="classes-toggle__title">My Classes</h3>
                  <p class="classes-toggle__hint">See all classes you've joined and jump back into learning.</p>
                </div>
                <button type="button" class="classes-toggle__btn" id="my-classes-toggle-btn" aria-expanded="false" aria-controls="my-classes-panel">
                  <span>Show</span>
                  <span class="classes-toggle__chevron" aria-hidden="true">⌄</span>
                </button>
              </div>
              <div class="classes-toggle__body" id="my-classes-panel" hidden>
                ${classesCardsHtml}
              </div>
            </div>
          </section>
        </div>
        <div class="mode-panel" data-mode="learning-space" id="mode-learning-space">
          <h1 class="card__title" style="margin-bottom:var(--space-4);">Personalized Learning Space</h1>
          <section class="card" aria-label="Create a Learning Module">
            <h2 class="card__title" style="font-size: 1.1rem; margin-bottom: 12px;">Create New Module</h2>
            <form id="create-module-form" style="display: flex; flex-direction: column; gap: 16px;">
              <div class="field">
                <label for="module-subject" style="font-size: 0.875rem; font-weight: 600;">Subject</label>
                <select id="module-subject" required style="padding: 10px; border-radius: 6px; border: 1px solid #ccc; font-size: 14px;">
                  <option value="" disabled selected>Select a subject...</option>
                  <option value="Data Structures">Data Structures</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="DBMS">DBMS</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Aptitude">Aptitude</option>
                </select>
              </div>
              
              <div class="field" id="topics-container" style="display: none;">
                <label style="font-size: 0.875rem; font-weight: 600;">Topics (Multi-select)</label>
                <div id="module-topics-list" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                  <!-- dynamically populated checkboxes -->
                </div>
              </div>
              
              <div>
                <button type="submit" class="btn btn-primary" id="btn-create-module" disabled>Create Module</button>
              </div>
            </form>
          </section>
          
          <section class="card" style="margin-top: var(--space-5);" aria-label="Your Modules">
            <div style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;" id="toggle-modules-btn">
              <h2 class="card__title" style="font-size: 1.1rem; margin: 0;">Your Modules</h2>
              <span id="modules-chevron" style="transition: transform 0.2s;">⌄</span>
            </div>
            <div id="modules-list-container" style="margin-top: 16px; display: grid; gap: 16px; grid-template-columns: 1fr;">
              <p class="muted">Loading modules...</p>
            </div>
          </section>
        </div>

        <div class="mode-panel" data-mode="workspace" id="mode-workspace">
          <div style="margin-bottom: 16px;">
            <button type="button" class="btn btn-outline ls-btn-scale" id="workspace-back-btn" style="padding: 6px 12px; font-size: 0.875rem;">&larr; Back to Learning Space</button>
          </div>
          <section class="card" style="margin-bottom: var(--space-4);">
            <h1 class="card__title" id="workspace-subject-title" style="font-size: 1.4rem; margin-bottom: 8px;">Subject</h1>
            <div id="workspace-tags" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
          </section>
          
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: var(--space-4);" id="workspace-topic-toggles">
          </div>
          
          <section class="card" style="min-height: 400px; display: flex; flex-direction: column;">
            <h2 class="card__title" id="workspace-active-topic" style="font-size: 1.2rem; border-bottom: 1px solid rgba(148,163,184,0.2); padding-bottom: 12px; margin-bottom: 16px;">Active Topic</h2>
            <div id="workspace-chat-area" class="chat-area" style="flex: 1; min-height: 250px;">
               <div class="chat-msg chat-msg--assistant">Welcome to your learning workspace! I'm your AI tutor. Ask doubts, get hints, or learn step-by-step.</div>
            </div>
            <form id="workspace-chat-form" class="chat-input-row" style="margin-top: 16px;">
              <input type="text" id="workspace-chat-input" placeholder="Ask doubts, get hints, or learn step-by-step..." aria-label="Message AI tutor" required autocomplete="off" />
              <button class="btn btn-primary" type="submit">Send</button>
            </form>
          </section>
        </div>
        <div class="mode-panel" data-mode="quiz" id="mode-quiz">
          <h1 class="card__title" style="margin-bottom:var(--space-4);">Quiz</h1>
          <p class="muted" style="margin-bottom:var(--space-4);">Generate quizzes from topics you've discussed with the AI.</p>
          <div id="quiz-topic-list" class="topic-cards">${topicCardsHtml}</div>
          <div class="quiz-panel" id="quiz-panel">
            <div class="quiz-question" id="quiz-question-el"></div>
            <div id="quiz-options"></div>
            <div style="margin-top:var(--space-3);">
              <button type="button" class="btn btn-outline" id="quiz-back">Back to Topics</button>
              <button type="button" class="btn btn-primary" id="quiz-next" style="margin-left:8px;">Next</button>
              <button type="button" class="btn btn-success" id="quiz-submit" style="margin-left:8px;display:none;">Submit Quiz</button>
            </div>
          </div>
          <div class="card quiz-results" id="quiz-results" style="display:none;">
            <h2 class="card__title">Quiz Results</h2>
            <p class="quiz-results__score" id="quiz-score-display"></p>
            <p id="quiz-correct-display"></p>
            <p id="quiz-incorrect-display"></p>
            <button type="button" class="btn btn-primary" id="quiz-results-back">Back to Topics</button>
          </div>
        </div>
        <div class="mode-panel" data-mode="analytics" id="mode-analytics">
          <h1 class="card__title" style="margin-bottom:var(--space-4);">Analytics</h1>
          <p class="muted" style="margin-bottom:var(--space-4);">Your learning performance and AI recommendations.</p>
          <div class="analytics-grid">
            <article class="card analytics-card">
              <h3 class="card__title">Total Quizzes Attempted</h3>
              <p class="stat-value" style="font-size:2rem;margin:8px 0;">${quizAttempts.length}</p>
            </article>
            <article class="card analytics-card">
              <h3 class="card__title">Average Quiz Score</h3>
              <p class="stat-value" style="font-size:2rem;margin:8px 0;color:var(--color-primary);">${avgScore}%</p>
              <div class="progress-bar-custom"><div class="progress-bar-custom__fill" style="width:${avgScore}%;"></div></div>
            </article>
          </div>
          <article class="card analytics-card" style="margin-top:var(--space-4);">
            <h3 class="card__title">Weak Areas</h3>
            <p class="card__subtitle">Topics where you performed poorly in quizzes</p>
            ${uniqueWeak.length > 0 ? `<ul class="recommendations-list">${uniqueWeak.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` : `<p class="muted">No weak areas yet. Complete some quizzes to see insights.</p>`}
          </article>
          <article class="card analytics-card" style="margin-top:var(--space-4);">
            <h3 class="card__title">AI Recommendations</h3>
            <p class="card__subtitle">Personalized suggestions based on your performance</p>
            ${uniqueWeak.length > 0 ? `
              <ul class="recommendations-list">
                <li>Revise ${uniqueWeak.slice(0, 2).map((t) => escapeHtml(t)).join(" and ")} before your next quiz</li>
                <li>Practice additional quizzes on weak topics</li>
                <li>Revisit the learning explanations in Personalized Learning Space</li>
              </ul>
            ` : `<p class="muted">Keep practicing! Your recommendations will appear here once we identify areas to improve.</p>`}
          </article>
          <article class="card analytics-card" style="margin-top:var(--space-4);">
            <h3 class="card__title">Topic Performance Summary</h3>
            ${quizAttempts.length > 0 ? quizAttempts.slice(0, 8).map((a) => `
              <div style="margin-bottom:var(--space-2);">
                <div style="display:flex;justify-content:space-between;font-size:0.875rem;">
                  <span>${escapeHtml(a.topic)}</span>
                  <span>${a.score}%</span>
                </div>
                <div class="progress-bar-custom"><div class="progress-bar-custom__fill" style="width:${a.score}%;"></div></div>
              </div>
            `).join("") : `<p class="muted">Complete quizzes to see your topic performance.</p>`}
          </article>
        </div>
      `;
      const html = mainContent.replace(/mode-panel--active/g, "mode-panel").replace(new RegExp(`class="mode-panel" id="mode-${mode}"`), `class="mode-panel mode-panel--active" id="mode-${mode}"`);
      return layoutDashboard(role, "/student-dashboard" + (mode !== "dashboard" ? "#" + mode : ""), html);
    },
    mount: () => {
      const hash = (location.hash || "").replace(/^#/, "");
      const mode = ["dashboard", "learning-space", "quiz", "analytics", "ask-ai", "workspace"].includes(hash) ? hash : "dashboard";
      document.querySelectorAll(".mode-panel").forEach((p) => {
        p.classList.toggle("mode-panel--active", p.dataset.mode === mode);
      });
      
      const askAiForm = document.getElementById("free-ai-form");
      const askAiInput = document.getElementById("free-ai-input");
      const askAiChat = document.getElementById("free-ai-chat");
      
      if (askAiForm && askAiInput && askAiChat) {
        askAiChat.scrollTop = askAiChat.scrollHeight;
        askAiForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const text = askAiInput.value.trim();
          if (!text) return;
          
          addChatMessage("user", text);
          askAiChat.innerHTML += `<div class="chat-msg chat-msg--user">${escapeHtml(text)}</div>`;
          askAiInput.value = "";
          askAiChat.scrollTop = askAiChat.scrollHeight;
          
          const typingId = "typing-" + Date.now();
          askAiChat.innerHTML += `<div class="chat-msg chat-msg--assistant" id="${typingId}"><div style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:8px; height:8px; background:var(--color-primary); border-radius:50%; animation: pulse 1s infinite alternate;"></span> AI is typing...</div></div>`;
          askAiChat.scrollTop = askAiChat.scrollHeight;
          
          fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, history: getFreeAIChat().slice(0, -1) })
          })
          .then(async res => {
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "AI service unavailable");
            return data;
          })
          .then(data => {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            const reply = data.reply || "I'm sorry, I couldn't process that.";
            addChatMessage("assistant", reply);
            askAiChat.innerHTML += `<div class="chat-msg chat-msg--assistant">${data.isHtml ? reply : escapeHtml(reply)}</div>`;
            askAiChat.scrollTop = askAiChat.scrollHeight;
          })
          .catch(() => {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            addChatMessage("assistant", "Service unavailable.");
            askAiChat.innerHTML += `<div class="chat-msg chat-msg--assistant">Service unavailable.</div>`;
            askAiChat.scrollTop = askAiChat.scrollHeight;
          });
        });
      }

      const joinInput = document.getElementById("join-class-input");
      const joinBtn = document.getElementById("join-class-btn");
      const joinedList = document.getElementById("joined-list");
      const toggleRoot = document.getElementById("my-classes-toggle");
      const toggleBtn = document.getElementById("my-classes-toggle-btn");
      const panel = document.getElementById("my-classes-panel");
      if (joinBtn && joinInput && joinedList) {
        joinBtn.addEventListener("click", () => {
          const code = joinInput.value.trim().toUpperCase();
          if (!code) return;
          const item = document.createElement("span");
          item.className = "joined-item";
          item.textContent = code;
          joinedList.appendChild(item);
          joinInput.value = "";
          showToast("Class joined!", "success");
        });
      }
      if (toggleRoot && toggleBtn && panel) {
        const updateState = (open) => {
          toggleRoot.classList.toggle("classes-toggle--open", open);
          toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
          panel.hidden = !open;
          const labelSpan = toggleBtn.querySelector("span:first-child");
          if (labelSpan) labelSpan.textContent = open ? "Hide" : "Show";
        };
        updateState(true);
        toggleBtn.addEventListener("click", () => {
          const isOpen = toggleRoot.classList.contains("classes-toggle--open");
          updateState(!isOpen);
        });
      }

      const subjectsData = {
        "Data Structures": ["Arrays", "Linked List", "Stack", "Queue", "Trees", "Graphs"],
        "Operating Systems": ["Process Management", "Memory Management", "File Systems", "Concurrency"],
        "DBMS": ["ER Model", "Normalization", "Transactions", "SQL Queries"],
        "Computer Networks": ["OSI Model", "TCP/IP", "Routing", "Application Layer"],
        "Aptitude": ["Quantitative", "Logical Reasoning", "Verbal"]
      };

      const moduleSubj = document.getElementById("module-subject");
      const topicsContainer = document.getElementById("topics-container");
      const topicsList = document.getElementById("module-topics-list");
      const btnCreateModule = document.getElementById("btn-create-module");
      const createModuleForm = document.getElementById("create-module-form");
      
      if (moduleSubj && topicsContainer && topicsList && btnCreateModule && createModuleForm) {
        moduleSubj.addEventListener("change", (e) => {
          const subj = e.target.value;
          topicsList.innerHTML = "";
          btnCreateModule.disabled = true;
          if (subj && subjectsData[subj]) {
            topicsContainer.style.display = "block";
            subjectsData[subj].forEach(topic => {
              const label = document.createElement("label");
              label.style.display = "flex";
              label.style.alignItems = "center";
              label.style.gap = "6px";
              label.style.padding = "6px 12px";
              label.style.background = "var(--color-bg)";
              label.style.borderRadius = "var(--radius-md)";
              label.style.cursor = "pointer";
              label.innerHTML = `<input type="checkbox" name="module-topic" value="${topic}" /> ${topic}`;
              
              const cb = label.querySelector("input");
              cb.addEventListener("change", () => {
                const checked = Array.from(document.querySelectorAll('input[name="module-topic"]:checked'));
                btnCreateModule.disabled = checked.length === 0;
              });
              
              topicsList.appendChild(label);
            });
          } else {
            topicsContainer.style.display = "none";
          }
        });

        createModuleForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const subj = moduleSubj.value;
          const checked = Array.from(document.querySelectorAll('input[name="module-topic"]:checked')).map(cb => cb.value);
          if (!subj || checked.length === 0) return;
          
          btnCreateModule.textContent = "Creating...";
          btnCreateModule.disabled = true;
          
          // FAST LOCAL SAVE
          const newModule = addLearningModule(subj, checked);
          showToast("Module created locally!", "success");
          
          // Try backend in background, but don't block
          fetch("/api/create-module", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject: subj, topics: checked })
          }).catch(err => console.warn("Backend sync failed, but data is saved locally."));

          // Instant UI update
          loadModules();
          
          // Navigate to workspace
          window.location.hash = "workspace";
          setupWorkspace(newModule);
          
          btnCreateModule.textContent = "Create Module";
          btnCreateModule.disabled = false;
        });
      }

      const toggleModulesBtn = document.getElementById("toggle-modules-btn");
      const modulesChevron = document.getElementById("modules-chevron");
      const modulesListContainer = document.getElementById("modules-list-container");
      
      let modulesData = [];
      const loadModules = async () => {
        if (!modulesListContainer) return;
        
        // Use local modules immediately
        modulesData = getLearningModules();
        renderModulesList();

        // Optionally sync from backend
        try {
          const res = await fetch("/api/modules");
          if (res.ok) {
            const backendModules = await res.json();
            // Merge or replace if backend is source of truth
            // For now, let's just use local as primary for speed
          }
        } catch (err) {
          console.warn("Could not sync modules from backend.");
        }
      };

      const renderModulesList = () => {
        if (!modulesListContainer) return;
        if (modulesData.length === 0) {
          modulesListContainer.innerHTML = `<p class="muted">You haven't created any modules yet.</p>`;
          return;
        }
        
        modulesListContainer.innerHTML = modulesData.map(m => `
          <div class="topic-card" style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h3 class="topic-card__name">${escapeHtml(m.subject)}</h3>
              <span class="badge badge-success">${m.progress}%</span>
            </div>
            <p class="muted" style="margin: 0; font-size: 0.875rem;">Topics: ${m.topics.join(", ")}</p>
            <div style="margin-top: auto; padding-top: 12px;">
              <button class="btn btn-primary btn-continue-module" data-id="${m.id}" style="width: 100%;">Continue Learning</button>
            </div>
          </div>
        `).join("");
        
        document.querySelectorAll(".btn-continue-module").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const mod = modulesData.find(x => x.id === id || String(x.id) === id);
            if (mod) {
              window.location.hash = "workspace";
              setupWorkspace(mod);
            }
          });
        });
      };

      if (toggleModulesBtn && modulesListContainer && modulesChevron) {
        toggleModulesBtn.addEventListener("click", () => {
          const isHidden = modulesListContainer.style.display === "none";
          modulesListContainer.style.display = isHidden ? "grid" : "none";
          modulesChevron.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
        });
        
        // Load on mount if we are viewing the dashboard
        loadModules();
      }

      // Workspace logic
      const workspaceBackBtn = document.getElementById("workspace-back-btn");
      if (workspaceBackBtn) {
        workspaceBackBtn.addEventListener("click", () => {
          window.location.hash = "learning-space";
        });
      }

      const setupWorkspace = (mod) => {
        document.getElementById("workspace-subject-title").textContent = mod.subject;
        
        const tagsHtml = mod.topics.map(t => `<span class="joined-item">${escapeHtml(t)}</span>`).join("");
        document.getElementById("workspace-tags").innerHTML = tagsHtml;
        
        const togglesContainer = document.getElementById("workspace-topic-toggles");
        const activeTopicTitle = document.getElementById("workspace-active-topic");
        
        let activeTopic = mod.topics[0] || "Unknown";
        
        const updateToggles = () => {
          togglesContainer.innerHTML = mod.topics.map(t => `
            <button type="button" class="btn ${t === activeTopic ? 'btn-primary' : 'btn-outline'} ls-btn-scale" style="padding: 6px 12px; font-size: 0.875rem;" data-topic="${escapeHtml(t)}">${escapeHtml(t)}</button>
          `).join("");
          
          activeTopicTitle.textContent = activeTopic;
          
          togglesContainer.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", (e) => {
              activeTopic = e.target.getAttribute("data-topic");
              updateToggles();
              
              // Register topic so quiz can be generated later
              addDiscussedTopic(mod.subject, activeTopic);
              
              // Clear chat for new topic
              const chatArea = document.getElementById("workspace-chat-area");
              chatArea.innerHTML = `<div class="chat-msg chat-msg--assistant">Let's continue learning about <b>${escapeHtml(activeTopic)}</b>. Ask doubts, get hints, or learn step-by-step.</div>`;
            });
          });
        };
        
        updateToggles();
        
        const chatForm = document.getElementById("workspace-chat-form");
        const chatInput = document.getElementById("workspace-chat-input");
        const chatArea = document.getElementById("workspace-chat-area");
        
        // Use cloning to remove existing event listeners
        const newChatForm = chatForm.cloneNode(true);
        chatForm.parentNode.replaceChild(newChatForm, chatForm);
        const newChatInput = document.getElementById("workspace-chat-input");
        
        chatArea.innerHTML = `<div class="chat-msg chat-msg--assistant">Let's continue learning about <b>${escapeHtml(activeTopic)}</b>. Ask doubts, get hints, or learn step-by-step.</div>`;
        
        newChatForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const text = newChatInput.value.trim();
          if (!text) return;
          
          chatArea.innerHTML += `<div class="chat-msg chat-msg--user">${escapeHtml(text)}</div>`;
          newChatInput.value = "";
          chatArea.scrollTop = chatArea.scrollHeight;
          
          const typingId = "typing-ws-" + Date.now();
          chatArea.innerHTML += `<div class="chat-msg chat-msg--assistant" id="${typingId}"><div style="display:flex; align-items:center; gap:8px;"><span style="display:inline-block; width:8px; height:8px; background:var(--color-primary); border-radius:50%; animation: pulse 1s infinite alternate;"></span> AI is analyzing...</div></div>`;
          chatArea.scrollTop = chatArea.scrollHeight;
          
          const historyMsgs = Array.from(chatArea.querySelectorAll('.chat-msg'))
            .map(el => ({
              role: el.classList.contains('chat-msg--user') ? 'user' : 'assistant',
              content: el.textContent
            }));
            
          fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, topic: activeTopic, isWorkspace: true, history: historyMsgs })
          })
          .then(res => res.json())
          .then(data => {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            const reply = data.reply || "I'm sorry, I couldn't process that.";
            chatArea.innerHTML += `<div class="chat-msg chat-msg--assistant">${data.isHtml ? reply : escapeHtml(reply)}</div>`;
            chatArea.scrollTop = chatArea.scrollHeight;
          })
          .catch(err => {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            chatArea.innerHTML += `<div class="chat-msg chat-msg--assistant">Service unavailable.</div>`;
            chatArea.scrollTop = chatArea.scrollHeight;
          });
        });
      };
      document.querySelectorAll("[data-generate-quiz]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const card = btn.closest(".topic-card");
          const data = card?.dataset.topic?.split("|") || ["", ""];
          const [subject, topic] = data;
          const topicKey = `${subject}: ${topic}`;
          
          const topicList = document.getElementById("quiz-topic-list");
          const quizPanel = document.getElementById("quiz-panel");
          const quizResults = document.getElementById("quiz-results");
          
          if (!topicList || !quizPanel || !quizResults) return;

          const originalText = btn.textContent;
          btn.textContent = "Generating...";
          btn.disabled = true;

          const prompt = `Generate 5 MCQ questions on ${topic}. MUST OUTPUT STRICT JSON ARRAY OF OBJECTS, nothing else, no markdown formatting. Format: [{"text": "Question?", "options": {"a": "A", "b": "B", "c": "C", "d": "D"}, "correct": "a"}]`;

          fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: prompt })
          })
          .then(res => res.json())
          .then(data => {
             btn.textContent = originalText;
             btn.disabled = false;
             let aiQuestions;
             try {
                const jsonStr = (data.reply || "").replace(/```json/g, "").replace(/```/g, "").trim();
                aiQuestions = JSON.parse(jsonStr);
             } catch(e) { aiQuestions = null; }
             
             if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
                 showToast("Failed to parse AI quiz, using defaults", "error");
                 aiQuestions = mockQuizQuestions;
             }
             
             const questions = aiQuestions.map((q, i) => ({ ...q, id: "gq" + i }));
             
             topicList.style.display = "none";
             quizPanel.style.display = "block";
             quizResults.style.display = "none";
            let qIdx = 0;
            const answers = {};
            const questionEl = document.getElementById("quiz-question-el");
            const optionsEl = document.getElementById("quiz-options");
            const nextBtn = document.getElementById("quiz-next");
            const submitBtn = document.getElementById("quiz-submit");
            const renderQ = () => {
              const q = questions[qIdx];
              if (!q || !questionEl || !optionsEl) return;
              questionEl.innerHTML = `<h3>Q${qIdx + 1}. ${escapeHtml(q.text)}</h3>`;
              optionsEl.innerHTML = Object.entries(q.options).map(([k, l]) => `
                <label class="quiz-option" data-key="${k}">
                  <input type="radio" name="ans" value="${k}" ${answers[qIdx] === k ? "checked" : ""} />
                  <span>${escapeHtml(l)}</span>
                </label>
              `).join("");
              optionsEl.querySelectorAll(".quiz-option").forEach((opt) => {
                opt.addEventListener("click", () => {
                  const k = opt.dataset.key;
                  answers[qIdx] = k;
                  optionsEl.querySelectorAll("input").forEach((inp) => inp.checked = inp.value === k);
                });
              });
              nextBtn.style.display = qIdx < questions.length - 1 ? "inline-flex" : "none";
              submitBtn.style.display = qIdx === questions.length - 1 ? "inline-flex" : "none";
            };
            renderQ();
            nextBtn?.addEventListener("click", () => {
              const sel = document.querySelector('input[name="ans"]:checked');
              if (sel) answers[qIdx] = sel.value;
              qIdx++;
              renderQ();
            });
            submitBtn?.addEventListener("click", () => {
              const sel = document.querySelector('input[name="ans"]:checked');
              if (sel) answers[qIdx] = sel.value;
              let correct = 0;
              questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
              const total = questions.length;
              const score = Math.round((correct / total) * 100);
              addQuizAttempt(topicKey, score, total, correct, total - correct);
              quizPanel.style.display = "none";
              quizResults.style.display = "block";
              document.getElementById("quiz-score-display").textContent = `${correct}/${total} (${score}%)`;
              document.getElementById("quiz-correct-display").textContent = `Correct: ${correct}`;
              document.getElementById("quiz-incorrect-display").textContent = `Incorrect: ${total - correct}`;
              showToast("Quiz saved!", "success");
            });
          })
          .catch(err => {
            btn.textContent = originalText;
            btn.disabled = false;
            showToast("AI Quiz Generation Error", "error");
          });
        });
      });
      document.getElementById("quiz-back")?.addEventListener("click", () => navigate("/student-dashboard#quiz"));
      document.getElementById("quiz-results-back")?.addEventListener("click", () => navigate("/student-dashboard#quiz"));
      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
        setDarkMode(!getState().darkMode);
        navigate(location.pathname + (location.hash || ""));
      });
      const sidebar = document.getElementById("app-sidebar");
      const sidebarToggleBtn = document.getElementById("sidebar-toggle");
      if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          sidebarToggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
    },
  },

  "/lecturer-dashboard": {
    title: "Lecturer Dashboard",
    style: `
      .dash { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; }
      .content { background: var(--color-bg); padding: var(--section-gap); }
      .page-title { margin: 0 0 var(--space-4); font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
      .analytics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-5); }
      .metric { padding: var(--space-5); }
      .metric__top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
      .metric__icon { width: 44px; height: 44px; border-radius: var(--radius-lg); display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #fff; }
      .metric__icon--primary { background: var(--color-primary); }
      .metric__icon--secondary { background: var(--color-secondary); }
      .metric__icon--success { background: var(--color-success); }
      .metric__icon--neutral { background: rgba(17,24,39,0.72); }
      .metric__label { margin: 0; font-size: 0.875rem; font-weight: 600; color: var(--color-text-muted); }
      .metric__value { margin: var(--space-2) 0 0; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; }
      .your-classes { margin-top: var(--section-gap); }
      .your-classes__title { margin: 0 0 var(--space-4); font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; }
      .your-classes__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
      .lecturer-class-card { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); min-height: 180px; }
      .lecturer-class-card__meta { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
      .lecturer-class-card__footer { margin-top: auto; padding-top: var(--space-3); }
      @media (max-width: 1100px) { .analytics-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 640px) { .analytics-grid { grid-template-columns: 1fr; } }
    `,
    view: () => {
      const role = getCurrentRole();
      const stats = mockLecturerStats;
      const lecturerClasses = getLecturerClasses();
      const yourClassesHtml =
        lecturerClasses.length > 0
          ? lecturerClasses
              .map((c) => {
                const viewBtn = Button({
                  label: "View Class",
                  variant: "primary",
                  href: `/lecturer-class-view/${c.id}`,
                  className: "ls-btn-scale",
                });
                const body = `
                  <h2 class="card__title" style="margin-bottom:4px;">${escapeHtml(c.name)}</h2>
                  <p class="lecturer-class-card__meta"><strong>Subject:</strong> ${escapeHtml(c.subject)}</p>
                  <p class="lecturer-class-card__meta"><strong>Students:</strong> ${c.studentCount ?? 0}</p>
                  <p class="lecturer-class-card__meta muted" style="font-size:0.8125rem;">Code: ${escapeHtml(c.code)}</p>
                  <div class="lecturer-class-card__footer">${viewBtn}</div>
                `;
                return Card({ body, className: "lecturer-class-card ls-card-hover ls-slide-up", ariaLabel: c.name });
              })
              .join("")
          : `<p class="muted" style="font-size:0.875rem;">No classes yet. Use <strong>Create Class</strong> in the sidebar to add one.</p>`;
      const mainContent = `
        <h1 class="page-title ls-slide-up">Lecturer Dashboard</h1>
        <section class="analytics-grid" aria-label="Analytics overview">
          <article class="card metric ls-card-hover ls-slide-up ls-slide-up-delay-1">
            <div class="metric__top">
              <div>
                <p class="metric__label">Total Students</p>
                <p id="metricTotalStudents" class="metric__value">0</p>
              </div>
              <div class="metric__icon metric__icon--primary" aria-hidden="true">ST</div>
            </div>
          </article>
          <article class="card metric ls-card-hover ls-slide-up ls-slide-up-delay-2">
            <div class="metric__top">
              <div>
                <p class="metric__label">Average Score</p>
                <p id="metricAverageScore" class="metric__value">0%</p>
              </div>
              <div class="metric__icon metric__icon--success" aria-hidden="true">AS</div>
            </div>
          </article>
          <article class="card metric ls-card-hover ls-slide-up ls-slide-up-delay-3">
            <div class="metric__top">
              <div>
                <p class="metric__label">Weak Topics</p>
                <p id="metricWeakTopics" class="metric__value">0</p>
              </div>
              <div class="metric__icon metric__icon--secondary" aria-hidden="true">WT</div>
            </div>
          </article>
          <article class="card metric ls-card-hover ls-slide-up ls-slide-up-delay-4">
            <div class="metric__top">
              <div>
                <p class="metric__label">Active Classes</p>
                <p id="metricActiveClasses" class="metric__value">${stats.activeClasses}</p>
              </div>
              <div class="metric__icon metric__icon--neutral" aria-hidden="true">AC</div>
            </div>
          </article>
        </section>
        <section class="your-classes" aria-labelledby="your-classes-heading">
          <h2 id="your-classes-heading" class="your-classes__title ls-slide-up">Your Classes</h2>
          <div class="your-classes__grid">${yourClassesHtml}</div>
        </section>
      `;
      return layoutDashboard(role, "/lecturer-dashboard", mainContent);
    },
    mount: () => {
      countUp("metricTotalStudents", 0, mockLecturerStats.totalStudents, 0, 800);
      countUp("metricAverageScore", 0, mockLecturerStats.averageScore, 0, 800, "%");
      countUp("metricWeakTopics", 0, mockLecturerStats.weakTopics, 0, 800);
      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
        setDarkMode(!getState().darkMode);
        navigate("/lecturer-dashboard");
      });
      const toggleBtn = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("app-sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          toggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
    },
  },

  "/lecturer-class-view": {
    title: "Class status",
    style: `
      .dash { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; }
      .content { background: var(--color-bg); padding: var(--section-gap); }
      .lcv-title { margin: 0 0 var(--space-2); font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
      .lcv-sub { margin: 0 0 var(--space-5); color: var(--color-text-muted); font-size: 0.875rem; }
      .lcv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-5); }
      .lcv-card { padding: var(--space-5); }
      .lcv-card__label { margin: 0; font-size: 0.8125rem; font-weight: 600; color: var(--color-text-muted); }
      .lcv-card__value { margin: var(--space-2) 0 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; }
      .lcv-list { margin: var(--space-2) 0 0; padding-left: 18px; font-size: 0.875rem; color: var(--color-text-muted); }
      .lcv-bar-wrap { margin-top: var(--space-3); }
    `,
    view: () => {
      const role = getCurrentRole();
      const fullPath = location.pathname.split("?")[0].split("#")[0];
      const classId = fullPath.startsWith("/lecturer-class-view/") ? fullPath.slice("/lecturer-class-view/".length) : "";
      const cls = getLecturerClassById(classId);
      if (!cls) {
        const mainContent = `
          <h1 class="lcv-title">Class not found</h1>
          <p class="lcv-sub">This class may have been removed.</p>
          <a class="btn btn-primary" href="/lecturer-dashboard" data-link>Back to Dashboard</a>
        `;
        return layoutDashboard(role, "/lecturer-class-view", mainContent);
      }
      const members = cls.studentCount ?? 24;
      const avgScore = cls.avgAssessmentScore ?? 76;
      const dailyActive = cls.dailyActiveStudents ?? 18;
      const weak = cls.weakTopics?.length ? cls.weakTopics : ["Evaluation metrics", "Feature scaling", "Overfitting"];
      const deadline = cls.deadline || "—";
      const completion = cls.completionPct ?? 42;
      const pb = ProgressBar({ value: completion, label: `${completion}% course completion`, animate: true });
      const mainContent = `
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:var(--space-4); flex-wrap:wrap;">
          <div>
            <h1 class="lcv-title">${escapeHtml(cls.name)}</h1>
            <p class="lcv-sub">Subject: ${escapeHtml(cls.subject)} · Code: <strong>${escapeHtml(cls.code)}</strong></p>
          </div>
          <a class="btn btn-outline" href="/lecturer-dashboard" data-link>Back</a>
        </div>
        <div class="lcv-grid" aria-label="Class analytics">
          <article class="card lcv-card ls-card-hover">
            <p class="lcv-card__label">Total class members</p>
            <p class="lcv-card__value">${members}</p>
          </article>
          <article class="card lcv-card ls-card-hover">
            <p class="lcv-card__label">Average assessment score</p>
            <p class="lcv-card__value">${avgScore}%</p>
          </article>
          <article class="card lcv-card ls-card-hover">
            <p class="lcv-card__label">Daily average active students</p>
            <p class="lcv-card__value">${dailyActive}</p>
          </article>
          <article class="card lcv-card ls-card-hover">
            <p class="lcv-card__label">Course completion deadline</p>
            <p class="lcv-card__value" style="font-size:1.1rem;">${escapeHtml(deadline)}</p>
          </article>
        </div>
        <article class="card lcv-card ls-card-hover" style="margin-bottom:var(--space-4);">
          <h2 class="card__title" style="margin-bottom:var(--space-2);">Course completion</h2>
          <div class="lcv-bar-wrap">${pb}</div>
        </article>
        <article class="card lcv-card ls-card-hover">
          <h2 class="card__title" style="margin-bottom:var(--space-2);">Common weak topics in class</h2>
          <ul class="lcv-list">
            ${weak.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
          </ul>
        </article>
      `;
      return layoutDashboard(role, "/lecturer-class-view", mainContent);
    },
    mount: () => {
      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
        setDarkMode(!getState().darkMode);
        navigate(location.pathname);
      });
      const toggleBtn = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("app-sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          toggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
    },
  },

  "/learn": {
    title: "Learn",
    style: `
      .learn-layout { display: grid; grid-template-columns: 0.32fr 0.68fr; min-height: 0; }
      .panel-left { border-right: 1px solid rgba(148,163,184,0.25); background: var(--color-bg); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
      .panel-right { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
      .topic-title { font-size: 1rem; font-weight: 600; margin-bottom: var(--space-1); }
      .topic-list { display: flex; flex-direction: column; gap: var(--space-1); }
      .topic-btn { width: 100%; text-align: left; padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid transparent; background: var(--color-card); font: inherit; cursor: pointer; color: var(--color-text); transition: all var(--duration-normal) var(--ease-out); }
      .topic-btn--active { background: var(--color-primary); color: #fff; }
      .topic-btn:not(.topic-btn--active):hover { border-color: rgba(148,163,184,0.5); }
      .topic-row { display: flex; align-items: center; gap: var(--space-2); }
      .topic-bookmark { width: 24px; height: 24px; border: none; background: none; cursor: pointer; font-size: 1rem; opacity: 0.6; flex-shrink: 0; }
      .topic-bookmark.bookmarked { opacity: 1; }
      .explain-card { padding: var(--space-5); min-height: 260px; }
      .explain-body { font-size: 0.9375rem; color: var(--color-text-muted); line-height: 1.6; }
      .learn-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }
      @media (max-width: 900px) { .learn-layout { grid-template-columns: 1fr; } .panel-left { border-right: none; border-bottom: 1px solid rgba(148,163,184,0.25); } .topic-list { flex-direction: row; flex-wrap: wrap; } .topic-btn { width: auto; } }
    `,
    view: () => {
      const role = getCurrentRole();
      const topics = mockTopics;
      const topicListHtml = topics
        .map(
          (t, i) => `
          <div class="topic-row" data-topic-index="${i}">
            <button type="button" class="topic-btn ${i === 0 ? "topic-btn--active" : ""}" data-topic-btn>${escapeHtml(t.title)}</button>
            <button type="button" class="topic-bookmark ${isBookmarked(t.id) ? "bookmarked" : ""}" data-bookmark="${t.id}" aria-label="Bookmark" title="Double-click to bookmark">🔖</button>
          </div>`
        )
        .join("");
      const firstTopic = topics[0];
      const mainContent = `
        <div class="learn-layout">
          <aside class="panel-left" aria-label="Topics">
            <div class="topic-title">Topics</div>
            <p class="muted" style
            <div class="topic-list" id="topic-list">${topicListHtml}</div>
          </aside>
          <main class="panel-right">
            <section class="card explain-card ls-transition" id="explain-card" aria-label="AI explanation">
              <h1 id="topicTitle" class="card__title">${escapeHtml(firstTopic.title)}</h1>
              <p id="topicBody" class="explain-body">${escapeHtml(firstTopic.body)}</p>
            </section>
            <div class="learn-actions">
              <button id="askAiBtn" class="btn btn-secondary ls-btn-scale" type="button">Ask AI</button>
              <button id="nextTopicBtn" class="btn btn-primary ls-btn-scale" type="button">Next Topic</button>
              <button id="understoodBtn" class="btn btn-success ls-btn-scale" type="button">Mark as Understood</button>
              <button type="button" class="btn btn-outline ls-btn-scale" id="addToRevisionBtn">Add to Revision List</button>
              <a class="btn btn-outline" href="/student-dashboard" data-link>Back</a>
            </div>
            <p id="learnStatus" class="muted" style="margin-top:var(--space-1);font-size:0.875rem"></p>
          </main>
        </div>
      `;
      return layoutDashboard(role, "/learn", mainContent);
    },
    mount: () => {
      const topics = mockTopics;
      let idx =

      function renderTopic(direction) {
        const topic = topics[idx];
        if (!topic || !titleEl || !bodyEl) return;
        if (cardEl) {
          cardEl.classList.remove("ls-quiz-slide-next", "ls-quiz-slide-prev");
          cardEl.offsetHeight;
          cardEl.classList.add(direction >= 0 ? "ls-quiz-slide-next" : "ls-quiz-slide-prev");
        }
        titleEl.textContent = topic.title;
        bodyEl.textContent = topic.body;
        document.querySelectorAll(".topic-btn").forEach((btn, i) => btn.classList.toggle("topic-btn--active", i === idx));
        const bm = document.querySelector(`.topic-bookmark[data-bookmark="${topic.id}"]`);
        if (bm) bm.classList.toggle("bookmarked", isBookmarked(topic.id));
      }

      document.querySelectorAll(".topic-btn").forEach((btn, i) => {
        btn.addEventListener("click", () => { idx = i; renderTopic(1); });
        const row = btn.closest(".topic-row");
        if (row) {
          let tmr;
          const showPreview = () => {
            const t = topics[i];
            if (!t) return;
            import("./lib/modal.js").then(({ showModal }) => {
              showModal(`<div class="modal-inner"><h3 class="modal-title">${escapeHtml(t.title)}</h3><p class="modal-body">${escapeHtml(t.body.slice(0, 220))}...</p></div>`, { closeOnOverlay: true });
            });
          };
          row.addEventListener("touchstart", () => { tmr = setTimeout(showPreview, 500); }, { passive: true });
          row.addEventListener("touchend", () => clearTimeout(tmr), { passive: true });
          row.addEventListener("mousedown", () => { tmr = setTimeout(showPreview, 500); });
          row.addEventListener("mouseup", () => clearTimeout(tmr));
          row.addEventListener("mouseleave", () => clearTimeout(tmr));
        }
      });

      document.querySelectorAll(".topic-bookmark").forEach((btn) => {
        btn.addEventListener("dblclick", (e) => {
          e.preventDefault();
          const id = btn.getAttribute("data-bookmark");
          if (id) {
            toggleBookmark(id);
            btn.classList.add("ls-bookmark-pulse");
            setTimeout(() => btn.classList.remove("ls-bookmark-pulse"), 300);
            btn.classList.toggle("bookmarked", isBookmarked(id));
            showToast("Bookmarked!", "success");
          }
        });
      });

      askBtn?.addEventListener("click", () => {
        if (statusEl) statusEl.textContent = "AI explanation loading...";
        setTimeout(() => {
          if (statusEl) statusEl.textContent = "Simulated AI: Review the key terms above.";
          showToast("AI response ready", "info");
        }, 800);
      });
      nextBtn?.addEventListener("click", () => {
        idx = (idx + 1) % topics.length;
        renderTopic(1);
        if (statusEl) statusEl.textContent = "";
      });
      understoodBtn?.addEventListener("click", () => {
        if (statusEl) statusEl.textContent = "Marked as understood.";
        showToast("Marked as understood!", "success");
      });
      addToRevisionBtn?.addEventListener("click", () => {
        const topic = topics[idx];
        if (topic) { addToRevisionList(topic.title); showToast("Added to Revision List", "success"); }
      });

      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => { setDarkMode(!getState().darkMode); navigate("/learn"); });
      const toggleBtn = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("app-sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          toggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
      renderTopic(0);
    },
  },

  "/course": {
    title: "Course",
    style: `
      .course-layout { display: grid; grid-template-columns: 0.32fr 0.68fr; min-height: 0; }
      .course-sidebar { border-right: 1px solid rgba(148,163,184,0.25); background: var(--color-bg); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
      .course-main { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
      .course-title { margin: 0; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
      .course-subtitle { margin: 4px 0 0; font-size: 0.875rem; color: var(--color-text-muted); }
      .module-list { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }
      .module-pill { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: 8px 10px; border-radius: var(--radius-md); border: 1px solid rgba(148,163,184,0.4); background: var(--color-card); font-size: 0.875rem; cursor: pointer; }
      .module-pill--active { border-color: var(--color-primary); box-shadow: 0 0 0 1px rgba(37,99,235,0.15); }
      .module-label { font-weight: 500; }
      .module-kicker { font-size: 0.75rem; color: var(--color-text-muted); }
      .course-section { padding: var(--space-5); }
      .course-section__title { margin: 0 0 6px; font-size: 0.9375rem; font-weight: 600; }
      .course-section__body { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); line-height: 1.6; }
      .course-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
      .course-progress { max-width: 360px; }
      @media (max-width: 900px) { .course-layout { grid-template-columns: 1fr; } .course-sidebar { border-right: none; border-bottom: 1px solid rgba(148,163,184,0.25); } }
    `,
    view: () => {
      const role = getCurrentRole();
      const fullPath = location.pathname.split("?")[0].split("#")[0];
      const classId = fullPath.startsWith("/course/") ? fullPath.slice("/course/".length) : "";
      const merged = getMergedClasses();
      const course =
        merged.find(
          (c) =>
            c.id === classId ||
            c.code.toLowerCase() === classId.toLowerCase()
        ) ||
        merged[0] ||
        {
          name: "Course",
          lecturer: "Lecturer",
          description: "Course structure preview.",
          progress: 0,
        };
      const overviewProgress = ProgressBar({
        value: course.progress ?? 0,
        label: `${course.progress ?? 0}% complete`,
        className: "course-progress",
        animate: true,
      });
      const mainContent = `
        <div class="course-layout">
          <aside class="course-sidebar" aria-label="Course modules">
            <div>
              <h1 class="course-title">${escapeHtml(course.name)}</h1>
              <p class="course-subtitle">Lecturer: ${escapeHtml(course.lecturer || "TBA")}</p>
            </div>
            <div class="module-list" id="course-modules">
              <button type="button" class="module-pill module-pill--active" data-module="topics">
                <div>
                  <div class="module-label">Topic explanations</div>
                  <div class="module-kicker">Concept overviews and examples</div>
                </div>
              </button>
              <button type="button" class="module-pill" data-module="materials">
                <div>
                  <div class="module-label">Learning materials</div>
                  <div class="module-kicker">Slides, readings, and links</div>
                </div>
              </button>
              <button type="button" class="module-pill" data-module="quizzes">
                <div>
                  <div class="module-label">Practice quizzes</div>
                  <div class="module-kicker">Check understanding with quick questions</div>
                </div>
              </button>
              <button type="button" class="module-pill" data-module="progress">
                <div>
                  <div class="module-label">Progress tracking</div>
                  <div class="module-kicker">Completion and time spent</div>
                </div>
              </button>
            </div>
          </aside>
          <main class="course-main">
            <section class="card course-section ls-slide-up" id="course-section" aria-label="Course module detail">
              <h2 class="course-section__title">Topic explanations</h2>
              <p class="course-section__body">
                Explore the key concepts for this class one topic at a time. Each topic combines a short explanation with
                examples, reflection prompts, and links back to your lecturer's materials.
              </p>
              <div class="course-actions">
                <a class="btn btn-secondary ls-btn-scale" href="/learn" data-link>Open topic view</a>
                ${Button({
                  label: "Start practice quiz",
                  variant: "outline",
                  href: "/quiz",
                  className: "",
                })}
                <a class="btn btn-outline" href="/student-dashboard" data-link>Back to dashboard</a>
              </div>
              <div style="margin-top: var(--space-4);">
                ${overviewProgress}
              </div>
            </section>
          </main>
        </div>
      `;
      return layoutDashboard(role, "/course", mainContent);
    },
    mount: () => {
      const section = document.getElementById("course-section");
      const modules = document.querySelectorAll(".module-pill");
      function setModule(kind) {
        modules.forEach((m) => m.classList.toggle("module-pill--active", m.dataset.module === kind));
        if (!section) return;
        let title = "";
        let body = "";
        if (kind === "materials") {
          title = "Learning materials";
          body =
            "Access lecturer-curated slides, readings, and external links. In a full implementation, this panel would list actual files and URLs for your class.";
        } else if (kind === "quizzes") {
          title = "Practice quizzes";
          body =
            "Short quizzes help you quickly check your understanding after each topic. Use them before exams or as spaced repetition throughout the semester.";
        } else if (kind === "progress") {
          title = "Progress tracking";
          body =
            "Track which topics you've completed, quiz scores over time, and how your understanding improves across modules.";
        } else {
          title = "Topic explanations";
          body =
            "Explore the key concepts for this class one topic at a time. Each topic combines a short explanation with examples, reflection prompts, and links back to your lecturer's materials.";
        }
        const titleEl = section.querySelector(".course-section__title");
        const bodyEl = section.querySelector(".course-section__body");
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.textContent = body;
      }
      modules.forEach((m) => {
        m.addEventListener("click", () => {
          setModule(m.dataset.module);
        });
      });
      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
        setDarkMode(!getState().darkMode);
        navigate(location.pathname);
      });
      const toggleBtn = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("app-sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          toggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
      setModule("topics");
    },
  },

  "/class": {
    title: "Class Learning",
    style: `
      .class-layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--space-5); min-height: 0; align-items: start; }
      .class-header { margin-bottom: var(--space-5); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
      .class-header__top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
      .class-header__title { margin: 0; font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; }
      .class-header__meta { font-size: 0.875rem; color: var(--color-text-muted); }
      .class-header__deadline { font-size: 0.8125rem; color: var(--color-text-muted); }
      
      .class-sidebar { border-radius: var(--radius-lg); background: var(--color-primary); color: #fff; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: var(--space-4); box-shadow: var(--shadow-card); }
      .class-sidebar__title { margin: 0; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.01em; color: #fff; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.2); }
      .class-nav { display: flex; flex-direction: column; gap: 8px; }
      .class-nav__btn { width: 100%; text-align: left; padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid transparent; background: transparent; font: inherit; font-size: 0.9375rem; color: rgba(255,255,255,0.85); cursor: pointer; transition: all 0.2s; font-weight: 500; }
      .class-nav__btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
      .class-nav__btn--active { background: rgba(255,255,255,0.22); color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      
      .class-main { display: flex; flex-direction: column; gap: var(--space-4); }
      .class-section { display: none; }
      .class-section--active { display: block; animation: ls-fade-in 0.3s ease; }
      
      .topic-view { display: grid; grid-template-columns: 320px 1fr; gap: var(--space-4); align-items: start; }
      .topic-list-col { display: flex; flex-direction: column; gap: 8px; max-height: 600px; overflow-y: auto; padding-right: 4px; }
      .topic-list-item { text-align: left; padding: 16px; border-radius: var(--radius-lg); border: 1px solid rgba(148,163,184,0.3); background: var(--color-card); cursor: pointer; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.2s, box-shadow 0.2s; font: inherit; }
      .topic-list-item:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
      .topic-list-item--active { border-color: var(--color-primary); background: rgba(37,99,235,0.04); box-shadow: 0 0 0 1px rgba(37,99,235,0.1); }
      .topic-list-item__title { font-weight: 600; font-size: 1rem; margin: 0; color: var(--color-text); }
      .topic-list-item__desc { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; line-height: 1.5; }
      .topic-detail-col { display: flex; flex-direction: column; gap: var(--space-4); }
      
      .ai-panel { margin-top: 0; }
      .ai-panel__title { margin: 0 0 6px; font-size: 1.05rem; font-weight: 700; }
      .ai-panel__subtitle { margin: 0 0 12px; font-size: 0.875rem; color: var(--color-text-muted); }
      .ai-panel__body { min-height: 80px; font-size: 0.9375rem; color: var(--color-text-muted); line-height: 1.6; }
      .ai-input { margin-top: var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-2); }
      .ai-input input[type="text"] { flex: 1 1 220px; padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid rgba(148,163,184,0.6); font: inherit; background: var(--color-bg); }
      .ai-input input[type="text"]:focus-visible { outline: none; box-shadow: var(--focus-ring); border-color: transparent; }
      
      .resource-list, .assessment-list, .progress-stack { display: flex; flex-direction: column; gap: var(--space-4); }
      .resource-meta { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 6px; }
      .assessment-status { font-size: 0.875rem; font-weight: 600; margin-top: 6px; }
      .assessment-status--locked { color: var(--color-text-muted); }
      .assessment-status--available { color: var(--color-secondary); }
      .assessment-status--completed { color: var(--color-success); }
      .assessment-actions { margin-top: var(--space-3); display: flex; justify-content: flex-start; }
      
      .progress-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }
      .progress-stat { padding: var(--space-4); }
      .progress-stat__label { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); font-weight: 500; }
      .progress-stat__value { margin: 8px 0 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.03em; }
      .weak-topics { margin: 0; padding-left: 18px; font-size: 0.9375rem; color: var(--color-text); line-height: 1.6; }
      .recommendations { margin: 12px 0 0; font-size: 0.9375rem; color: var(--color-text); line-height: 1.6; }
      .badge-pill { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 0.8125rem; font-weight: 600; border: 1px solid rgba(148,163,184,0.4); }
      
      @media (max-width: 900px) { 
        .class-layout { grid-template-columns: 1fr; } 
        .class-sidebar { position: static; box-shadow: none; border-radius: 0; margin: 0 -var(--space-5); padding: var(--space-3) var(--space-5); }
        .class-sidebar__title { display: none; }
        .class-nav { flex-direction: row; overflow-x: auto; padding-bottom: 8px; gap: 8px; }
        .class-nav__btn { white-space: nowrap; width: auto; font-size: 0.875rem; padding: 10px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.3); }
        .class-nav__btn--active { background: #fff; color: var(--color-primary); }
        .class-nav__btn:hover:not(.class-nav__btn--active) { background: rgba(255,255,255,0.2); }
        .topic-view { grid-template-columns: 1fr; } 
        .topic-list-col { max-height: 240px; padding-right: 0; }
        .progress-grid { grid-template-columns: 1fr; }
      }
    `,
    view: () => {
      const role = getCurrentRole();
      const fullPath = location.pathname.split("?")[0].split("#")[0];
      const classId = fullPath.startsWith("/class/") ? fullPath.slice("/class/".length) : "";
      const merged = getMergedClasses();
      const course =
        merged.find(
          (c) =>
            c.id === classId ||
            c.code.toLowerCase() === classId.toLowerCase()
        ) ||
        merged[0];
      const details = course ? getClassDetailsForCourse(course) || mockClassDetails[course.id] || null : null;
      const deadline = details?.deadline || "No deadline set";
      const completionPct = course?.progress ?? 0;
      const headerProgress = ProgressBar({
        value: completionPct,
        label: "Course completion",
        className: "",
        animate: true,
      });

      const topics = details?.topics || [];
      const materials = details?.materials || [];
      const assessments = details?.assessments || [];
      const analytics = details?.analytics;

      const topicsListHtml = topics.length > 0
        ? topics
            .map((t, idx) => `
              <button type="button" class="topic-list-item ${idx === 0 ? "topic-list-item--active" : ""}" data-topic-id="${escapeAttr(t.id)}">
                <h4 class="topic-list-item__title">${escapeHtml(t.title)}</h4>
                <p class="topic-list-item__desc">${escapeHtml(t.description)}</p>
              </button>
            `)
            .join("")
        : `<p class="muted">No topics programmed yet.</p>`;

      const firstTopic = topics[0];
      const topicDetailHtml = firstTopic
        ? `
          <div class="topic-detail-card">
            <h2 class="card__title" id="class-topic-title" style="font-size:1.4rem;">${escapeHtml(firstTopic.title)}</h2>
            <p class="topic-card__desc" id="class-topic-desc" style="margin-top: 14px; font-size: 1.05rem; line-height: 1.7; color: var(--color-text);">${escapeHtml(firstTopic.description)}</p>
            <div style="margin-top: var(--space-4);">
              <button type="button" class="btn btn-primary" id="class-topic-start">Start Learning Focus</button>
            </div>
          </div>
        `
        : ``;

      const materialsHtml = materials.length > 0
        ? materials
            .map((m) => {
              const badge = `<span class="badge-pill">${escapeHtml(m.type)}</span>`;
              const body = `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                  <div>
                    <h3 class="card__title" style="margin-bottom:6px; font-size:1.1rem;">${escapeHtml(m.title)}</h3>
                    <p class="resource-meta">Type: ${badge}</p>
                  </div>
                  <button type="button" class="btn btn-outline" data-resource="${escapeAttr(m.id)}">Open Material</button>
                </div>
              `;
              return Card({ body, className: "ls-card-hover", ariaLabel: m.title });
            })
            .join("")
        : `<p class="muted">No materials uploaded yet.</p>`;

      const assessmentsHtml = assessments.length > 0
        ? assessments
            .map((a) => {
              const body = `
                <div>
                  <h3 class="card__title" style="margin-bottom:6px; font-size:1.1rem;">${escapeHtml(a.title)}</h3>
                  <p class="topic-list-item__desc">Topic: ${escapeHtml(a.topic)}</p>
                  <p class="assessment-status" data-assessment-status="${escapeAttr(a.id)}"></p>
                  <div class="assessment-actions">
                    <button type="button" class="btn btn-primary" data-assessment-start="${escapeAttr(a.id)}">Start Assessment</button>
                  </div>
                </div>
              `;
              return Card({ body, className: "ls-card-hover", ariaLabel: a.title });
            })
            .join("")
        : `<p class="muted">Assessments will appear here once published.</p>`;

      const scores = analytics?.scores || [];
      const weakTopics = scores.filter((s) => s.score < 65).map((s) => s.title);
      const topicsCompleted = analytics?.topicsCompleted ?? 0;
      const totalTopics = analytics?.totalTopics ?? topics.length ?? 0;
      const assessmentsCompleted = analytics?.assessmentsCompleted ?? 0;
      const totalAssessments = analytics?.totalAssessments ?? assessments.length ?? 0;
      const completionForAnalytics =
        totalTopics + totalAssessments > 0
          ? Math.round(((topicsCompleted + assessmentsCompleted) / (totalTopics + totalAssessments)) * 100)
          : completionPct;
      const analyticsProgress = ProgressBar({
        value: completionForAnalytics,
        label: "Overall Learning Completion",
        className: "",
        animate: true,
      });

      const mainContent = `
        <div style="margin-bottom: var(--space-4);">
          <a class="btn btn-outline ls-btn-scale" href="/student-dashboard" data-link style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.875rem; border-radius: 999px; background: var(--color-bg);">
            <span aria-hidden="true" style="font-size: 1.1em; line-height: 1;">&larr;</span> Back to Dashboard
          </a>
        </div>
        <section class="card class-header">
          <div class="class-header__top">
            <div>
              <h1 class="class-header__title">${escapeHtml(course?.name || "Class")}</h1>
              <p class="class-header__meta">Lecturer: ${escapeHtml(course?.lecturer || "TBA")}</p>
            </div>
            <div class="class-header__deadline">
              <strong>Completion deadline:</strong> ${escapeHtml(deadline)}
            </div>
          </div>
          <div>
            ${headerProgress}
          </div>
        </section>
        
        <div class="class-layout">
          <aside class="class-sidebar" aria-label="Class navigation">
            <h2 class="class-sidebar__title">Class Navigation</h2>
            <nav class="class-nav" id="class-nav">
              <button type="button" class="class-nav__btn class-nav__btn--active" data-class-tab="topics">Topics</button>
              <button type="button" class="class-nav__btn" data-class-tab="materials">Materials / PDFs</button>
              <button type="button" class="class-nav__btn" data-class-tab="assessments">Assessments</button>
              <button type="button" class="class-nav__btn" data-class-tab="progress">Progress Tracking</button>
            </nav>
          </aside>
          
          <main class="class-main">
            <!-- TOPICS SECTION -->
            <section class="class-section class-section--active" data-class-section="topics" aria-label="Topics">
              <div class="topic-view">
                <div class="topic-list-col">
                  ${topicsListHtml}
                </div>
                <div class="topic-detail-col">
                  <article class="card" style="padding: var(--space-5);">
                    <div id="topic-detail-wrap">${topicDetailHtml}</div>
                  </article>
                  
                  <article class="card ai-panel" aria-label="AI learning assistant" style="padding: var(--space-5);">
                    <h2 class="ai-panel__title" id="ai-panel-title">Ask AI Teacher</h2>
                    <p class="ai-panel__subtitle" id="ai-panel-subtitle">Ask questions, get simpler explanations or real-world examples about the current topic.</p>
                    <div class="ai-panel__body" id="ai-panel-body">
                      Select a topic to start, then ask "Explain this in simple terms" or "Give me an analogy".
                    </div>
                    <div class="ai-input">
                      <input type="text" id="ai-question-input" placeholder="Ask AI about this topic..." aria-label="Ask AI about this topic" />
                      <button type="button" class="btn btn-secondary" id="ai-question-btn">Ask AI</button>
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <!-- MATERIALS SECTION -->
            <section class="class-section" data-class-section="materials" aria-label="Materials and PDFs">
              <div class="resource-list" id="class-resource-grid">
                ${materialsHtml}
              </div>
            </section>

            <!-- ASSESSMENTS SECTION -->
            <section class="class-section" data-class-section="assessments" aria-label="Assessments">
              <p class="muted" style="margin:0 0 var(--space-4);font-size:0.9375rem;">
                Assessments unlock sequentially. Complete the previous quiz to unlock the next.
              </p>
              <div class="assessment-list" id="class-assessment-grid">
                ${assessmentsHtml}
              </div>
            </section>

            <!-- PROGRESS SECTION -->
            <section class="class-section" data-class-section="progress" aria-label="Progress tracking">
              <div class="progress-stack">
                <div class="progress-grid">
                  <article class="card progress-stat ls-card-hover">
                    <p class="progress-stat__label">Topics completed</p>
                    <p class="progress-stat__value">${topicsCompleted} / ${totalTopics}</p>
                  </article>
                  <article class="card progress-stat ls-card-hover">
                    <p class="progress-stat__label">Assessments done</p>
                    <p class="progress-stat__value">${assessmentsCompleted} / ${totalAssessments}</p>
                  </article>
                  <article class="card progress-stat ls-card-hover">
                    <p class="progress-stat__label">Upcoming deadline</p>
                    <p class="progress-stat__value" style="font-size:1.15rem;">${escapeHtml(deadline)}</p>
                  </article>
                </div>
                
                <article class="card ls-card-hover" style="padding:var(--space-5);">
                  <h2 class="card__title" style="margin-bottom:12px;">Track Record</h2>
                  <p class="topic-list-item__desc" style="margin-bottom:var(--space-4);">Your quiz and assessment scores overview.</p>
                  <ul class="weak-topics">
                    ${scores.length > 0
                        ? scores.map((s) => `<li>${escapeHtml(s.title)} – <strong>${s.score}%</strong></li>`).join("")
                        : "<li>No assessments scored yet.</li>"
                    }
                  </ul>
                  <div style="margin-top:var(--space-4);">
                    ${analyticsProgress}
                  </div>
                </article>
                
                <article class="card ls-card-hover" style="padding:var(--space-5);">
                  <h2 class="card__title" style="margin-bottom:12px;">AI Progress Recommendations</h2>
                  <p class="topic-list-item__desc">Insights to help you prioritize your next learning steps.</p>
                  ${weakTopics.length > 0
                      ? `<p class="recommendations" style="font-weight:600; margin-bottom:8px;">Weak topics identified:</p>
                         <ul class="weak-topics">
                           ${weakTopics.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
                         </ul>
                         <p class="recommendations">
                           ${weakTopics.length === 1
                               ? "Focus on revising this concept carefully using the AI Chat before taking the final."
                               : "Revise these topics using the learning materials and 'Ask AI' feature before attempting the final assessment."
                           }
                         </p>`
                      : `<p class="muted" style="margin-top:12px;">No specific weak areas detected yet. Keep up the good work!</p>`
                  }
                </article>
              </div>
            </section>
          </main>
        </div>
      `;
      return layoutDashboard(role, "/class", mainContent);
    },
    mount: () => {
      // Sidebar tab logic
      const navButtons = document.querySelectorAll(".class-nav__btn");
      const sections = document.querySelectorAll(".class-section");
      function setTab(kind) {
        navButtons.forEach((btn) => btn.classList.toggle("class-nav__btn--active", btn.dataset.classTab === kind));
        sections.forEach((section) => section.classList.toggle("class-section--active", section.dataset.classSection === kind));
      }
      navButtons.forEach((btn) => {
        btn.addEventListener("click", () => setTab(btn.dataset.classTab));
      });

      // Topics selection logic
      let currentTopicId = null;
      let currentTopicTitle = "";
      const topicItems = document.querySelectorAll(".topic-list-item");
      const titleEl = document.getElementById("class-topic-title");
      const descEl = document.getElementById("class-topic-desc");
      
      const aiInputEl = document.getElementById("ai-question-input");
      const aiBtnEl = document.getElementById("ai-question-btn");
      const aiBodyEl = document.getElementById("ai-panel-body");

      function selectTopic(item) {
        topicItems.forEach(t => t.classList.remove("topic-list-item--active"));
        item.classList.add("topic-list-item--active");
        
        const title = item.querySelector(".topic-list-item__title").textContent;
        const desc = item.querySelector(".topic-list-item__desc").textContent;
        
        currentTopicTitle = title;
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        
        if (aiBodyEl) aiBodyEl.textContent = "AI ready for questions on '" + title + "'.";
      }

      topicItems.forEach(item => {
        item.addEventListener("click", () => selectTopic(item));
      });
      
      // Select the first one by default if it exists
      if (topicItems.length > 0) {
        currentTopicTitle = topicItems[0].querySelector(".topic-list-item__title").textContent;
        if (aiBodyEl) aiBodyEl.textContent = "AI ready for questions on '" + currentTopicTitle + "'.";
      }

      // AI button
      aiBtnEl?.addEventListener("click", () => {
        const q = (aiInputEl?.value || "").trim();
        if (!q) return;
        if (aiBodyEl) {
          aiBodyEl.textContent = `Simulated AI for ${currentTopicTitle}: ${q}\n\nHere is a simple explanation: Think about the core structure first, then build up the complexity. Connect it back to real-world examples.`;
        }
        if (aiInputEl) aiInputEl.value = "";
        showToast("AI response loaded", "info");
      });

      // Materials mock logic
      document.querySelectorAll("[data-resource]").forEach(btn => {
        btn.addEventListener("click", () => showToast("Opening document...", "info"));
      });
      
      // Start learning button
      document.getElementById("class-topic-start")?.addEventListener("click", () => showToast("Switched to active focus learning", "success"));

      // Sequential assessments
      const assessmentIds = Array.from(document.querySelectorAll("[data-assessment-start]")).map(btn => btn.getAttribute("data-assessment-start"));
      const completed = new Set();
      function updateAssessmentStates() {
        assessmentIds.forEach((id, index) => {
          if (!id) return;
          const statusEl = document.querySelector(`[data-assessment-status="${id}"]`);
          const btn = document.querySelector(`[data-assessment-start="${id}"]`);
          const isFinal = id.toLowerCase() === "final";
          
          let state = "locked";
          if (completed.has(id)) state = "completed";
          else if (
            (!isFinal && (index === 0 || completed.has(assessmentIds[index - 1]))) ||
            (isFinal && assessmentIds.slice(0, -1).every(prev => completed.has(prev)))
          ) {
            state = "available";
          }
          
          if (statusEl) {
            statusEl.textContent = state === "locked" ? "Status: Locked" : state === "available" ? "Status: Available" : "Status: Completed";
            statusEl.className = `assessment-status assessment-status--${state}`;
          }
          if (btn) {
            btn.disabled = state === "locked";
            if (state === "locked") btn.textContent = "Locked 🔒";
            else if (state === "completed") btn.textContent = "Completed";
            else btn.textContent = "Start Assessment";
          }
        });
      }
      document.querySelectorAll("[data-assessment-start]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-assessment-start");
          if (!id || btn.disabled) return;
          completed.add(id);
          showToast("Assessment completed!", "success");
          updateAssessmentStates();
        });
      });
      updateAssessmentStates();

      // UI Toggles
      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
        setDarkMode(!getState().darkMode);
        navigate(location.pathname);
      });
      const toggleBtn = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("app-sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          toggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
    },
  },

  "/quiz": {
    title: "Quiz",
    style: `
      .page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--section-gap);
      }

      .question-card {
        width: 100%;
        max-width: 700px;
        padding: 28px;
      }

      .question {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }

      .options {
        margin-top: 18px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .option {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 12px;
        border-radius: 10px;
        border: 1px solid rgba(15, 23, 42, 0.12);
        background: rgba(255, 255, 255, 0.85);
        cursor: pointer;
      }

      .option:hover {
        border-color: rgba(37, 99, 235, 0.35);
      }

      .option input {
        margin-top: 3px;
      }

      .option span {
        color: var(--color-text);
      }

      .actions {
        margin-top: 18px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        flex-wrap: wrap;
      }
    `,
    view: () => `
      <main class="page">
        <section class="card question-card" aria-labelledby="quizQuestion">
          <h1 id="quizQuestion" class="question"></h1>

          <form id="quizForm">
            <div id="quizOptions" class="options" role="radiogroup" aria-label="Answer options"></div>

            <div class="actions">
              <a class="btn btn-outline" href="/student-dashboard" data-link>Back</a>
              <button id="quizNext" class="btn btn-primary" type="button">Next</button>
              <button id="quizSubmit" class="btn btn-primary" type="submit">Submit</button>
            </div>
          </form>
        </section>
      </main>
    `,
    mount: () => {
      const questions = mockQuizQuestions;
      let index = 0;
      const answers = {};
      const questionEl = document.getElementById("quizQuestion");
      const optionsEl = document.getElementById("quizOptions");
      const form = document.getElementById("quizForm");
      const nextBtn = document.getElementById("quizNext");
      const questionCard = document.querySelector(".question-card");

      function renderQuestion(direction) {
        const q = questions[index];
        if (!q || !questionEl || !optionsEl) return;
        if (questionCard) {
          questionCard.classList.remove("ls-quiz-slide-next", "ls-quiz-slide-prev");
          questionCard.offsetHeight;
          questionCard.classList.add(direction >= 0 ? "ls-quiz-slide-next" : "ls-quiz-slide-prev");
        }
        questionEl.textContent = `Q${index + 1}. ${q.text}`;
        optionsEl.innerHTML = "";
        Object.entries(q.options).forEach(([key, label]) => {
          const id = `q${index}_${key}`;
          const wrapper = document.createElement("label");
          wrapper.className = "option ls-option";
          wrapper.dataset.key = key;
          const input = document.createElement("input");
          input.type = "radio";
          input.name = "answer";
          input.value = key;
          input.id = id;
          if (answers[index] === key) input.checked = true;
          const span = document.createElement("span");
          span.textContent = label;
          wrapper.appendChild(input);
          wrapper.appendChild(span);
          optionsEl.appendChild(wrapper);
        });
        if (nextBtn) nextBtn.textContent = index < questions.length - 1 ? "Next" : "Review";
      }

      function getSelected() {
        if (!form) return null;
        return new FormData(form).get("answer");
      }

      optionsEl?.addEventListener("click", (e) => {
        const opt = e.target.closest(".ls-option");
        if (!opt) return;
        const key = opt.dataset.key;
        const q = questions[index];
        if (!q) return;
        const correct = key === q.correct;
        opt.classList.add(correct ? "ls-answer-correct" : "ls-answer-wrong");
        setTimeout(() => {
          opt.classList.remove("ls-answer-correct", "ls-answer-wrong");
        }, 600);
        if (correct) showToast("Correct!", "success"); else showToast("Incorrect", "error");
      });

      nextBtn?.addEventListener("click", () => {
        const sel = getSelected();
        if (sel) answers[index] = String(sel);
        if (index < questions.length - 1) {
          index += 1;
          renderQuestion(1);
        } else {
          index = 0;
          renderQuestion(0);
        }
      });

      let touchStartX = 0;
      questionCard?.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
      questionCard?.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 60) return;
        if (dx > 0 && index > 0) {
          index--;
          renderQuestion(-1);
        } else if (dx < 0 && index < questions.length - 1) {
          const sel = getSelected();
          if (sel) answers[index] = String(sel);
          index++;
          renderQuestion(1);
        }
      }, { passive: true });
      document.addEventListener("keydown", function quizKey(e) {
        if (!document.getElementById("quizQuestion")) return;
        if (e.key === "ArrowLeft" && index > 0) {
          index--;
          renderQuestion(-1);
        } else if (e.key === "ArrowRight" && index < questions.length - 1) {
          const sel = getSelected();
          if (sel) answers[index] = String(sel);
          index++;
          renderQuestion(1);
        }
      });

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const sel = getSelected();
        if (sel) answers[index] = String(sel);
        let score = 0;
        questions.forEach((q, i) => { if (answers[i] === q.correct) score += 1; });
        import("./lib/modal.js").then(({ showModal }) => {
          const total = questions.length;
          const pct = Math.round((score / total) * 100);
          showModal(
            `<div class="modal-inner">
              <h2 class="modal-title">Quiz complete</h2>
              <p class="modal-body">You scored <strong id="quizScoreDisplay">0</strong> out of ${total} (${pct}%).</p>
              <div class="modal-actions"><button type="button" class="btn btn-primary" id="quizCloseBtn">Close</button></div>
            </div>`,
            { closeOnOverlay: true }
          );
          const scoreEl = document.getElementById("quizScoreDisplay");
          const closeBtn = document.getElementById("quizCloseBtn");
          if (scoreEl) countUp("quizScoreDisplay", 0, score, 0, 400);
          closeBtn?.addEventListener("click", () => document.querySelector("#ls-modal-root .modal-backdrop")?.click());
        });
      });

      renderQuestion(0);
    },
  },

  "/analytics": {
    title: "Reports",
    style: `
      .page {
        min-height: 100vh;
        background: var(--color-bg);
      }

      .header {
        padding-block: var(--section-gap);
      }

      .title {
        margin: 0;
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .subtitle {
        margin: 6px 0 0;
        color: var(--color-text-muted);
      }

      .chart-card {
        padding: 20px;
      }

      .chart-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }

      .chart-title {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .legend {
        display: inline-flex;
        gap: 12px;
        align-items: center;
        color: var(--color-text-muted);
        font-size: 13px;
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        display: inline-block;
      }

      .dot--primary {
        background: var(--color-primary);
      }

      .chart-wrap {
        width: 100%;
        border-radius: 12px;
        background: linear-gradient(
          180deg,
          rgba(37, 99, 235, 0.06),
          rgba(37, 99, 235, 0)
        );
        border: 1px solid rgba(148, 163, 184, 0.25);
        padding: 14px;
      }

      .chart-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        color: var(--color-text-muted);
        font-size: 12px;
      }

      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin-top: var(--section-gap);
        padding-bottom: var(--section-gap);
      }

      @media (max-width: 900px) {
        .grid-2 {
          grid-template-columns: 1fr;
        }
      }

      .card-pad {
        padding: 20px;
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .kicker {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .hint {
        margin: 0;
        font-size: 13px;
        color: var(--color-text-muted);
      }

      .list {
        margin: 10px 0 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .topic {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(15, 23, 42, 0.1);
        background: rgba(255, 255, 255, 0.75);
      }

      .topic strong {
        font-size: 14px;
      }

      .topic small {
        color: var(--color-text-muted);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 700;
        border: 1px solid rgba(124, 58, 237, 0.25);
        color: var(--color-secondary);
        background: rgba(124, 58, 237, 0.1);
        white-space: nowrap;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 10px;
      }

      .stat {
        padding: 12px;
        border-radius: 12px;
        border: 1px solid rgba(15, 23, 42, 0.1);
        background: rgba(255, 255, 255, 0.75);
      }

      .stat .label {
        margin: 0;
        font-size: 12px;
        color: var(--color-text-muted);
        font-weight: 600;
      }

      .stat .value {
        margin: 6px 0 0;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.03em;
      }

      @media (max-width: 520px) {
        .stats {
          grid-template-columns: 1fr;
        }
      }
    `,
    view: () => `
      <div class="page">
        <header class="container header">
          <div style="margin-bottom: var(--space-4);">
            <a class="btn btn-outline" href="/lecturer-dashboard" data-link>← Back to Dashboard</a>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div>
              <h1 class="title">Reports</h1>
              <p class="subtitle">Academic performance insights across classes.</p>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <a class="btn btn-outline" href="/student-dashboard" data-link>Student</a>
              <a class="btn btn-outline" href="/lecturer-dashboard" data-link>Lecturer</a>
            </div>
          </div>
        </header>

        <main class="container">
          <section class="card chart-card" aria-label="Average score chart">
            <div class="chart-top">
              <div>
                <h2 class="chart-title">Average score (last 6 quizzes)</h2>
                <p class="hint" style="margin-top: 6px">
                  Trendline is a sample placeholder until real data is connected.
                </p>
              </div>
              <div class="legend" aria-label="Chart legend">
                <span class="legend-item">
                  <span class="dot dot--primary" aria-hidden="true"></span>
                  Average score
                </span>
              </div>
            </div>

            <div class="chart-wrap ls-graph-reveal" role="img" aria-label="Line chart placeholder">
              <svg
                viewBox="0 0 640 220"
                width="100%"
                height="220"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2563EB" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#2563EB" stop-opacity="0.02" />
                  </linearGradient>
                </defs>

                <g stroke="rgba(148,163,184,0.25)" stroke-width="1">
                  <line x1="40" y1="40" x2="620" y2="40" />
                  <line x1="40" y1="90" x2="620" y2="90" />
                  <line x1="40" y1="140" x2="620" y2="140" />
                  <line x1="40" y1="190" x2="620" y2="190" />
                </g>

                <g stroke="rgba(15,23,42,0.22)" stroke-width="1.2">
                  <line x1="40" y1="20" x2="40" y2="200" />
                  <line x1="40" y1="200" x2="620" y2="200" />
                </g>

                <path
                  d="M40,200 L40,140 L156,120 L272,135 L388,100 L504,110 L620,80 L620,200 Z"
                  fill="url(#fillBlue)"
                />

                <path
                  d="M40,140 L156,120 L272,135 L388,100 L504,110 L620,80"
                  fill="none"
                  stroke="#2563EB"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <g fill="#2563EB">
                  <circle cx="40" cy="140" r="4" />
                  <circle cx="156" cy="120" r="4" />
                  <circle cx="272" cy="135" r="4" />
                  <circle cx="388" cy="100" r="4" />
                  <circle cx="504" cy="110" r="4" />
                  <circle cx="620" cy="80" r="4" />
                </g>

                <g fill="rgba(17,24,39,0.65)" font-size="11">
                  <text x="6" y="44">90%</text>
                  <text x="6" y="94">80%</text>
                  <text x="6" y="144">70%</text>
                  <text x="6" y="194">60%</text>
                </g>
              </svg>

              <div class="chart-meta" aria-hidden="true">
                <span>Quiz 1</span>
                <span>Quiz 2</span>
                <span>Quiz 3</span>
                <span>Quiz 4</span>
                <span>Quiz 5</span>
                <span>Quiz 6</span>
              </div>
            </div>
          </section>

          <section class="grid-2" aria-label="Analytics breakdown">
            <article class="card card-pad" aria-label="Weak topics list">
              <div class="card-head">
                <div>
                  <h3 class="kicker">Weak Topics</h3>
                  <p class="hint">Areas where students commonly need support.</p>
                </div>
                <span class="pill">Needs focus</span>
              </div>

              <ul class="list">
                <li class="topic">
                  <div>
                    <strong>Evaluation metrics</strong><br />
                    <small>Accuracy vs. precision/recall</small>
                  </div>
                  <span class="pill">High</span>
                </li>
                <li class="topic">
                  <div>
                    <strong>Overfitting</strong><br />
                    <small>Bias-variance tradeoff</small>
                  </div>
                  <span class="pill">Medium</span>
                </li>
                <li class="topic">
                  <div>
                    <strong>Feature scaling</strong><br />
                    <small>Normalization vs. standardization</small>
                  </div>
                  <span class="pill">Medium</span>
                </li>
              </ul>
            </article>

            <article class="card card-pad" aria-label="Student activity summary">
              <div class="card-head">
                <div>
                  <h3 class="kicker">Student Activity</h3>
                  <p class="hint">Engagement summary for the current week.</p>
                </div>
                <span class="badge badge-success">Active</span>
              </div>

              <div class="stats">
                <div class="stat">
                  <p class="label">Weekly active students</p>
                  <p class="value">184</p>
                </div>
                <div class="stat">
                  <p class="label">Avg. time per module</p>
                  <p class="value">34m</p>
                </div>
                <div class="stat">
                  <p class="label">Quizzes attempted</p>
                  <p class="value">612</p>
                </div>
                <div class="stat">
                  <p class="label">Completion rate</p>
                  <p class="value">78%</p>
                </div>
              </div>
            </article>
          </section>
        </main>
      </div>
    `,
  },

  "/create-class": {
    title: "Create Class",
    style: `
      .dash { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; }
      .content { background: var(--color-bg); padding: var(--section-gap); }
      .form-card { width: 100%; max-width: 720px; padding: 32px; }
      .title { margin: 0 0 16px; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
      .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
      .field label { font-size: 14px; font-weight: 500; color: var(--color-text); }
      .field input[type="text"],
      .field input[type="date"],
      .field select,
      .field textarea {
        padding: 10px 12px; border-radius: 6px; border: 1px solid rgba(15, 23, 42, 0.16); font: inherit; background: var(--color-card);
      }
      .field select[multiple] { min-height: 160px; padding: 8px; }
      .field select[multiple] option { padding: 4px 6px; }
      .field .hint { font-size: 12px; color: var(--color-text-muted); margin: 0; }
      .field input:focus-visible, .field textarea:focus-visible, .field select:focus-visible { outline: none; box-shadow: var(--focus-ring); border-color: transparent; }
      .create-btn { width: 100%; height: 45px; margin-top: 4px; }
      .code-box { display: none; margin-top: 18px; padding: 16px; border-radius: 12px; border: 1px solid rgba(124, 58, 237, 0.25); background: rgba(124, 58, 237, 0.08); }
      .code-box--visible { display: block; }
      .code-box__row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
      .code-label { margin: 0; font-size: 13px; font-weight: 600; color: rgba(17, 24, 39, 0.8); }
      .code-created { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: var(--color-success); }
      .code-value { margin: 6px 0 0; font-size: 22px; font-weight: 800; letter-spacing: 0.08em; color: var(--color-secondary); }
      .assessment-section { margin-bottom: var(--space-4); }
      .assessment-section__title { margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 700; }
      .assessment-q-card { padding: var(--space-4); margin-bottom: var(--space-4); border: 1px solid rgba(148,163,184,0.25); border-radius: var(--radius-lg); background: var(--color-card); }
      .assessment-q-card__num { margin: 0 0 var(--space-3); font-size: 0.875rem; font-weight: 700; color: var(--color-primary); }
      .assessment-q-card .opt-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-2); }
      @media (max-width: 520px) { .assessment-q-card .opt-row { grid-template-columns: 1fr; } }
    `,
    view: () => {
      const role = getCurrentRole();
      const subjectOptions = Object.keys(SUBJECT_TOPICS_MAP)
        .map((k) => `<option value="${escapeAttr(k)}">${escapeHtml(k)}</option>`)
        .join("");
      const firstQ = `
        <div class="assessment-q-card" data-assessment-q>
          <p class="assessment-q-card__num">Question 1</p>
          <div class="field">
            <label>Question</label>
            <input type="text" class="q-text" placeholder="Enter question text" required />
          </div>
          <p class="hint" style="margin-bottom:8px;">Options</p>
          <div class="opt-row">
            <div class="field" style="margin-bottom:8px;"><label>Option A</label><input type="text" class="opt-a" placeholder="Option A" required /></div>
            <div class="field" style="margin-bottom:8px;"><label>Option B</label><input type="text" class="opt-b" placeholder="Option B" required /></div>
          </div>
          <div class="opt-row">
            <div class="field" style="margin-bottom:8px;"><label>Option C</label><input type="text" class="opt-c" placeholder="Option C" required /></div>
            <div class="field" style="margin-bottom:8px;"><label>Option D</label><input type="text" class="opt-d" placeholder="Option D" required /></div>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label for="q0-correct">Correct answer</label>
            <select id="q0-correct" class="q-correct">
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
          </div>
        </div>`;
      const mainContent = `
        <section class="card form-card" aria-labelledby="create-class-title">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <h1 id="create-class-title" class="title" style="margin-bottom:0">Create Class</h1>
            <a class="btn btn-outline" href="/lecturer-dashboard" data-link>Back</a>
          </div>
          <p class="muted" style="margin: 10px 0 16px">
            Fill in the details below. A unique class code will be generated for students to join.
          </p>

          <form id="createClassForm">
            <div class="field">
              <label for="className">Class Name</label>
              <input id="className" name="className" type="text" placeholder="e.g., Intro to AI" required />
            </div>
            <div class="field">
              <label for="subjectSelect">Subject Name</label>
              <p class="hint">Choose a subject — available topics update below.</p>
              <select id="subjectSelect" name="subject" required>
                <option value="">Select subject</option>
                ${subjectOptions}
              </select>
            </div>
            <div class="field">
              <label for="topicsMulti">Topics</label>
              <p class="hint">Hold Ctrl (Windows) or ⌘ (Mac) to select multiple topics.</p>
              <select id="topicsMulti" name="topics" multiple size="8" disabled aria-label="Topics for selected subject"></select>
            </div>
            <div class="assessment-section">
              <h2 class="assessment-section__title">Final assessment design</h2>
              <div id="assessment-questions-container">${firstQ}</div>
              <button type="button" class="btn btn-outline" id="add-assessment-question">Add Question</button>
            </div>
            <div class="field">
              <label for="deadline">Course completion deadline</label>
              <input id="deadline" name="deadline" type="date" required />
            </div>
            <button class="btn btn-primary create-btn" type="submit">Create Class</button>
          </form>

          <div id="codeBox" class="code-box" aria-live="polite">
            <p class="code-created" id="codeCreatedMsg">Class Created</p>
            <div class="code-box__row">
              <div>
                <p class="code-label">Share this code with students</p>
                <div id="classCode" class="code-value">CLS0000</div>
              </div>
              <button id="copyBtn" class="btn btn-outline" type="button">Copy</button>
            </div>
          </div>
          <div style="margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid rgba(15,23,42,0.1);">
            <button type="button" class="btn btn-outline" id="deleteClassBtn" style="color: var(--color-error); border-color: rgba(239,68,68,0.4);">Remove most recently created class</button>
          </div>
        </section>
      `;
      return layoutDashboard(role, "/create-class", mainContent);
    },
    mount: () => {
      const form = document.getElementById("createClassForm");
      const codeBox = document.getElementById("codeBox");
      const classCodeEl = document.getElementById("classCode");
      const copyBtn = document.getElementById("copyBtn");
      const deleteBtn = document.getElementById("deleteClassBtn");
      const subjectSelect = document.getElementById("subjectSelect");
      const topicsMulti = document.getElementById("topicsMulti");
      const assessmentContainer = document.getElementById("assessment-questions-container");
      const addQBtn = document.getElementById("add-assessment-question");

      function fillTopicsForSubject(subjectKey) {
        if (!topicsMulti) return;
        topicsMulti.innerHTML = "";
        topicsMulti.disabled = !subjectKey;
        if (!subjectKey) return;
        const list = SUBJECT_TOPICS_MAP[subjectKey] || [];
        list.forEach((t) => {
          const opt = document.createElement("option");
          opt.value = t;
          opt.textContent = t;
          topicsMulti.appendChild(opt);
        });
      }

      subjectSelect?.addEventListener("change", () => {
        fillTopicsForSubject(subjectSelect.value);
      });

      function renumberAssessmentQuestions() {
        assessmentContainer?.querySelectorAll("[data-assessment-q]").forEach((card, i) => {
          const num = card.querySelector(".assessment-q-card__num");
          if (num) num.textContent = `Question ${i + 1}`;
        });
      }

      function buildQuestionCardHtml(index) {
        const n = index + 1;
        return `
        <div class="assessment-q-card" data-assessment-q>
          <p class="assessment-q-card__num">Question ${n}</p>
          <div class="field">
            <label>Question</label>
            <input type="text" class="q-text" placeholder="Enter question text" required />
          </div>
          <p class="hint" style="margin-bottom:8px;">Options</p>
          <div class="opt-row">
            <div class="field" style="margin-bottom:8px;"><label>Option A</label><input type="text" class="opt-a" placeholder="Option A" required /></div>
            <div class="field" style="margin-bottom:8px;"><label>Option B</label><input type="text" class="opt-b" placeholder="Option B" required /></div>
          </div>
          <div class="opt-row">
            <div class="field" style="margin-bottom:8px;"><label>Option C</label><input type="text" class="opt-c" placeholder="Option C" required /></div>
            <div class="field" style="margin-bottom:8px;"><label>Option D</label><input type="text" class="opt-d" placeholder="Option D" required /></div>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label>Correct answer</label>
            <select class="q-correct">
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
            </select>
          </div>
        </div>`;
      }

      addQBtn?.addEventListener("click", () => {
        if (!assessmentContainer) return;
        const idx = assessmentContainer.querySelectorAll("[data-assessment-q]").length;
        assessmentContainer.insertAdjacentHTML("beforeend", buildQuestionCardHtml(idx));
        renumberAssessmentQuestions();
      });

      function generateUniqueCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const existing = new Set(getLecturerClasses().map((c) => c.code));
        let code = "";
        for (let attempt = 0; attempt < 50; attempt++) {
          code = "CLS";
          for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
          if (!existing.has(code)) return code;
        }
        return `CLS${Date.now().toString(36).toUpperCase().slice(-4)}`;
      }

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const className = document.getElementById("className")?.value?.trim();
        const subject = subjectSelect?.value?.trim();
        const deadline = document.getElementById("deadline")?.value || "";
        if (!className || !subject || !deadline) return;
        const selectedTopics = topicsMulti ? Array.from(topicsMulti.selectedOptions).map((o) => o.value) : [];
        if (selectedTopics.length === 0) {
          showToast("Select at least one topic (Ctrl/Cmd + click).", "error");
          return;
        }
        const qCards = assessmentContainer?.querySelectorAll("[data-assessment-q]") || [];
        const assessmentQuestions = [];
        for (const card of qCards) {
          const text = card.querySelector(".q-text")?.value?.trim();
          const a = card.querySelector(".opt-a")?.value?.trim();
          const b = card.querySelector(".opt-b")?.value?.trim();
          const c = card.querySelector(".opt-c")?.value?.trim();
          const d = card.querySelector(".opt-d")?.value?.trim();
          const correct = card.querySelector(".q-correct")?.value || "a";
          if (!text || !a || !b || !c || !d) {
            showToast("Complete all question fields in Final assessment.", "error");
            return;
          }
          assessmentQuestions.push({ question: text, options: { a, b, c, d }, correct });
        }
        if (assessmentQuestions.length === 0) {
          showToast("Add at least one assessment question.", "error");
          return;
        }
        const topics = selectedTopics.map((title) => ({ title, description: "" }));
        const finalAssessmentSummary = `${assessmentQuestions.length} MCQ question(s)`;
        const code = generateUniqueCode();
        const id = `lc-${Date.now()}`;
        const user = getState().user;
        const record = {
          id,
          code,
          name: className,
          subject,
          topics,
          assessmentQuestions,
          finalAssessmentSummary,
          finalAssessment: finalAssessmentSummary,
          deadline,
          lecturerName: user?.email?.split("@")[0] || "Lecturer",
          studentCount: Math.floor(12 + Math.random() * 40),
          completionPct: Math.floor(20 + Math.random() * 50),
          avgAssessmentScore: Math.floor(68 + Math.random() * 20),
          dailyActiveStudents: Math.floor(8 + Math.random() * 25),
          weakTopics: ["Concept recall", selectedTopics[0] ? `${selectedTopics[0]} (depth)` : "Practice gaps"].slice(0, 3),
        };
        addLecturerClass(record);
        if (classCodeEl) classCodeEl.textContent = code;
        codeBox?.classList.add("code-box--visible");
        showToast("Class created!", "success");
        form.reset();
        fillTopicsForSubject("");
        if (assessmentContainer) {
          assessmentContainer.innerHTML = buildQuestionCardHtml(0);
          renumberAssessmentQuestions();
        }
      });

      copyBtn?.addEventListener("click", async () => {
        const code = (classCodeEl?.textContent || "").trim();
        try {
          await navigator.clipboard.writeText(code);
          copyBtn.textContent = "Copied";
          showToast("Code copied to clipboard", "success");
          setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
        } catch {
          copyBtn.textContent = "Copy failed";
          setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
        }
      });

      deleteBtn?.addEventListener("click", () => {
        const list = getLecturerClasses();
        if (list.length === 0) {
          showToast("No saved classes to remove.", "info");
          return;
        }
        confirmModal({
          title: "Remove most recent class?",
          body: "This removes the last created class from your list. Students who saved the code may still need a new invite.",
          confirmLabel: "Remove",
          cancelLabel: "Cancel",
          danger: true,
        }).then((ok) => {
          if (ok && list[0]) {
            removeLecturerClass(list[0].id);
            showToast("Class removed from list.", "info");
            codeBox?.classList.remove("code-box--visible");
          }
        });
      });

      document.getElementById("dark-mode-toggle")?.addEventListener("click", () => {
        setDarkMode(!getState().darkMode);
        navigate("/create-class");
      });
      const toggleBtn = document.getElementById("sidebar-toggle");
      const sidebar = document.getElementById("app-sidebar");
      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
          toggleSidebar();
          sidebar.classList.toggle("sidebar--collapsed", getState().sidebarCollapsed);
          toggleBtn.querySelector(".sidebar__toggle-icon").textContent = getState().sidebarCollapsed ? "→" : "←";
        });
      }
    },
  },
};

function render() {
  if (!outlet || !routeStyle) return;
  const path = normalizePath(location?.pathname || "/");
  const route = routes[path] || routes["/"];

  routeStyle.textContent = route.style || "";
  setTitle(route.title);
  outlet.innerHTML = route.view();
  route.mount?.();

  const currentPath = normalizePath(location.pathname);
  const currentHash = location.hash || "";
  document.querySelectorAll("a[data-nav]").forEach((a) => {
    const target = a.getAttribute("data-nav");
    if (!target) return;
    
    const targetPath = target.split("#")[0];
    const targetHash = target.includes("#") ? "#" + target.split("#")[1] : "";
    const pathMatch = targetPath === currentPath;
    
    const isDashboard = target === "/student-dashboard";
    const hashMatch = isDashboard ? (!currentHash || currentHash === "" || currentHash === "#dashboard") : (currentHash === targetHash);
    
    if (pathMatch && hashMatch) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });

  document.querySelectorAll(".ls-ripple-container").forEach((el) => {
    if (el.dataset.rippleAttached) return;
    el.dataset.rippleAttached = "1";
    el.style.position = "relative";
    el.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement("span");
      ripple.className = "ripple-effect";
      ripple.style.cssText = `left:${x}px;top:${y}px;`;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

window.addEventListener("popstate", render);

document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  if (!a.hasAttribute("data-link")) return;
  if (!isInternalLink(a)) return;
  e.preventDefault();
  navigate(a.getAttribute("href"));
});

render();


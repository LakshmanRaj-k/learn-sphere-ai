/**
 * Global app state — prototype only, no backend.
 * Persist minimal data in localStorage for demo.
 */

const STORAGE_KEY = "lsAppState";

const defaultState = {
  user: null, // { userId, role: 'student' | 'lecturer', email? }
  darkMode: false,
  sidebarCollapsed: false,
  revisionList: [], // topic ids or titles for "Revision List"
  bookmarks: [], // topic ids bookmarked in Learn
  // Student learning modes
  discussedTopics: [], // { subject, topic, date } - topics discussed in Personalized Learning Space
  freeAIChat: [], // { role: 'user'|'assistant', content } - Ask AI history
  freeAIContext: null, // Track current AI topic context
  quizAttempts: [], // { topic, score, total, correct, incorrect, date }
  /** Personalized Learning Space modules */
  learningModules: [],
  /** Lecturer-created classes (prototype) */
  lecturerClasses: [],
};

let state = { ...defaultState };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        ...defaultState,
        ...parsed,
        revisionList: Array.isArray(parsed.revisionList) ? parsed.revisionList : defaultState.revisionList,
        bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : defaultState.bookmarks,
        discussedTopics: Array.isArray(parsed.discussedTopics) ? parsed.discussedTopics : defaultState.discussedTopics,
        freeAIChat: Array.isArray(parsed.freeAIChat) ? parsed.freeAIChat : defaultState.freeAIChat,
        freeAIContext: parsed.freeAIContext || defaultState.freeAIContext,
        quizAttempts: parsed.quizAttempts || defaultState.quizAttempts,
        learningModules: Array.isArray(parsed.learningModules) ? parsed.learningModules : defaultState.learningModules,
        lecturerClasses: Array.isArray(parsed.lecturerClasses) ? parsed.lecturerClasses : defaultState.lecturerClasses,
      };
    }
    const userRaw = localStorage.getItem("lsUser");
    if (userRaw) {
      state.user = JSON.parse(userRaw);
    }
  } catch (_) {
    state = { ...defaultState };
  }
}

function save() {
  try {
    const toSave = {
      darkMode: state.darkMode,
      sidebarCollapsed: state.sidebarCollapsed,
      revisionList: state.revisionList,
      bookmarks: state.bookmarks,
      discussedTopics: state.discussedTopics,
      freeAIChat: state.freeAIChat,
      freeAIContext: state.freeAIContext,
      quizAttempts: state.quizAttempts,
      learningModules: state.learningModules,
      lecturerClasses: state.lecturerClasses,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (_) {}
}

export function getState() {
  return state;
}

export function getCurrentRole() {
  return state.user?.role ?? "student";
}

export function setUser(user) {
  state.user = user;
  try {
    if (user) localStorage.setItem("lsUser", JSON.stringify(user));
    else localStorage.removeItem("lsUser");
  } catch (_) {}
}

export function setDarkMode(value) {
  state.darkMode = !!value;
  save();
  document.documentElement.setAttribute("data-theme", value ? "dark" : "light");
}

export function toggleDarkMode() {
  setDarkMode(!state.darkMode);
  return state.darkMode;
}

export function setSidebarCollapsed(value) {
  state.sidebarCollapsed = !!value;
  save();
}

export function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  save();
  return state.sidebarCollapsed;
}

export function addToRevisionList(item) {
  if (!state.revisionList.includes(item)) {
    state.revisionList = [...state.revisionList, item];
    save();
  }
}

export function removeFromRevisionList(item) {
  state.revisionList = state.revisionList.filter((x) => x !== item);
  save();
}

export function getRevisionList() {
  return state.revisionList;
}

export function toggleBookmark(id) {
  const i = state.bookmarks.indexOf(id);
  if (i >= 0) state.bookmarks = state.bookmarks.filter((_, idx) => idx !== i);
  else state.bookmarks = [...state.bookmarks, id];
  save();
  return state.bookmarks.includes(id);
}

export function isBookmarked(id) {
  return state.bookmarks.includes(id);
}

// Discussed topics (Personalized Learning Space)
export function addDiscussedTopic(subject, topic) {
  const existing = state.discussedTopics.find(
    (t) => t.subject === subject && t.topic === topic
  );
  if (existing) {
    existing.interactions = (existing.interactions || 1) + 1;
    existing.date = new Date().toISOString().slice(0, 10);
    state.discussedTopics = [existing, ...state.discussedTopics.filter(t => t !== existing)];
    save();
  } else {
    state.discussedTopics = [
      { subject, topic, date: new Date().toISOString().slice(0, 10), interactions: 1 },
      ...state.discussedTopics,
    ];
    save();
  }
}

export function getDiscussedTopics() {
  return state.discussedTopics;
}

// Ask AI chat
export function addChatMessage(role, content) {
  state.freeAIChat = [...state.freeAIChat, { role, content }];
  save();
}

export function getFreeAIChat() {
  return state.freeAIChat;
}

export function setFreeAIContext(topic) {
  state.freeAIContext = topic;
  save();
}

export function getFreeAIContext() {
  return state.freeAIContext;
}

// Quiz attempts
export function addQuizAttempt(topic, score, total, correct, incorrect) {
  state.quizAttempts = [
    { topic, score, total, correct, incorrect, date: new Date().toISOString().slice(0, 10) },
    ...state.quizAttempts,
  ];
  save();
}

export function getQuizAttempts() {
  return state.quizAttempts;
}

/** @typedef {{ id: string, code: string, name: string, subject: string, topics: { title: string, description?: string }[], finalAssessment: string, deadline: string, lecturerName?: string, studentCount?: number, completionPct?: number, avgAssessmentScore?: number, dailyActiveStudents?: number, weakTopics?: string[] }} LecturerClass */

export function getLecturerClasses() {
  return state.lecturerClasses;
}

export function getLecturerClassById(id) {
  return state.lecturerClasses.find((c) => c.id === id) || null;
}

export function addLecturerClass(record) {
  state.lecturerClasses = [record, ...state.lecturerClasses];
  save();
}

export function removeLecturerClass(id) {
  state.lecturerClasses = state.lecturerClasses.filter((c) => c.id !== id);
  save();
}

// Learning Modules
export function getLearningModules() {
  return state.learningModules;
}

export function addLearningModule(subject, topics) {
  const newModule = {
    id: `m-${Date.now()}`,
    subject,
    topics,
    progress: 0,
    created_at: new Date().toISOString()
  };
  state.learningModules = [newModule, ...state.learningModules];
  save();
  return newModule;
}

// Init: load from storage and apply theme
load();
document.documentElement.setAttribute("data-theme", state.darkMode ? "dark" : "light");

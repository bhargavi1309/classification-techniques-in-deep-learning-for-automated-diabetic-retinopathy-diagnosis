/* ─────────────────────────────────────────────────────────────────
   app.js  — SPA Router & Global Utilities
   ───────────────────────────────────────────────────────────────── */
const API_BASE = "http://localhost:5000/api";

/* ── Router ─────────────────────────────────────────────────────── */
function navigateTo(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));

  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add("active");

  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add("active");

  // Trigger page-specific initialisation
  const initMap = {
    dashboard: () => typeof initDashboard === "function" && initDashboard(),
    history:   () => typeof initHistory   === "function" && initHistory(),
    patients:  () => typeof initPatients  === "function" && initPatients(),
  };
  if (initMap[pageId]) initMap[pageId]();

  // Close sidebar on mobile after navigation
  document.getElementById("sidebar")?.classList.remove("open");
}

// Attach sidebar nav clicks
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

// Mobile hamburger
document.getElementById("hamburger")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

/* ── API helpers ────────────────────────────────────────────────── */
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path, body, isForm = false) {
  const opts = { method: "POST" };
  if (isForm) {
    opts.body = body;
  } else {
    opts.headers = { "Content-Type": "application/json" };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* ── Toast notifications ────────────────────────────────────────── */
let toastTimer;
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

/* ── API health check ───────────────────────────────────────────── */
async function checkApiStatus() {
  const dot  = document.querySelector(".status-dot");
  const text = document.querySelector(".status-text");
  try {
    await apiGet("/health");
    dot.className  = "status-dot online";
    text.textContent = "API Connected";
  } catch {
    dot.className  = "status-dot offline";
    text.textContent = "API Offline";
  }
}

/* ── Grade styling helpers ──────────────────────────────────────── */
const GRADE_COLORS = ["#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];
const GRADE_LABELS = ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"];
function gradePillHTML(grade) {
  return `<span class="grade-pill g${grade}">${GRADE_LABELS[grade]}</span>`;
}

/* ── Date formatter ─────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/* ── Expose globally ────────────────────────────────────────────── */
window.navigateTo = navigateTo;
window.apiGet     = apiGet;
window.apiPost    = apiPost;
window.apiDelete  = apiDelete;
window.showToast  = showToast;
window.API_BASE   = API_BASE;
window.GRADE_COLORS = GRADE_COLORS;
window.GRADE_LABELS = GRADE_LABELS;
window.gradePillHTML = gradePillHTML;
window.fmtDate    = fmtDate;

/* ── Init ───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  checkApiStatus();
  setInterval(checkApiStatus, 30000);
  navigateTo("dashboard");
});

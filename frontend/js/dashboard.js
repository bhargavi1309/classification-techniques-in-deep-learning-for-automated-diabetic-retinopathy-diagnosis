/* ─────────────────────────────────────────────────────────────────
   dashboard.js  — Dashboard stats, charts, and recent activity
   ───────────────────────────────────────────────────────────────── */

let gradeChart, weeklyChart;

async function initDashboard() {
    try {
        const [stats, history] = await Promise.all([
            apiGet("/stats"),
            apiGet("/history")
        ]);
        renderStatCards(stats);
        renderGradeChart(stats);
        renderWeeklyChart(stats);
        renderRecentList(history.slice(0, 6));
    } catch (e) {
        document.getElementById("recentList").innerHTML =
            `<p style="color:var(--accent-red);text-align:center">Could not load dashboard — is the Flask server running?<br><small>${e.message}</small></p>`;
    }
}

function renderStatCards(stats) {
    animateNumber("valTotalScans", 0, stats.total_scans, 800);
    animateNumber("valTotalPatients", 0, stats.total_patients, 800);

    const nodrEl = document.getElementById("valNoDR");
    const refEl = document.getElementById("valReferralRate");
    setTimeout(() => {
        nodrEl.textContent = stats.grade_counts[0];
        refEl.textContent = stats.referral_rate + "%";
    }, 300);
}

function animateNumber(id, from, to, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + (to - from) * ease);
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function renderGradeChart(stats) {
    const ctx = document.getElementById("gradeChart");
    if (!ctx) return;
    if (gradeChart) gradeChart.destroy();

    gradeChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: stats.grade_labels,
            datasets: [{
                data: stats.grade_counts,
                backgroundColor: ["#22c55e44", "#84cc1644", "#f59e0b44", "#f9731644", "#ef444444"],
                borderColor: ["#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"],
                borderWidth: 2,
                hoverOffset: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: "65%",
            plugins: {
                legend: {
                    position: "right",
                    labels: { color: "#94a3b8", font: { size: 11 }, padding: 10, usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ${ctx.parsed} scans`
                    }
                }
            }
        }
    });
}

function renderWeeklyChart(stats) {
    const ctx = document.getElementById("weeklyChart");
    if (!ctx) return;
    if (weeklyChart) weeklyChart.destroy();

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    weeklyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: days,
            datasets: [{
                label: "Scans",
                data: stats.weekly_scans,
                backgroundColor: "rgba(6,182,212,0.25)",
                borderColor: "#06b6d4",
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: { color: "#94a3b8", stepSize: 3 },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8" },
                    border: { display: false }
                }
            }
        }
    });
}

function renderRecentList(history) {
    const el = document.getElementById("recentList");
    if (!history.length) {
        el.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:1rem">No records yet.</p>`;
        return;
    }
    el.innerHTML = history.map(h => `
    <div class="recent-item">
      <div class="grade-pill g${h.grade}" style="min-width:28px;text-align:center">${h.grade}</div>
      <div class="recent-name">${h.patient_name}</div>
      <div style="font-size:0.82rem;color:var(--text-secondary)">${h.label}</div>
      <div class="recent-time">${fmtDate(h.timestamp)}</div>
    </div>
  `).join("");
}

window.initDashboard = initDashboard;

/* ─────────────────────────────────────────────────────────────────
   results.js  — Display classification result with Grad-CAM
   ───────────────────────────────────────────────────────────────── */

function showResult(data) {
    // Page subtitle
    document.getElementById("resultSubtitle").textContent =
        `Patient: ${data.patient_name || "Unknown"} · Eye: ${data.eye || "—"}`;

    // Grade badge
    const badge = document.getElementById("gradeBadge");
    badge.textContent = data.grade;
    badge.style.color = data.color;
    badge.style.borderColor = data.color;
    badge.style.boxShadow = `0 0 24px ${data.color}44`;

    document.getElementById("gradeLabel").textContent = data.label;
    document.getElementById("gradeLabel").style.color = data.color;
    document.getElementById("gradeConfidence").textContent =
        `${(data.confidence * 100).toFixed(1)}%`;

    // Recommendation
    document.getElementById("recommendationText").textContent = data.recommendation;

    // Images
    if (data.processed_image) {
        document.getElementById("resultOriginal").src = `data:image/jpeg;base64,${data.processed_image}`;
    }
    if (data.heatmap) {
        document.getElementById("resultHeatmap").src = `data:image/jpeg;base64,${data.heatmap}`;
    }

    // Confidence bars
    renderConfidenceBars(data.scores, data.grade, data.grade_labels);
}

function renderConfidenceBars(scores, predicted, labels) {
    const barColors = GRADE_COLORS;
    const container = document.getElementById("confidenceBars");
    container.innerHTML = scores.map((score, i) => {
        const pct = (score * 100).toFixed(1);
        const bold = i === predicted ? "font-weight:700;color:var(--text-primary)" : "";
        return `
      <div class="conf-bar-row">
        <div class="conf-bar-label">
          <span class="conf-bar-name" style="${bold}">
            ${i === predicted ? "▶ " : ""}Grade ${i} — ${labels[i]}
          </span>
          <span class="conf-bar-val" style="color:${barColors[i]}">${pct}%</span>
        </div>
        <div class="conf-bar-track">
          <div class="conf-bar-fill"
               style="width:0%;background:${barColors[i]}"
               data-target="${pct}"></div>
        </div>
      </div>`;
    }).join("");

    // Animate bars
    requestAnimationFrame(() => {
        container.querySelectorAll(".conf-bar-fill").forEach(bar => {
            setTimeout(() => {
                bar.style.width = bar.dataset.target + "%";
            }, 80);
        });
    });
}

// New scan button
document.getElementById("btnNewScan")?.addEventListener("click", () => {
    navigateTo("upload");
});

// View history button
document.getElementById("btnViewHistory")?.addEventListener("click", () => {
    navigateTo("history");
});

window.showResult = showResult;

/* ─────────────────────────────────────────────────────────────────
   history.js  — Classification history table with search & filter
   ───────────────────────────────────────────────────────────────── */

let allHistory = [];
let activeGrade = "all";

async function initHistory() {
    try {
        allHistory = await apiGet("/history");
        renderHistoryTable(allHistory);
    } catch (e) {
        document.getElementById("historyBody").innerHTML =
            `<tr><td colspan="6" style="text-align:center;color:var(--accent-red)">
        Failed to load — is the Flask server running?<br><small>${e.message}</small>
      </td></tr>`;
    }
}

function renderHistoryTable(records) {
    const tbody = document.getElementById("historyBody");
    const empty = document.getElementById("historyEmpty");

    if (!records.length) {
        tbody.innerHTML = "";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    tbody.innerHTML = records.map(h => `
    <tr>
      <td><strong>${h.patient_name}</strong></td>
      <td>${h.eye || "—"}</td>
      <td>${gradePillHTML(h.grade)}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden">
            <div style="width:${(h.confidence * 100).toFixed(0)}%;height:100%;background:${GRADE_COLORS[h.grade]};border-radius:3px"></div>
          </div>
          <span style="font-size:0.8rem;color:var(--text-secondary);min-width:38px">
            ${(h.confidence * 100).toFixed(1)}%
          </span>
        </div>
      </td>
      <td style="color:var(--text-secondary);font-size:0.85rem">${fmtDate(h.timestamp)}</td>
      <td>
        <button class="btn-icon" title="Delete record" onclick="deleteRecord('${h.id}')">🗑</button>
      </td>
    </tr>
  `).join("");
}

function getFiltered() {
    const query = document.getElementById("historySearch").value.toLowerCase();
    return allHistory.filter(h => {
        const matchGrade = activeGrade === "all" || String(h.grade) === activeGrade;
        const matchSearch = h.patient_name.toLowerCase().includes(query) ||
            h.label.toLowerCase().includes(query);
        return matchGrade && matchSearch;
    });
}

// Search
document.getElementById("historySearch")?.addEventListener("input", () => {
    renderHistoryTable(getFiltered());
});

// Grade filter buttons
document.getElementById("gradeFilter")?.addEventListener("click", e => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeGrade = btn.dataset.grade;
    renderHistoryTable(getFiltered());
});

// Delete
async function deleteRecord(id) {
    if (!confirm("Delete this record?")) return;
    try {
        await apiDelete(`/history/${id}`);
        allHistory = allHistory.filter(h => h.id !== id);
        renderHistoryTable(getFiltered());
        showToast("Record deleted.", "success");
    } catch (e) {
        showToast(`Delete failed: ${e.message}`, "error");
    }
}

// Export CSV
document.getElementById("btnExportCSV")?.addEventListener("click", () => {
    const rows = [["Patient", "Eye", "Grade", "Label", "Confidence", "Timestamp"]];
    getFiltered().forEach(h => {
        rows.push([h.patient_name, h.eye, h.grade, h.label,
        `${(h.confidence * 100).toFixed(1)}%`, h.timestamp]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "dr_history.csv" });
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV exported successfully.", "success");
});

window.initHistory = initHistory;
window.deleteRecord = deleteRecord;

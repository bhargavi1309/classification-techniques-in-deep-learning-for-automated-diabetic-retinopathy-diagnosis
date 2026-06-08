/* ─────────────────────────────────────────────────────────────────
   patients.js  — Patient registration and list management
   ───────────────────────────────────────────────────────────────── */

let allPatients = [];

async function initPatients() {
    try {
        allPatients = await apiGet("/patients");
        renderPatientCards(allPatients);
    } catch (e) {
        document.getElementById("patientCardsGrid").innerHTML =
            `<p style="color:var(--accent-red)">Failed to load patients — is the Flask server running?<br><small>${e.message}</small></p>`;
    }
}

function getInitials(name) {
    return name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

function renderPatientCards(patients) {
    const grid = document.getElementById("patientCardsGrid");
    if (!patients.length) {
        grid.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:2rem">
      No patients registered yet.</p>`;
        return;
    }
    grid.innerHTML = patients.map(p => `
    <div class="patient-card">
      <div class="patient-avatar">${getInitials(p.name)}</div>
      <div class="patient-info">
        <div class="patient-name">${p.name}</div>
        <div class="patient-meta">${p.age}y · ${p.gender} · DM ${p.diabetes_duration}yr</div>
      </div>
      <button class="patient-scan-btn" onclick="scanPatient('${p.id}')">
        📷 Scan
      </button>
    </div>
  `).join("");
}

// Add patient
document.getElementById("btnAddPatient")?.addEventListener("click", async () => {
    const name = document.getElementById("pName").value.trim();
    const age = document.getElementById("pAge").value;
    const gender = document.getElementById("pGender").value;
    const diabetes = document.getElementById("pDiabetes").value;

    if (!name) {
        showToast("Patient name is required.", "error");
        document.getElementById("pName").focus();
        return;
    }

    try {
        const patient = await apiPost("/patients", { name, age, gender, diabetes_duration: diabetes });
        allPatients.push(patient);
        renderPatientCards(allPatients);

        // Clear form
        ["pName", "pAge", "pDiabetes"].forEach(id => { document.getElementById(id).value = ""; });
        showToast(`Patient "${patient.name}" registered successfully.`, "success");
    } catch (e) {
        showToast(`Error: ${e.message}`, "error");
    }
});

// Navigate to upload page for a specific patient
function scanPatient(patientId) {
    navigateTo("upload");
    // Wait for the upload page to render then set the patient dropdown
    setTimeout(() => {
        const sel = document.getElementById("selectPatient");
        if (sel) {
            sel.value = patientId;
            sel.dispatchEvent(new Event("change"));
        }
    }, 150);
}

window.initPatients = initPatients;
window.scanPatient = scanPatient;

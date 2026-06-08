/* ─────────────────────────────────────────────────────────────────
   upload.js  — Image upload, patient selection, classification trigger
   ───────────────────────────────────────────────────────────────── */

let selectedFile = null;
let selectedEye = "Right";

function initUploadPage() {
    loadPatientsDropdown();
}

/* ── Patient dropdown ───────────────────────────────────────────── */
async function loadPatientsDropdown() {
    const sel = document.getElementById("selectPatient");
    try {
        const patients = await apiGet("/patients");
        const existing = patients.map(p =>
            `<option value="${p.id}">${p.name} (${p.age}y, ${p.gender})</option>`
        ).join("");
        sel.innerHTML = `<option value="">— New / Unregistered —</option>${existing}`;
    } catch { /* ignore */ }

    sel.addEventListener("change", () => {
        document.getElementById("quickNameGroup").style.display =
            sel.value ? "none" : "block";
    });
}

/* ── Eye selector ───────────────────────────────────────────────── */
document.querySelectorAll(".eye-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".eye-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedEye = btn.dataset.eye;
    });
});

/* ── Drag & Drop ────────────────────────────────────────────────── */
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const previewEl = document.getElementById("imagePreview");
const previewWrap = document.getElementById("imagePreviewWrap");
const btnClassify = document.getElementById("btnClassify");

dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => handleFileSelect(fileInput.files[0]));

dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
});

document.getElementById("removeImage").addEventListener("click", resetUpload);

function handleFileSelect(file) {
    if (!file || !file.type.startsWith("image/")) {
        showToast("Please select a valid image file.", "error");
        return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = ev => {
        previewEl.src = ev.target.result;
        dropZone.style.display = "none";
        previewWrap.style.display = "block";
        btnClassify.disabled = false;
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    selectedFile = null;
    fileInput.value = "";
    previewEl.src = "";
    dropZone.style.display = "block";
    previewWrap.style.display = "none";
    btnClassify.disabled = true;
}

/* ── Classify ───────────────────────────────────────────────────── */
btnClassify.addEventListener("click", async () => {
    if (!selectedFile) return;

    const btnText = btnClassify.querySelector(".btn-text");
    const btnLoading = btnClassify.querySelector(".btn-loading");
    btnText.style.display = "none";
    btnLoading.style.display = "flex";
    btnClassify.disabled = true;

    try {
        const formData = new FormData();
        formData.append("image", selectedFile);

        const sel = document.getElementById("selectPatient");
        const pId = sel.value;
        const pName = document.getElementById("quickName").value.trim() || "Unknown";

        if (pId) {
            formData.append("patient_id", pId);
        } else {
            formData.append("patient_name", pName);
        }
        formData.append("eye", selectedEye);

        const result = await apiPost("/classify", formData, true);

        // Show result page
        window._lastResult = result;
        showResult(result);
        navigateTo("results");
        resetUpload();
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
        btnText.style.display = "flex";
        btnLoading.style.display = "none";
        btnClassify.disabled = false;
    }
});

/* ── Re-initialise upload page on navigation ────────────────────── */
document.querySelector('.nav-item[data-page="upload"]')
    ?.addEventListener("click", initUploadPage);

// Init on load
window.addEventListener("DOMContentLoaded", initUploadPage);

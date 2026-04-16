/* ═══════════════════════════════════════════════════════
   MAKE YOUR FIT — script.js
   Manages: 4-step customizer state, localStorage, UI updates
═══════════════════════════════════════════════════════ */

// ─── GLOBAL STATE ───────────────────────────────────────
const state = {
  currentStep: 1,
  fabric:   null,
  color:    null,
  texture:  null,
  fit:      null,
  collar:   null,
  cuffs:    null,
  measurements: { neck: null, chest: null, waist: null, sleeve: null, length: null }
};

// ─── STEP MANAGEMENT ────────────────────────────────────
function goToStep(step) {
  // Hide current
  document.querySelector('.step-panel.active')?.classList.remove('active');
  document.getElementById(`step-${step}`).classList.add('active');
  state.currentStep = step;
  updateProgressBar(step);
  // Scroll to customizer smoothly
  document.getElementById('customizer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgressBar(step) {
  const steps = document.querySelectorAll('.p-step');
  steps.forEach((el, i) => {
    el.classList.remove('active', 'done');
    const num = i + 1;
    if (num < step)  el.classList.add('done');
    if (num === step) el.classList.add('active');
  });
  // Progress track width (between dots: 0%, 33.33%, 66.66%, 100%)
  const pct = ((step - 1) / 3) * 100;
  document.getElementById('progress-track').style.width = pct + '%';
}

// ─── STEP 1: FABRIC ─────────────────────────────────────
document.querySelectorAll('.fabric-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.fabric-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.fabric = card.dataset.fabric;
    document.getElementById('s1-next').disabled = false;
  });
});

// ─── STEP 2: COLOR & TEXTURE ────────────────────────────
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    swatch.classList.add('selected');
    state.color = swatch.dataset.color;
    document.getElementById('color-selected').textContent = 'Selected: ' + state.color;
    checkStep2();
  });
});

document.querySelectorAll('.texture-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.texture-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.texture = card.dataset.texture;
    checkStep2();
  });
});

function checkStep2() {
  document.getElementById('s2-next').disabled = !(state.color && state.texture);
}

// ─── STEP 3: DESIGN & FIT ───────────────────────────────
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const group = pill.dataset.group;
    // Deselect others in same group
    document.querySelectorAll(`.pill[data-group="${group}"]`).forEach(p => p.classList.remove('selected'));
    pill.classList.add('selected');
    state[group] = pill.dataset.val;
    checkStep3();
  });
});

function checkStep3() {
  document.getElementById('s3-next').disabled = !(state.fit && state.collar && state.cuffs);
}

// ─── STEP 4: MEASUREMENTS ───────────────────────────────
// Pre-fill from localStorage on load
window.addEventListener('DOMContentLoaded', () => {
  loadSavedMeasurements();
  loadMeasurementsIntoForm();
  renderHeader();
});

function loadSavedMeasurements() {
  renderSavedSection();
}

function loadMeasurementsIntoForm() {
  const saved = JSON.parse(localStorage.getItem('myf_measurements') || 'null');
  if (!saved) return;
  const fields = ['neck', 'chest', 'waist', 'sleeve', 'length'];
  fields.forEach(f => {
    const el = document.getElementById(`m-${f}`);
    if (el && saved[f]) el.value = saved[f];
  });
}

function saveMeasurements() {
  const fields = ['neck', 'chest', 'waist', 'sleeve', 'length'];
  const data = {};
  fields.forEach(f => {
    const val = document.getElementById(`m-${f}`)?.value;
    data[f] = val ? parseFloat(val) : null;
    state.measurements[f] = data[f];
  });
  data._savedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  localStorage.setItem('myf_measurements', JSON.stringify(data));

  // Show toast
  const toast = document.getElementById('save-toast');
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);

  renderSavedSection();
}

function clearMeasurements() {
  if (!confirm('Clear all saved measurements?')) return;
  localStorage.removeItem('myf_measurements');
  renderSavedSection();
  // Clear inputs
  ['neck','chest','waist','sleeve','length'].forEach(f => {
    const el = document.getElementById(`m-${f}`);
    if (el) el.value = '';
  });
}

function renderSavedSection() {
  const container = document.getElementById('saved-display');
  const saved = JSON.parse(localStorage.getItem('myf_measurements') || 'null');

  if (!saved) {
    container.innerHTML = '<p class="no-saved">No measurements saved yet. Complete Step 4 and click \'Save My Measurements\'.</p>';
    return;
  }

  const labels = { neck: 'Neck', chest: 'Chest', waist: 'Waist', sleeve: 'Sleeve', length: 'Length' };
  let html = '';
  Object.keys(labels).forEach(key => {
    html += `
      <div class="saved-card">
        <div class="sc-label">${labels[key]}</div>
        <div class="sc-val">${saved[key] ?? '—'} <span class="sc-unit">in</span></div>
      </div>`;
  });
  if (saved._savedAt) {
    html += `<div class="saved-ts">Last saved: ${saved._savedAt}</div>`;
  }
  container.innerHTML = html;
}

// ─── ORDER SUBMISSION ────────────────────────────────────
function submitOrder() {
  // Read measurements from form into state
  ['neck','chest','waist','sleeve','length'].forEach(f => {
    const val = document.getElementById(`m-${f}`)?.value;
    state.measurements[f] = val ? parseFloat(val) : null;
  });

  // Build summary HTML
  const summaryEl = document.getElementById('order-summary');
  summaryEl.innerHTML = `
    <div class="order-item"><span class="oi-label">Fabric</span><span class="oi-val">${state.fabric || '—'}</span></div>
    <div class="order-item"><span class="oi-label">Color</span><span class="oi-val">${state.color || '—'}</span></div>
    <div class="order-item"><span class="oi-label">Texture</span><span class="oi-val">${state.texture || '—'}</span></div>
    <div class="order-item"><span class="oi-label">Fit</span><span class="oi-val">${state.fit || '—'}</span></div>
    <div class="order-item"><span class="oi-label">Collar</span><span class="oi-val">${state.collar || '—'}</span></div>
    <div class="order-item"><span class="oi-label">Cuffs</span><span class="oi-val">${state.cuffs || '—'}</span></div>
    <div class="order-item"><span class="oi-label">Neck</span><span class="oi-val">${state.measurements.neck ?? '—'} in</span></div>
    <div class="order-item"><span class="oi-label">Chest</span><span class="oi-val">${state.measurements.chest ?? '—'} in</span></div>
    <div class="order-item"><span class="oi-label">Waist</span><span class="oi-val">${state.measurements.waist ?? '—'} in</span></div>
    <div class="order-item"><span class="oi-label">Sleeve</span><span class="oi-val">${state.measurements.sleeve ?? '—'} in</span></div>
    <div class="order-item"><span class="oi-label">Length</span><span class="oi-val">${state.measurements.length ?? '—'} in</span></div>
  `;

  goToStep(5);
}

function sendWhatsApp() {
  const m = state.measurements;
  const msg = encodeURIComponent(
    `Hi, I want to place a custom order on Make Your Fit.\n\n` +
    `*Order Details:*\n` +
    `• Fabric: ${state.fabric || 'N/A'}\n` +
    `• Color: ${state.color || 'N/A'}\n` +
    `• Texture: ${state.texture || 'N/A'}\n` +
    `• Fit: ${state.fit || 'N/A'}\n` +
    `• Collar: ${state.collar || 'N/A'}\n` +
    `• Cuffs: ${state.cuffs || 'N/A'}\n\n` +
    `*Measurements (inches):*\n` +
    `• Neck: ${m.neck ?? 'N/A'}\n` +
    `• Chest: ${m.chest ?? 'N/A'}\n` +
    `• Waist: ${m.waist ?? 'N/A'}\n` +
    `• Sleeve: ${m.sleeve ?? 'N/A'}\n` +
    `• Length: ${m.length ?? 'N/A'}`
  );
  window.open(`https://wa.me/918499989343?text=${msg}`, '_blank');
}

// ─── HEADER SCROLL EFFECT ────────────────────────────────
function renderHeader() {
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ─── NAV: SAVED MEASUREMENTS SHORTCUT ───────────────────
document.getElementById('nav-saved')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('saved').scrollIntoView({ behavior: 'smooth' });
});

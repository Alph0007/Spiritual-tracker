/* ---------- Bible verses (KJV, public domain) — one picked per day of year ---------- */
const VERSES = [
  ["Be still, and know that I am God.", "Psalm 46:10"],
  ["The Lord is my shepherd; I shall not want.", "Psalm 23:1"],
  ["I can do all things through Christ which strengtheneth me.", "Philippians 4:13"],
  ["Trust in the Lord with all thine heart, and lean not unto thine own understanding.", "Proverbs 3:5"],
  ["Be strong and of a good courage; be not afraid, for the Lord thy God is with thee.", "Joshua 1:9"],
  ["Draw nigh to God, and he will draw nigh to you.", "James 4:8"],
  ["Where two or three are gathered together in my name, there am I in the midst of them.", "Matthew 18:20"],
  ["Delight thyself also in the Lord, and he shall give thee the desires of thine heart.", "Psalm 37:4"],
  ["Create in me a clean heart, O God, and renew a right spirit within me.", "Psalm 51:10"],
  ["Ask, and it shall be given you; seek, and ye shall find.", "Matthew 7:7"],
  ["The Lord is nigh unto them that are of a broken heart.", "Psalm 34:18"],
  ["Come unto me, all ye that labour and are heavy laden, and I will give you rest.", "Matthew 11:28"],
  ["Rejoice in the Lord alway: and again I say, Rejoice.", "Philippians 4:4"],
  ["Be not conformed to this world: but be ye transformed by the renewing of your mind.", "Romans 12:2"],
  ["The joy of the Lord is your strength.", "Nehemiah 8:10"],
  ["Cast thy burden upon the Lord, and he shall sustain thee.", "Psalm 55:22"],
  ["I know the thoughts that I think toward you, saith the Lord, thoughts of peace.", "Jeremiah 29:11"],
  ["Let us not be weary in well doing: for in due season we shall reap.", "Galatians 6:9"],
  ["The fear of the Lord is the beginning of wisdom.", "Proverbs 9:10"],
  ["If we confess our sins, he is faithful and just to forgive us our sins.", "1 John 1:9"],
  ["Blessed are the pure in heart: for they shall see God.", "Matthew 5:8"],
  ["This is the day which the Lord hath made; we will rejoice and be glad in it.", "Psalm 118:24"],
  ["In every thing give thanks: for this is the will of God.", "1 Thessalonians 5:18"],
  ["Seek ye first the kingdom of God, and his righteousness.", "Matthew 6:33"],
  ["Watch ye, stand fast in the faith, quit you like men, be strong.", "1 Corinthians 16:13"],
  ["Let your light so shine before men, that they may see your good works.", "Matthew 5:16"],
  ["My grace is sufficient for thee: for my strength is made perfect in weakness.", "2 Corinthians 12:9"],
  ["Be ye kind one to another, tenderhearted, forgiving one another.", "Ephesians 4:32"],
  ["Pray without ceasing.", "1 Thessalonians 5:17"],
  ["Blessed are they which do hunger and thirst after righteousness.", "Matthew 5:6"],
  ["The Lord thy God in the midst of thee is mighty; he will save.", "Zephaniah 3:17"],
  ["Search me, O God, and know my heart: try me, and know my thoughts.", "Psalm 139:23"],
  ["Whatsoever ye do, do it heartily, as to the Lord.", "Colossians 3:23"],
  ["Let all that ye do be done with charity.", "1 Corinthians 16:14"],
  ["Wait on the Lord: be of good courage, and he shall strengthen thine heart.", "Psalm 27:14"],
  ["Humble yourselves therefore under the mighty hand of God.", "1 Peter 5:6"],
  ["Blessed are the merciful: for they shall obtain mercy.", "Matthew 5:7"],
  ["He that is faithful in that which is least is faithful also in much.", "Luke 16:10"],
  ["Every good gift and every perfect gift is from above.", "James 1:17"],
  ["The eyes of the Lord are upon the righteous, and his ears are open unto their cry.", "Psalm 34:15"],
  ["Take heed, watch and pray: for ye know not when the time is.", "Mark 13:33"],
  ["Be sober, be vigilant; because your adversary the devil walketh about.", "1 Peter 5:8"],
  ["I will lift up mine eyes unto the hills, from whence cometh my help.", "Psalm 121:1"],
  ["The Lord is my light and my salvation; whom shall I fear?", "Psalm 27:1"],
  ["Whatsoever things are true, honest, just, pure, lovely — think on these things.", "Philippians 4:8"],
  ["Be ye doers of the word, and not hearers only.", "James 1:22"],
  ["Now abideth faith, hope, charity, these three; but the greatest is charity.", "1 Corinthians 13:13"],
  ["Thy word is a lamp unto my feet, and a light unto my path.", "Psalm 119:105"],
];

function verseForDate(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d - start) / 86400000);
  return VERSES[dayOfYear % VERSES.length];
}

/* ---------- Storage helpers ---------- */
const LS = {
  tasks: "sgt_tasks",
  plans: "sgt_plans",
  checklist: "sgt_checklist",
  streak: "sgt_streak",
  journal: "sgt_journal",
  settings: "sgt_settings",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let state = {
  tasks: load(LS.tasks, []),        // {id, name, days:[0-6], reminderTime, notes}
  plans: load(LS.plans, []),        // {id, name, startDate, lengthDays, reminderTime, notes}
  checklist: load(LS.checklist, {}), // { 'YYYY-MM-DD': { itemId: true } }
  streak: load(LS.streak, { count: 0, lastCompleteDate: null }),
  journal: load(LS.journal, {}),     // { 'YYYY-MM-DD': text }
  settings: load(LS.settings, { remindersEnabled: false, verseReminder: false, examenReminder: false }),
};

/* ---------- Date helpers ---------- */
function pad2(n) { return String(n).padStart(2, "0"); }
function dateStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function todayDate() { return new Date(); }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

/* ---------- Deriving "today's required items" ---------- */
function itemsForDate(d) {
  const dow = d.getDay(); // 0=Sun..6=Sat
  const items = [];
  for (const t of state.tasks) {
    if (!t.days || t.days.length === 0 || t.days.includes(dow)) {
      items.push({ id: "task:" + t.id, label: t.name, kind: "task", ref: t });
    }
  }
  for (const p of state.plans) {
    const start = new Date(p.startDate + "T00:00:00");
    const dayIndex = Math.round((d - start) / 86400000);
    if (dayIndex >= 0 && dayIndex < p.lengthDays) {
      items.push({ id: "plan:" + p.id, label: `${p.name} — day ${dayIndex + 1} of ${p.lengthDays}`, kind: "plan", ref: p, dayIndex });
    }
  }
  return items;
}

function isChecked(dStr, itemId) {
  return !!(state.checklist[dStr] && state.checklist[dStr][itemId]);
}
function setChecked(dStr, itemId, val) {
  if (!state.checklist[dStr]) state.checklist[dStr] = {};
  if (val) state.checklist[dStr][itemId] = true;
  else delete state.checklist[dStr][itemId];
  save(LS.checklist, state.checklist);
}
function isDayComplete(d) {
  const items = itemsForDate(d);
  if (items.length === 0) return null; // no requirement that day
  const dStr = dateStr(d);
  return items.every((it) => isChecked(dStr, it.id));
}

/* ---------- Streak ---------- */
function recomputeStreak() {
  let count = 0;
  let cursor = todayDate();
  const todayComplete = isDayComplete(cursor);
  if (todayComplete === true) { count += 1; cursor = addDays(cursor, -1); }
  else { cursor = addDays(cursor, -1); }

  while (true) {
    const status = isDayComplete(cursor);
    if (status === null) { cursor = addDays(cursor, -1); continue; } // no items that day, skip
    if (status === true) { count += 1; cursor = addDays(cursor, -1); continue; }
    break;
  }
  state.streak = { count, lastCompleteDate: todayComplete ? dateStr(todayDate()) : state.streak.lastCompleteDate };
  save(LS.streak, state.streak);
  return count;
}

/* ---------- Rendering ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function renderStreakBadge() {
  $("#streak-count").textContent = state.streak.count;
}

function renderBeads() {
  const container = $("#streak-beads");
  container.innerHTML = "";
  const count = state.streak.count;
  const totalToShow = Math.max(count, 10);
  const rows = Math.ceil(totalToShow / 10);
  for (let i = 0; i < rows * 10; i++) {
    const bead = document.createElement("span");
    const isDecade = (i + 1) % 10 === 0;
    bead.className = "bead" + (isDecade ? " decade" : "") + (i < count ? " filled" : "");
    bead.title = `Day ${i + 1}`;
    container.appendChild(bead);
  }
  const note = $("#streak-note");
  note.textContent = count === 0
    ? "Complete everything scheduled for today to start a streak."
    : `${count} day${count === 1 ? "" : "s"} in a row. Gold beads mark every tenth day.`;
}

function renderVerse() {
  const [text, ref] = verseForDate(todayDate());
  $("#verse-text").textContent = `"${text}"`;
  $("#verse-ref").textContent = ref;
}

function renderToday() {
  $("#today-date").textContent = todayDate().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  renderVerse();
  const items = itemsForDate(todayDate());
  const dStr = dateStr(todayDate());
  const list = $("#checklist-list");
  list.innerHTML = "";
  $("#checklist-empty").hidden = items.length !== 0;
  let doneCount = 0;
  items.forEach((it) => {
    const checked = isChecked(dStr, it.id);
    if (checked) doneCount++;
    const li = document.createElement("li");
    li.className = "checklist-item";
    li.innerHTML = `
      <button class="bead-check ${checked ? "checked" : ""}" data-item="${it.id}" aria-label="Mark ${it.label} ${checked ? "not done" : "done"}">
        <svg viewBox="0 0 16 16" width="12" height="12"><path d="M2 8l4 4 8-8" stroke="#F3ECD8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <span class="checklist-item-label ${checked ? "done" : ""}">${escapeHtml(it.label)}</span>
    `;
    list.appendChild(li);
  });
  $("#today-progress-label").textContent = items.length ? `${doneCount} / ${items.length}` : "";
  renderStreakBadge();
  renderBeads();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function renderManage() {
  const taskList = $("#task-list");
  taskList.innerHTML = "";
  $("#task-empty").hidden = state.tasks.length !== 0;
  state.tasks.forEach((t) => {
    const days = (!t.days || t.days.length === 0 || t.days.length === 7) ? "Every day" : t.days.map((d) => WEEKDAY_LABELS[d]).join(", ");
    const li = document.createElement("li");
    li.className = "manager-item";
    li.innerHTML = `
      <div class="manager-item-top">
        <span class="manager-item-name">${escapeHtml(t.name)}</span>
      </div>
      <div class="manager-item-meta">${days}${t.reminderTime ? " · reminder " + t.reminderTime : ""}</div>
      <div class="manager-item-actions">
        <button data-edit-task="${t.id}">Edit</button>
        <button class="danger" data-delete-task="${t.id}">Delete</button>
      </div>`;
    taskList.appendChild(li);
  });

  const planList = $("#plan-list");
  planList.innerHTML = "";
  $("#plan-empty").hidden = state.plans.length !== 0;
  state.plans.forEach((p) => {
    const start = new Date(p.startDate + "T00:00:00");
    const dayIndex = Math.round((todayDate() - start) / 86400000);
    const status = dayIndex < 0 ? `starts ${p.startDate}` : dayIndex >= p.lengthDays ? "completed" : `day ${dayIndex + 1} of ${p.lengthDays}`;
    const li = document.createElement("li");
    li.className = "manager-item";
    li.innerHTML = `
      <div class="manager-item-top">
        <span class="manager-item-name">${escapeHtml(p.name)}</span>
      </div>
      <div class="manager-item-meta">${status}${p.reminderTime ? " · reminder " + p.reminderTime : ""}</div>
      <div class="manager-item-actions">
        <button data-edit-plan="${p.id}">Edit</button>
        <button class="danger" data-delete-plan="${p.id}">Delete</button>
      </div>`;
    planList.appendChild(li);
  });
}

function renderJournalToday() {
  const dStr = dateStr(todayDate());
  $("#journal-date-label").textContent = todayDate().toLocaleDateString(undefined, { month: "short", day: "numeric" });
  $("#journal-text").value = state.journal[dStr] || "";
}

function renderJournalList() {
  const entries = Object.keys(state.journal).filter((k) => state.journal[k] && state.journal[k].trim()).sort().reverse();
  const list = $("#journal-list");
  list.innerHTML = "";
  $("#journal-empty").hidden = entries.length !== 0;
  entries.slice(0, 60).forEach((dStr) => {
    const text = state.journal[dStr];
    const li = document.createElement("li");
    li.className = "manager-item";
    li.dataset.date = dStr;
    li.innerHTML = `
      <div class="manager-item-top"><span class="manager-item-name">${dStr}</span></div>
      <div class="manager-item-meta">${escapeHtml(text.slice(0, 90))}${text.length > 90 ? "…" : ""}</div>`;
    list.appendChild(li);
  });
}

function renderSettings() {
  $("#push-status").textContent = state.settings.remindersEnabled ? "Reminders are on for this device." : "Reminders are off.";
  $("#push-toggle-btn").textContent = state.settings.remindersEnabled ? "Disable reminders" : "Enable reminders";
  $("#verse-reminder-toggle").checked = !!state.settings.verseReminder;
  $("#examen-reminder-toggle").checked = !!state.settings.examenReminder;
}

function renderAll() {
  renderToday();
  renderManage();
  renderJournalToday();
  renderJournalList();
  renderSettings();
}

/* ---------- Tabs ---------- */
$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});
document.addEventListener("click", (e) => {
  const goto = e.target.closest("[data-goto]");
  if (goto) switchView(goto.dataset.goto);
});
function switchView(name) {
  $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  $$(".tab").forEach((t) => {
    const active = t.dataset.view === name;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });
}

/* ---------- Checklist interaction ---------- */
$("#checklist-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-item]");
  if (!btn) return;
  const dStr = dateStr(todayDate());
  const id = btn.dataset.item;
  const wasChecked = isChecked(dStr, id);
  setChecked(dStr, id, !wasChecked);
  recomputeStreak();
  renderToday();
});

/* ---------- Modal (add/edit task & plan) ---------- */
const overlay = $("#modal-overlay");
const modalEl = $("#modal-content");
function closeModal() { overlay.hidden = true; modalEl.innerHTML = ""; }
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

function openTaskModal(existing) {
  const isEdit = !!existing;
  const t = existing || { id: uid(), name: "", days: [], reminderTime: "" };
  let selectedDays = new Set(t.days || []);
  modalEl.innerHTML = `
    <h3>${isEdit ? "Edit" : "Add"} practice</h3>
    <div class="form-row"><label for="f-name">Name</label>
      <input type="text" id="f-name" value="${escapeHtml(t.name)}" placeholder="e.g. Confession, Holy Mass, Personal prayer" /></div>
    <div class="form-row"><label>Days</label>
      <div class="weekday-picker" id="f-days">
        ${WEEKDAY_LABELS.map((label, i) => `<button type="button" class="weekday-chip ${selectedDays.has(i) ? "active" : ""}" data-day="${i}">${label}</button>`).join("")}
      </div>
      <p class="save-hint">Leave all unselected for every day.</p></div>
    <div class="form-row"><label for="f-time">Reminder time (optional)</label>
      <input type="time" id="f-time" value="${t.reminderTime || ""}" /></div>
    <div class="modal-actions">
      <button class="cancel" id="f-cancel">Cancel</button>
      ${isEdit ? '<button class="add-btn danger" id="f-delete" style="margin-top:0">Delete</button>' : ""}
      <button class="add-btn" id="f-save">Save</button>
    </div>`;
  overlay.hidden = false;
  $$(".weekday-chip", modalEl).forEach((chip) => {
    chip.addEventListener("click", () => {
      const d = Number(chip.dataset.day);
      if (selectedDays.has(d)) selectedDays.delete(d); else selectedDays.add(d);
      chip.classList.toggle("active");
    });
  });
  $("#f-cancel").addEventListener("click", closeModal);
  if (isEdit) $("#f-delete").addEventListener("click", () => {
    state.tasks = state.tasks.filter((x) => x.id !== t.id);
    save(LS.tasks, state.tasks);
    closeModal(); renderAll(); syncReminders();
  });
  $("#f-save").addEventListener("click", () => {
    const name = $("#f-name").value.trim();
    if (!name) return;
    t.name = name;
    t.days = Array.from(selectedDays).sort();
    t.reminderTime = $("#f-time").value || "";
    const idx = state.tasks.findIndex((x) => x.id === t.id);
    if (idx >= 0) state.tasks[idx] = t; else state.tasks.push(t);
    save(LS.tasks, state.tasks);
    closeModal(); renderAll(); syncReminders();
  });
}

function openPlanModal(existing) {
  const isEdit = !!existing;
  const p = existing || { id: uid(), name: "", startDate: dateStr(todayDate()), lengthDays: 40, reminderTime: "" };
  modalEl.innerHTML = `
    <h3>${isEdit ? "Edit" : "Add"} plan</h3>
    <div class="form-row"><label for="p-name">Name</label>
      <input type="text" id="p-name" value="${escapeHtml(p.name)}" placeholder="e.g. Lenten fast" /></div>
    <div class="form-row"><label for="p-start">Start date</label>
      <input type="date" id="p-start" value="${p.startDate}" /></div>
    <div class="form-row"><label for="p-len">Length (days)</label>
      <input type="number" id="p-len" min="1" max="365" value="${p.lengthDays}" /></div>
    <div class="form-row"><label for="p-time">Reminder time (optional)</label>
      <input type="time" id="p-time" value="${p.reminderTime || ""}" /></div>
    <div class="modal-actions">
      <button class="cancel" id="p-cancel">Cancel</button>
      ${isEdit ? '<button class="add-btn danger" id="p-delete" style="margin-top:0">Delete</button>' : ""}
      <button class="add-btn" id="p-save">Save</button>
    </div>`;
  overlay.hidden = false;
  $("#p-cancel").addEventListener("click", closeModal);
  if (isEdit) $("#p-delete").addEventListener("click", () => {
    state.plans = state.plans.filter((x) => x.id !== p.id);
    save(LS.plans, state.plans);
    closeModal(); renderAll(); syncReminders();
  });
  $("#p-save").addEventListener("click", () => {
    const name = $("#p-name").value.trim();
    if (!name) return;
    p.name = name;
    p.startDate = $("#p-start").value || p.startDate;
    p.lengthDays = Math.max(1, Number($("#p-len").value) || 40);
    p.reminderTime = $("#p-time").value || "";
    const idx = state.plans.findIndex((x) => x.id === p.id);
    if (idx >= 0) state.plans[idx] = p; else state.plans.push(p);
    save(LS.plans, state.plans);
    closeModal(); renderAll(); syncReminders();
  });
}

$("#add-task-btn").addEventListener("click", () => openTaskModal(null));
$("#add-plan-btn").addEventListener("click", () => openPlanModal(null));
$("#task-list").addEventListener("click", (e) => {
  const editId = e.target.closest("[data-edit-task]")?.dataset.editTask;
  const delId = e.target.closest("[data-delete-task]")?.dataset.deleteTask;
  if (editId) openTaskModal(state.tasks.find((x) => x.id === editId));
  if (delId) {
    state.tasks = state.tasks.filter((x) => x.id !== delId);
    save(LS.tasks, state.tasks);
    renderAll(); syncReminders();
  }
});
$("#plan-list").addEventListener("click", (e) => {
  const editId = e.target.closest("[data-edit-plan]")?.dataset.editPlan;
  const delId = e.target.closest("[data-delete-plan]")?.dataset.deletePlan;
  if (editId) openPlanModal(state.plans.find((x) => x.id === editId));
  if (delId) {
    state.plans = state.plans.filter((x) => x.id !== delId);
    save(LS.plans, state.plans);
    renderAll(); syncReminders();
  }
});

/* ---------- Journal ---------- */
let journalTimer = null;
$("#journal-text").addEventListener("input", () => {
  clearTimeout(journalTimer);
  $("#journal-save-hint").textContent = "Saving…";
  journalTimer = setTimeout(() => {
    const dStr = dateStr(todayDate());
    state.journal[dStr] = $("#journal-text").value;
    save(LS.journal, state.journal);
    $("#journal-save-hint").textContent = "Saved.";
    renderJournalList();
  }, 500);
});
$("#journal-list").addEventListener("click", (e) => {
  const item = e.target.closest("[data-date]");
  if (!item) return;
  switchView("journal");
  const dStr = item.dataset.date;
  const text = prompt("Edit entry for " + dStr, state.journal[dStr] || "");
  if (text !== null) {
    state.journal[dStr] = text;
    save(LS.journal, state.journal);
    renderJournalList();
    if (dStr === dateStr(todayDate())) renderJournalToday();
  }
});

/* ---------- Settings: data export / import / reset ---------- */
$("#export-btn").addEventListener("click", () => {
  const data = { tasks: state.tasks, plans: state.plans, checklist: state.checklist, streak: state.streak, journal: state.journal, settings: state.settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rule-of-life-backup-${dateStr(todayDate())}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
$("#import-btn").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.tasks) state.tasks = data.tasks;
    if (data.plans) state.plans = data.plans;
    if (data.checklist) state.checklist = data.checklist;
    if (data.streak) state.streak = data.streak;
    if (data.journal) state.journal = data.journal;
    if (data.settings) state.settings = data.settings;
    Object.keys(LS).forEach((k) => save(LS[k], state[k]));
    recomputeStreak();
    renderAll();
    alert("Backup imported.");
  } catch (err) {
    alert("That file couldn't be read as a backup.");
  }
});
$("#reset-btn").addEventListener("click", () => {
  if (!confirm("This erases all tasks, plans, streak, and journal entries on this device. This cannot be undone. Continue?")) return;
  Object.values(LS).forEach((k) => localStorage.removeItem(k));
  location.reload();
});

/* ---------- Push notifications ---------- */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function getSWRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/service-worker.js");
}

function buildReminderPayload() {
  const reminders = [];
  state.tasks.forEach((t) => {
    if (t.reminderTime) reminders.push({ id: "task:" + t.id, label: t.name, time: t.reminderTime, days: t.days && t.days.length ? t.days : [0, 1, 2, 3, 4, 5, 6], type: "task" });
  });
  state.plans.forEach((p) => {
    if (p.reminderTime) reminders.push({ id: "plan:" + p.id, label: p.name, time: p.reminderTime, days: [0, 1, 2, 3, 4, 5, 6], type: "plan", startDate: p.startDate, lengthDays: p.lengthDays });
  });
  if (state.settings.verseReminder) reminders.push({ id: "verse", label: "Daily verse", time: "07:00", days: [0, 1, 2, 3, 4, 5, 6], type: "verse" });
  if (state.settings.examenReminder) reminders.push({ id: "examen", label: "Evening Examen", time: "21:00", days: [0, 1, 2, 3, 4, 5, 6], type: "examen" });
  return reminders;
}

async function syncReminders() {
  if (!state.settings.remindersEnabled) return;
  const reg = await getSWRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    await fetch("/.netlify/functions/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub, timezone, reminders: buildReminderPayload() }),
    });
  } catch (e) { /* offline or function unavailable — safe to ignore */ }
}

async function enablePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("This browser doesn't support push notifications.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") { alert("Notification permission was not granted."); return; }
  const reg = await getSWRegistration();
  const keyRes = await fetch("/.netlify/functions/vapid-public-key");
  if (!keyRes.ok) { alert("Reminder service isn't set up on this deployment yet (missing VAPID keys)."); return; }
  const vapidPublicKey = (await keyRes.text()).trim();
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });
  state.settings.remindersEnabled = true;
  save(LS.settings, state.settings);
  await syncReminders();
  renderSettings();
}

async function disablePush() {
  const reg = await getSWRegistration();
  const sub = reg && (await reg.pushManager.getSubscription());
  if (sub) await sub.unsubscribe();
  state.settings.remindersEnabled = false;
  save(LS.settings, state.settings);
  renderSettings();
}

$("#push-toggle-btn").addEventListener("click", () => {
  if (state.settings.remindersEnabled) disablePush(); else enablePush();
});
$("#verse-reminder-toggle").addEventListener("change", (e) => {
  state.settings.verseReminder = e.target.checked;
  save(LS.settings, state.settings);
  syncReminders();
});
$("#examen-reminder-toggle").addEventListener("change", (e) => {
  state.settings.examenReminder = e.target.checked;
  save(LS.settings, state.settings);
  syncReminders();
});

/* ---------- Init ---------- */
recomputeStreak();
renderAll();
getSWRegistration();

// Re-render around midnight so "today" rolls over without a manual refresh
let lastSeenDate = dateStr(todayDate());
setInterval(() => {
  const nowStr = dateStr(todayDate());
  if (nowStr !== lastSeenDate) {
    lastSeenDate = nowStr;
    recomputeStreak();
    renderAll();
  }
}, 60 * 1000);

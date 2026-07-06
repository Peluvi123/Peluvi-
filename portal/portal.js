import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://jljeromqlkokpmwyypqo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsamVyb21xbGtva3Btd3l5cHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjQwMDUsImV4cCI6MjA5ODQwMDAwNX0.DNvuqC273a2ZOLDXTO0BlErLujS5WUwl98UJrp6trg0"
);

const STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const logoutBtn = document.getElementById("logout-btn");
const dashboardGreeting = document.getElementById("dashboard-greeting");
const dashboardSub = document.getElementById("dashboard-sub");

const citasList = document.getElementById("citas-list");
const citasEmpty = document.getElementById("citas-empty");
const citasPendingSection = document.getElementById("citas-pending-section");
const citasPendingList = document.getElementById("citas-pending-list");
const pacientesList = document.getElementById("pacientes-list");
const pacientesEmpty = document.getElementById("pacientes-empty");

const calGrid = document.getElementById("cal-grid");
const calMonthLabel = document.getElementById("cal-month-label");
const calPrevBtn = document.getElementById("cal-prev");
const calNextBtn = document.getElementById("cal-next");
const calClearBtn = document.getElementById("cal-clear");

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEKDAY_START = 0; // domingo

let allAppointments = [];
let calendarViewDate = new Date();
let selectedDateFilter = null;
let currentVetId = null;

function groupBy(arr, key) {
  const map = new Map();
  arr.forEach((item) => {
    const k = item[key];
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  });
  return map;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateKey(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

const clinicaForm = document.getElementById("clinica-form");
const clinicaSuccess = document.getElementById("clinica-success");
const clinicaFields = {
  business_name: document.getElementById("clinica-business-name"),
  address: document.getElementById("clinica-address"),
  phone: document.getElementById("clinica-phone"),
  city: document.getElementById("clinica-city"),
  whatsapp: document.getElementById("clinica-whatsapp"),
  description: document.getElementById("clinica-description"),
  emergency: document.getElementById("clinica-emergency"),
};

const DAY_OPTIONS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const scheduleDaysList = document.getElementById("schedule-days-list");

function renderScheduleDays(dayEntries) {
  const byDay = new Map((dayEntries || []).map((e) => [e.day, e]));
  scheduleDaysList.innerHTML = "";

  DAY_OPTIONS.forEach((day) => {
    const existing = byDay.get(day);
    const row = document.createElement("div");
    row.className = "portal-schedule-day-row";
    row.dataset.day = day;
    row.innerHTML = `
      <label class="portal-checkbox portal-schedule-day-toggle">
        <input type="checkbox" class="schedule-day-open" ${existing ? "checked" : ""} />
        <span>${day}</span>
      </label>
      <div class="portal-schedule-day-times" ${existing ? "" : "hidden"}>
        <input type="time" class="schedule-open" value="${existing?.open || "08:00"}" />
        <span>a</span>
        <input type="time" class="schedule-close" value="${existing?.close || "18:00"}" />
      </div>
      <span class="portal-muted portal-schedule-closed-label" ${existing ? "hidden" : ""}>Cerrado</span>
    `;
    const checkbox = row.querySelector(".schedule-day-open");
    const timesWrap = row.querySelector(".portal-schedule-day-times");
    const closedLabel = row.querySelector(".portal-schedule-closed-label");
    checkbox.addEventListener("change", () => {
      timesWrap.hidden = !checkbox.checked;
      closedLabel.hidden = checkbox.checked;
    });
    scheduleDaysList.appendChild(row);
  });
}

function formatTime12h(hhmm) {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")}${period}`;
}

function getScheduleData() {
  return Array.from(scheduleDaysList.querySelectorAll(".portal-schedule-day-row"))
    .filter((row) => row.querySelector(".schedule-day-open").checked)
    .map((row) => ({
      day: row.dataset.day,
      open: row.querySelector(".schedule-open").value,
      close: row.querySelector(".schedule-close").value,
    }));
}

function buildScheduleSummary(dayEntries) {
  const groups = [];
  dayEntries.forEach((entry) => {
    const last = groups[groups.length - 1];
    const isConsecutive =
      last &&
      last.open === entry.open &&
      last.close === entry.close &&
      DAY_OPTIONS.indexOf(entry.day) === DAY_OPTIONS.indexOf(last.days[last.days.length - 1]) + 1;
    if (isConsecutive) {
      last.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], open: entry.open, close: entry.close });
    }
  });

  return groups
    .map((g) => {
      const label = g.days.length > 1 ? `${g.days[0]}-${g.days[g.days.length - 1]}` : g.days[0];
      return `${label} ${formatTime12h(g.open)}-${formatTime12h(g.close)}`;
    })
    .join(" | ");
}

const SERVICE_OPTIONS = [
  "Consulta general", "Vacunación", "Cirugía", "Cirugía menor", "Urgencias 24h",
  "Radiología", "Laboratorio", "Odontología", "Dermatología", "Desparasitación",
  "Peluquería", "Ecografía", "Ultrasonido", "Medicina interna", "Oncología",
  "Cardiología", "Neurología", "Ortopedia", "Oftalmología", "Reproducción",
];

const servicesPicker = document.getElementById("clinica-services-picker");
const serviceCustomInput = document.getElementById("clinica-service-custom");
const serviceAddBtn = document.getElementById("clinica-service-add-btn");

let selectedServices = new Set();

function renderServicesPicker() {
  const allTags = Array.from(new Set([...SERVICE_OPTIONS, ...selectedServices]));
  servicesPicker.innerHTML = "";
  allTags.forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "portal-tag" + (selectedServices.has(tag) ? " is-selected" : "");
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      if (selectedServices.has(tag)) selectedServices.delete(tag);
      else selectedServices.add(tag);
      renderServicesPicker();
    });
    servicesPicker.appendChild(chip);
  });
}

function addCustomService() {
  const value = serviceCustomInput.value.trim();
  if (!value) return;
  selectedServices.add(value);
  serviceCustomInput.value = "";
  renderServicesPicker();
}

serviceAddBtn.addEventListener("click", addCustomService);
serviceCustomInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addCustomService();
  }
});

const doctorsList = document.getElementById("clinica-doctors-list");
const doctorsEmpty = document.getElementById("clinica-doctors-empty");
const imagesList = document.getElementById("clinica-images-list");
const imagesEmpty = document.getElementById("clinica-images-empty");

const doctorAddToggle = document.getElementById("doctor-add-toggle");
const doctorAddForm = document.getElementById("doctor-add-form");
const doctorNameInput = document.getElementById("doctor-name");
const doctorSpecialtyInput = document.getElementById("doctor-specialty");
const doctorAvailableInput = document.getElementById("doctor-available");
const doctorPhotoInput = document.getElementById("doctor-photo-input");
const doctorSaveBtn = document.getElementById("doctor-save-btn");
const clinicPhotoInput = document.getElementById("clinic-photo-input");

let currentDoctors = [];
let currentImages = [];
let currentProfile = null;

async function persistVetProfile(patch) {
  await supabase.from("vet_profiles").upsert({ id: currentVetId, ...patch });
}

async function uploadClinicMedia(file) {
  const path = `${currentVetId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("clinic-media").upload(path, file, { contentType: file.type });
  if (error) return null;
  return supabase.storage.from("clinic-media").getPublicUrl(path).data.publicUrl;
}

function showLogin(message) {
  loginView.hidden = false;
  dashboardView.hidden = true;
  logoutBtn.hidden = true;
  if (message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }
}

function showDashboard(profile) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  logoutBtn.hidden = false;
  dashboardGreeting.textContent = `Hola, ${profile.business_name || profile.name}`;
  dashboardSub.textContent = profile.address || "";
}

async function requireProviderSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    showLogin();
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !profile || profile.role !== "provider" || profile.provider_type !== "vet") {
    await supabase.auth.signOut();
    showLogin("Esta cuenta no es de veterinaria.");
    return null;
  }

  const { data: vetProfile } = await supabase
    .from("vet_profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  showDashboard(profile);
  currentProfile = profile;
  fillClinicForm(profile, vetProfile);
  currentDoctors = vetProfile?.doctors ?? [];
  currentImages = vetProfile?.images ?? [];
  renderDoctors();
  renderClinicImages();
  return { session, profile, vetProfile };
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Ingresando...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  loginSubmit.disabled = false;
  loginSubmit.textContent = "Ingresar";

  if (error) {
    loginError.textContent = "Correo o contraseña incorrectos.";
    loginError.hidden = false;
    return;
  }

  const ctx = await requireProviderSession();
  if (ctx) loadTabData(ctx);
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
});

document.querySelectorAll(".portal-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".portal-tab").forEach((b) => b.classList.remove("is-active"));
    document.querySelectorAll(".portal-panel").forEach((p) => (p.hidden = true));
    btn.classList.add("is-active");
    document.querySelector(`.portal-panel[data-panel="${btn.dataset.tab}"]`).hidden = false;
  });
});

function fillClinicForm(profile, vetProfile) {
  clinicaFields.business_name.value = profile.business_name || "";
  clinicaFields.address.value = profile.address || "";
  clinicaFields.phone.value = profile.phone || "";
  clinicaFields.city.value = profile.city || "";
  clinicaFields.whatsapp.value = vetProfile?.whatsapp || "";
  const validDayEntries = (vetProfile?.schedule_details || []).filter(
    (e) => typeof e.day === "string" && e.open && e.close
  );
  renderScheduleDays(validDayEntries);
  selectedServices = new Set(vetProfile?.services || []);
  renderServicesPicker();
  clinicaFields.description.value = vetProfile?.description || "";
  clinicaFields.emergency.checked = !!vetProfile?.emergency;
}

function renderDoctors() {
  doctorsList.innerHTML = "";
  doctorsEmpty.hidden = currentDoctors.length > 0;
  currentDoctors.forEach((doc, index) => {
    const card = document.createElement("div");
    card.className = "portal-doctor-card";
    card.innerHTML = `
      <button type="button" class="portal-remove-x" aria-label="Quitar">✕</button>
      <img src="${doc.photo || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <strong>${doc.name || ""}</strong>
      <span>${doc.specialty || ""}</span>
      <span class="portal-doctor-badge ${doc.available ? "is-available" : "is-unavailable"}">
        ${doc.available ? "Disponible" : "No disponible"}
      </span>
    `;
    card.querySelector(".portal-remove-x").addEventListener("click", async () => {
      currentDoctors.splice(index, 1);
      await persistVetProfile({ doctors: currentDoctors });
      renderDoctors();
    });
    doctorsList.appendChild(card);
  });
}

function renderClinicImages() {
  imagesList.innerHTML = "";
  imagesEmpty.hidden = currentImages.length > 0;
  currentImages.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = "portal-photo-item";
    item.innerHTML = `
      <button type="button" class="portal-remove-x" aria-label="Quitar">✕</button>
      <img src="${url}" alt="" />
    `;
    item.querySelector(".portal-remove-x").addEventListener("click", async () => {
      currentImages.splice(index, 1);
      await persistVetProfile({ images: currentImages });
      renderClinicImages();
    });
    imagesList.appendChild(item);
  });
}

doctorAddToggle.addEventListener("click", () => {
  doctorAddForm.hidden = !doctorAddForm.hidden;
});

doctorSaveBtn.addEventListener("click", async () => {
  const name = doctorNameInput.value.trim();
  const specialty = doctorSpecialtyInput.value.trim();
  if (!name) return;

  doctorSaveBtn.disabled = true;
  doctorSaveBtn.textContent = "Guardando...";

  let photo = "";
  const file = doctorPhotoInput.files[0];
  if (file) {
    photo = (await uploadClinicMedia(file)) || "";
  }

  currentDoctors.push({
    id: `doc_${Date.now()}`,
    name,
    specialty,
    photo,
    available: doctorAvailableInput.checked,
  });
  await persistVetProfile({ doctors: currentDoctors });
  renderDoctors();

  doctorNameInput.value = "";
  doctorSpecialtyInput.value = "";
  doctorAvailableInput.checked = true;
  doctorPhotoInput.value = "";
  doctorAddForm.hidden = true;
  doctorSaveBtn.disabled = false;
  doctorSaveBtn.textContent = "Guardar doctor";
});

clinicPhotoInput.addEventListener("change", async () => {
  const file = clinicPhotoInput.files[0];
  if (!file) return;
  const url = await uploadClinicMedia(file);
  if (url) {
    currentImages.push(url);
    await persistVetProfile({ images: currentImages });
    renderClinicImages();
  }
  clinicPhotoInput.value = "";
});

clinicaForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  clinicaSuccess.hidden = true;
  await supabase
    .from("profiles")
    .update({
      business_name: clinicaFields.business_name.value.trim(),
      address: clinicaFields.address.value.trim(),
      phone: clinicaFields.phone.value.trim(),
      city: clinicaFields.city.value.trim(),
    })
    .eq("id", session.user.id);

  const scheduleData = getScheduleData();
  await supabase.from("vet_profiles").upsert({
    id: session.user.id,
    whatsapp: clinicaFields.whatsapp.value.trim(),
    schedule: buildScheduleSummary(scheduleData),
    schedule_details: scheduleData,
    services: Array.from(selectedServices),
    description: clinicaFields.description.value.trim(),
    emergency: clinicaFields.emergency.checked,
  });

  clinicaSuccess.hidden = false;
  dashboardGreeting.textContent = `Hola, ${clinicaFields.business_name.value.trim()}`;
});

function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  calMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const todayKey = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const aptCountByDate = new Map();
  allAppointments.forEach((a) => {
    if (!a.date) return;
    aptCountByDate.set(a.date, (aptCountByDate.get(a.date) || 0) + 1);
  });

  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = (firstDayOfMonth.getDay() - WEEKDAY_START + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  calGrid.innerHTML = "";

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    const cell = document.createElement("div");
    cell.className = "portal-cal-cell";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "portal-cal-day";

    let cellKey = null;
    if (dayNum < 1) {
      btn.textContent = daysInPrevMonth + dayNum;
      btn.classList.add("is-outside");
      btn.disabled = true;
    } else if (dayNum > daysInMonth) {
      btn.textContent = dayNum - daysInMonth;
      btn.classList.add("is-outside");
      btn.disabled = true;
    } else {
      btn.textContent = dayNum;
      cellKey = toDateKey(year, month, dayNum);
      const count = aptCountByDate.get(cellKey) || 0;
      if (count > 0) btn.classList.add("has-apt");
      if (cellKey === todayKey) btn.classList.add("is-today");
      if (cellKey === selectedDateFilter) btn.classList.add("is-selected");
      if (count > 0) btn.dataset.count = count > 9 ? "9+" : String(count);
      btn.addEventListener("click", () => {
        selectedDateFilter = selectedDateFilter === cellKey ? null : cellKey;
        renderCalendar();
        renderCitas(filterAppointments());
      });
    }
    cell.appendChild(btn);
    calGrid.appendChild(cell);
  }

  calClearBtn.hidden = !selectedDateFilter;
}

function filterAppointments() {
  if (!selectedDateFilter) return allAppointments;
  return allAppointments.filter((a) => a.date === selectedDateFilter);
}

calPrevBtn.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
  renderCalendar();
});

calNextBtn.addEventListener("click", () => {
  calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
  renderCalendar();
});

calClearBtn.addEventListener("click", () => {
  selectedDateFilter = null;
  renderCalendar();
  renderCitas(filterAppointments());
});

function refreshCitasViews() {
  renderCalendar();
  renderCitas(filterAppointments());
  renderPendingCitas();
}

function buildAppointmentCard(apt) {
  const card = document.createElement("div");
  card.className = "portal-card";
  card.innerHTML = `
    <img src="${apt.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div class="portal-card-body">
      <strong>${apt.pet_name || "Mascota"} · ${apt.pet_breed || ""}</strong>
      <span>${apt.service || ""} — ${apt.date || ""} ${apt.time || ""}</span>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "portal-card-actions";

  if (apt.status === "pending") {
    const approveBtn = document.createElement("button");
    approveBtn.type = "button";
    approveBtn.className = "portal-approve-btn";
    approveBtn.textContent = "Aprobar";
    approveBtn.addEventListener("click", async () => {
      await supabase.from("appointments").update({ status: "confirmed" }).eq("id", apt.id);
      apt.status = "confirmed";
      refreshCitasViews();
    });
    actions.appendChild(approveBtn);
  }

  const select = document.createElement("select");
  select.className = "portal-status";
  Object.entries(STATUS_LABELS).forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (value === apt.status) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", async () => {
    await supabase.from("appointments").update({ status: select.value }).eq("id", apt.id);
    apt.status = select.value;
    refreshCitasViews();
  });
  actions.appendChild(select);

  const rescheduleToggle = document.createElement("button");
  rescheduleToggle.type = "button";
  rescheduleToggle.className = "portal-reschedule-toggle";
  rescheduleToggle.textContent = "Reprogramar";
  actions.appendChild(rescheduleToggle);

  card.appendChild(actions);

  const rescheduleForm = document.createElement("div");
  rescheduleForm.className = "portal-reschedule-form";
  rescheduleForm.hidden = true;
  rescheduleForm.innerHTML = `
    <input type="date" class="reschedule-date" value="${apt.date || ""}" />
    <input type="text" class="reschedule-time" value="${apt.time || ""}" placeholder="Hora, ej. 10:00 AM" />
    <button type="button" class="portal-reschedule-save">Guardar cambios</button>
  `;
  rescheduleToggle.addEventListener("click", () => {
    rescheduleForm.hidden = !rescheduleForm.hidden;
  });
  rescheduleForm.querySelector(".portal-reschedule-save").addEventListener("click", async () => {
    const newDate = rescheduleForm.querySelector(".reschedule-date").value;
    const newTime = rescheduleForm.querySelector(".reschedule-time").value.trim();
    if (!newDate || !newTime) return;
    await supabase.from("appointments").update({ date: newDate, time: newTime }).eq("id", apt.id);
    apt.date = newDate;
    apt.time = newTime;
    refreshCitasViews();
  });
  card.appendChild(rescheduleForm);

  return card;
}

function renderCitas(appointments) {
  citasList.innerHTML = "";
  citasEmpty.hidden = appointments.length > 0;
  appointments.forEach((apt) => citasList.appendChild(buildAppointmentCard(apt)));
}

function renderPendingCitas() {
  const pending = allAppointments.filter((a) => a.status === "pending");
  citasPendingSection.hidden = pending.length === 0;
  citasPendingList.innerHTML = "";
  pending.forEach((apt) => citasPendingList.appendChild(buildAppointmentCard(apt)));
}

const pacientesSearch = document.getElementById("pacientes-search");
const pacientesNoResults = document.getElementById("pacientes-no-results");
let allPatients = [];

function renderPacientes(appointments) {
  const byPet = new Map();
  appointments.forEach((apt) => {
    const key = apt.pet_id || apt.pet_name;
    if (!key) return;
    if (!byPet.has(key)) {
      byPet.set(key, { ...apt, visits: 0 });
    }
    byPet.get(key).visits += 1;
  });

  allPatients = Array.from(byPet.values());
  pacientesEmpty.hidden = allPatients.length > 0;
  renderPatientCards(allPatients);
}

function renderPatientCards(patients) {
  pacientesList.innerHTML = "";
  pacientesNoResults.hidden = patients.length > 0 || allPatients.length === 0;

  patients.forEach((p) => {
    const card = document.createElement("div");
    card.className = "portal-patient-card";
    card.innerHTML = `
      <img src="${p.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <strong>${p.pet_name || "Mascota"}</strong>
      <span>${p.pet_breed || ""}</span>
      <span>${p.visits} cita${p.visits > 1 ? "s" : ""}</span>
    `;
    card.addEventListener("click", () => showPatientDetail(p.pet_id || p.pet_name, p));
    pacientesList.appendChild(card);
  });
}

pacientesSearch.addEventListener("input", () => {
  const q = pacientesSearch.value.trim().toLowerCase();
  if (!q) {
    renderPatientCards(allPatients);
    return;
  }
  const filtered = allPatients.filter(
    (p) => (p.pet_name || "").toLowerCase().includes(q) || (p.pet_breed || "").toLowerCase().includes(q)
  );
  renderPatientCards(filtered);
});

const pacientesGridView = document.getElementById("pacientes-grid-view");
const patientDetailView = document.getElementById("patient-detail-view");
const patientDetailBack = document.getElementById("patient-detail-back");
const patientDetailBody = document.getElementById("patient-detail-body");

function closePatientDetail() {
  patientDetailView.hidden = true;
  pacientesGridView.hidden = false;
}

patientDetailBack.addEventListener("click", closePatientDetail);

function createMedicationRow(rowsContainer) {
  const row = document.createElement("div");
  row.className = "portal-rx-row";
  row.innerHTML = `
    <input type="text" placeholder="Medicamento" class="rx-name" />
    <input type="text" placeholder="Dosis" class="rx-dose" />
    <input type="text" placeholder="Frecuencia" class="rx-frequency" />
    <input type="text" placeholder="Duración" class="rx-duration" />
    <input type="text" placeholder="Indicaciones" class="rx-instructions" />
    <button type="button" class="portal-rx-remove-line" aria-label="Quitar">✕</button>
  `;
  row.querySelector(".portal-rx-remove-line").addEventListener("click", () => {
    if (rowsContainer.children.length > 1) row.remove();
  });
  rowsContainer.appendChild(row);
  return row;
}

function buildPrescriptionHTML(rx, apt) {
  const meds = (rx.medications || [])
    .map(
      (m) => `
      <tr>
        <td>${m.name || ""}</td>
        <td>${m.dose || ""}</td>
        <td>${m.frequency || ""}</td>
        <td>${m.duration || ""}</td>
        <td>${m.instructions || ""}</td>
      </tr>`
    )
    .join("");
  const date = rx.created_at ? new Date(rx.created_at).toLocaleDateString("es-CO") : "";

  return `
    <!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Orden médica — ${apt.pet_name || ""}</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; padding: 40px; color: #1c1330; }
        h1 { margin: 0 0 2px; font-size: 22px; }
        .muted { color: #6c6480; font-size: 13px; margin: 0 0 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e1f0; font-size: 13px; }
        th { color: #6c6480; text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; }
        .notes { margin-bottom: 40px; }
        .notes h3 { font-size: 13px; margin-bottom: 6px; }
        .sign { margin-top: 60px; }
        .sign-line { border-top: 1px solid #1c1330; width: 260px; padding-top: 6px; font-size: 12px; color: #6c6480; }
        .print-bar { margin-bottom: 24px; }
        .print-bar button {
          background: linear-gradient(135deg, #6d38ee, #9c56ff); border: none; color: #fff;
          font-weight: 700; font-size: 13px; padding: 8px 18px; border-radius: 999px; cursor: pointer;
        }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <button onclick="window.print()">🖨️ Imprimir</button>
      </div>
      <h1>${currentProfile?.business_name || currentProfile?.name || ""}</h1>
      <p class="muted">${currentProfile?.address || ""}${currentProfile?.phone ? " · " + currentProfile.phone : ""}</p>
      <div class="row">
        <span><strong>Paciente:</strong> ${apt.pet_name || ""} (${apt.pet_breed || ""})</span>
        <span><strong>Fecha:</strong> ${date}</span>
      </div>
      <table>
        <thead>
          <tr><th>Medicamento</th><th>Dosis</th><th>Frecuencia</th><th>Duración</th><th>Indicaciones</th></tr>
        </thead>
        <tbody>${meds}</tbody>
      </table>
      ${rx.notes ? `<div class="notes"><h3>Exámenes solicitados / notas</h3><p>${rx.notes}</p></div>` : ""}
      <div class="sign">
        <div class="sign-line">Firma del veterinario</div>
      </div>
    </body>
    </html>
  `;
}

function previewPrescription(rx, apt) {
  const win = window.open("", "_blank");
  win.document.write(buildPrescriptionHTML(rx, apt));
  win.document.close();
  win.focus();
}

function printPrescription(rx, apt) {
  const win = window.open("", "_blank");
  win.document.write(buildPrescriptionHTML(rx, apt));
  win.document.close();
  win.focus();
  win.print();
}

function renderRxList(container, prescriptions, apt) {
  container.innerHTML = "";
  prescriptions.forEach((rx) => {
    const card = document.createElement("div");
    card.className = "portal-rx-card";
    const meds = (rx.medications || [])
      .map(
        (m) => `
        <div class="portal-rx-med">
          <strong>${m.name || ""}</strong> — ${[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ")}
          ${m.instructions ? `<span>${m.instructions}</span>` : ""}
        </div>`
      )
      .join("");
    const date = rx.created_at ? new Date(rx.created_at).toLocaleDateString("es-CO") : "";
    const notesHtml = rx.notes ? `<div class="portal-rx-med"><span>🧪 ${rx.notes}</span></div>` : "";
    card.innerHTML = `<span class="portal-rx-date">${date}</span>${meds}${notesHtml}`;

    const actions = document.createElement("div");
    actions.className = "portal-rx-card-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "portal-rx-print";
    previewBtn.textContent = "👁️ Previsualizar";
    previewBtn.addEventListener("click", () => previewPrescription(rx, apt));
    actions.appendChild(previewBtn);

    const printBtn = document.createElement("button");
    printBtn.type = "button";
    printBtn.className = "portal-rx-print";
    printBtn.textContent = "🖨️ Imprimir orden";
    printBtn.addEventListener("click", () => printPrescription(rx, apt));
    actions.appendChild(printBtn);

    card.appendChild(actions);
    container.appendChild(card);
  });
}

function createRxSection(apt) {
  const section = document.createElement("div");
  section.className = "portal-visit-section";

  const head = document.createElement("div");
  head.className = "portal-visit-section-head";
  head.innerHTML = `<span><span class="portal-section-icon is-rx">💊</span> Recetas</span>`;
  section.appendChild(head);

  const listEl = document.createElement("div");
  listEl.className = "portal-rx-list";
  section.appendChild(listEl);

  const form = document.createElement("div");
  form.className = "portal-rx-form";
  form.hidden = true;
  const rows = document.createElement("div");
  rows.className = "portal-rx-rows";
  form.appendChild(rows);
  createMedicationRow(rows);

  const addLineBtn = document.createElement("button");
  addLineBtn.type = "button";
  addLineBtn.className = "portal-rx-add-line";
  addLineBtn.textContent = "+ Medicamento";
  addLineBtn.addEventListener("click", () => createMedicationRow(rows));
  form.appendChild(addLineBtn);

  const notesInput = document.createElement("textarea");
  notesInput.className = "rx-notes";
  notesInput.rows = 2;
  notesInput.placeholder = "Exámenes solicitados / notas (opcional)";
  form.appendChild(notesInput);

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "portal-rx-save";
  saveBtn.textContent = "Guardar receta";
  section.appendChild(form);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "portal-visit-toggle";
  toggleBtn.textContent = "+ Agregar receta";
  toggleBtn.addEventListener("click", () => {
    form.hidden = !form.hidden;
  });
  head.appendChild(toggleBtn);
  form.appendChild(saveBtn);

  const rxState = [];

  saveBtn.addEventListener("click", async () => {
    const medications = Array.from(rows.children)
      .map((row) => ({
        name: row.querySelector(".rx-name").value.trim(),
        dose: row.querySelector(".rx-dose").value.trim(),
        frequency: row.querySelector(".rx-frequency").value.trim(),
        duration: row.querySelector(".rx-duration").value.trim(),
        instructions: row.querySelector(".rx-instructions").value.trim(),
      }))
      .filter((m) => m.name);
    if (medications.length === 0) return;

    const { data: inserted } = await supabase
      .from("prescriptions")
      .insert({ appointment_id: apt.id, vet_id: currentVetId, medications, notes: notesInput.value.trim() || null })
      .select()
      .single();

    if (inserted) {
      rxState.unshift(inserted);
      renderRxList(listEl, rxState, apt);
      rows.innerHTML = "";
      createMedicationRow(rows);
      notesInput.value = "";
      form.hidden = true;
    }
  });

  return { section, listEl, rxState };
}

function renderExamList(container, exams) {
  container.innerHTML = "";
  exams.forEach((exam) => {
    const item = document.createElement("div");
    item.className = "portal-exam-item";
    const isImage = /\.(png|jpe?g|webp)$/i.test(exam.file_name);
    item.innerHTML = `
      <span class="portal-exam-item-icon">${isImage ? "🖼️" : "📄"}</span>
      <span class="portal-exam-name">${exam.file_name}</span>
      <button type="button" class="portal-exam-view">Ver</button>
    `;
    const viewBtn = item.querySelector(".portal-exam-view");
    viewBtn.addEventListener("click", async () => {
      viewBtn.textContent = "Cargando...";
      const { data } = await supabase.storage.from("medical-exams").createSignedUrl(exam.file_path, 60);
      viewBtn.textContent = "Ver";
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    });
    container.appendChild(item);
  });
}

function createExamSection(apt) {
  const section = document.createElement("div");
  section.className = "portal-visit-section";

  const head = document.createElement("div");
  head.className = "portal-visit-section-head";
  head.innerHTML = `<span><span class="portal-section-icon is-exam">🧪</span> Exámenes</span>`;
  section.appendChild(head);

  const listEl = document.createElement("div");
  listEl.className = "portal-exam-list";
  section.appendChild(listEl);

  const uploadLabel = document.createElement("label");
  uploadLabel.className = "portal-file-btn";
  uploadLabel.innerHTML = `Subir examen <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden />`;
  const fileInput = uploadLabel.querySelector("input");
  head.appendChild(uploadLabel);

  const examState = [];

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    uploadLabel.classList.add("is-uploading");
    const uploadingText = uploadLabel.firstChild;
    uploadingText.textContent = "Subiendo...";

    const path = `${currentVetId}/${apt.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("medical-exams")
      .upload(path, file, { contentType: file.type });

    if (!uploadErr) {
      const { data: inserted } = await supabase
        .from("medical_exams")
        .insert({ appointment_id: apt.id, vet_id: currentVetId, file_path: path, file_name: file.name, mime_type: file.type })
        .select()
        .single();
      if (inserted) {
        examState.unshift(inserted);
        renderExamList(listEl, examState);
      }
    }
    uploadingText.textContent = "Subir examen";
    uploadLabel.classList.remove("is-uploading");
    fileInput.value = "";
  });

  return { section, listEl, examState };
}

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#7c3aed",
  in_progress: "#2563eb",
  completed: "#16a34a",
  cancelled: "#e11d48",
};

async function showPatientDetail(key, petInfo) {
  const visits = allAppointments
    .filter((a) => (a.pet_id || a.pet_name) === key)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const visitIds = visits.map((v) => v.id);
  const [{ data: rxData }, { data: examData }] = await Promise.all([
    supabase.from("prescriptions").select("*").in("appointment_id", visitIds).order("created_at", { ascending: false }),
    supabase.from("medical_exams").select("*").in("appointment_id", visitIds).order("uploaded_at", { ascending: false }),
  ]);
  const rxByApt = groupBy(rxData || [], "appointment_id");
  const examByApt = groupBy(examData || [], "appointment_id");

  patientDetailBody.innerHTML = `
    <div class="portal-patient-hero">
      <div class="portal-patient-hero-photo">
        <img src="${petInfo.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
      </div>
      <div class="portal-patient-hero-info">
        <h2>${petInfo.pet_name || "Mascota"}</h2>
        <p>${petInfo.pet_breed || ""}</p>
        <span class="portal-patient-hero-stat">${visits.length} visita${visits.length === 1 ? "" : "s"}</span>
      </div>
    </div>
    <div class="portal-timeline" id="patient-timeline"></div>
  `;

  const timeline = patientDetailBody.querySelector("#patient-timeline");

  visits.forEach((apt) => {
    const item = document.createElement("div");
    item.className = "portal-timeline-item";

    const dot = document.createElement("div");
    dot.className = "portal-timeline-dot";
    dot.style.setProperty("--dot-color", STATUS_COLORS[apt.status] || "#8f53ff");
    item.appendChild(dot);

    const visit = document.createElement("div");
    visit.className = "portal-visit portal-timeline-card";
    visit.innerHTML = `
      <div class="portal-visit-head">
        <strong>${apt.service || "Consulta"}</strong>
        <span class="portal-status-pill" style="--pill-color:${STATUS_COLORS[apt.status] || "#8f53ff"}">${STATUS_LABELS[apt.status] || apt.status}</span>
      </div>
      <span class="portal-visit-date">${apt.date || ""} ${apt.time || ""}${apt.doctor_name ? ` · Atendido por ${apt.doctor_name}` : ""}</span>
      <span class="portal-visit-notes-label">Notas clínicas</span>
      <textarea placeholder="Diagnóstico, tratamiento, indicaciones...">${apt.notes || ""}</textarea>
      <button type="button" class="portal-visit-save">Guardar nota</button>
      <span class="portal-success" hidden>Guardado ✓</span>
    `;
    const textarea = visit.querySelector("textarea");
    const saveBtn = visit.querySelector(".portal-visit-save");
    const savedLabel = visit.querySelector(".portal-success");
    saveBtn.addEventListener("click", async () => {
      await supabase.from("appointments").update({ notes: textarea.value.trim() }).eq("id", apt.id);
      apt.notes = textarea.value.trim();
      savedLabel.hidden = false;
      setTimeout(() => (savedLabel.hidden = true), 2000);
    });

    const { section: rxSection, listEl: rxListEl, rxState } = createRxSection(apt);
    rxState.push(...(rxByApt.get(apt.id) || []));
    renderRxList(rxListEl, rxState, apt);
    visit.appendChild(rxSection);

    const { section: examSection, listEl: examListEl, examState } = createExamSection(apt);
    examState.push(...(examByApt.get(apt.id) || []));
    renderExamList(examListEl, examState);
    visit.appendChild(examSection);

    item.appendChild(visit);
    timeline.appendChild(item);
  });

  pacientesGridView.hidden = true;
  patientDetailView.hidden = false;
}

async function loadTabData({ session }) {
  currentVetId = session.user.id;
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("vet_id", session.user.id)
    .order("date", { ascending: true });

  allAppointments = data || [];
  selectedDateFilter = null;
  if (allAppointments[0]?.date) {
    const [y, m] = allAppointments[0].date.split("-").map(Number);
    calendarViewDate = new Date(y, m - 1, 1);
  }
  renderCalendar();
  renderCitas(filterAppointments());
  renderPendingCitas();
  renderPacientes(allAppointments);
}

(async function init() {
  const ctx = await requireProviderSession();
  if (ctx) await loadTabData(ctx);

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") showLogin();
  });
})();

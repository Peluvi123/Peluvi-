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
};

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

  showDashboard(profile);
  fillClinicForm(profile);
  return { session, profile };
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

function fillClinicForm(profile) {
  clinicaFields.business_name.value = profile.business_name || "";
  clinicaFields.address.value = profile.address || "";
  clinicaFields.phone.value = profile.phone || "";
  clinicaFields.city.value = profile.city || "";
}

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

  clinicaSuccess.hidden = false;
  dashboardGreeting.textContent = `Hola, ${clinicaFields.business_name.value.trim()}`;
});

function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  calMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const datesWithApt = new Set(allAppointments.map((a) => a.date).filter(Boolean));

  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = (firstDayOfMonth.getDay() - WEEKDAY_START + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  calGrid.innerHTML = "";

  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
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
      if (datesWithApt.has(cellKey)) btn.classList.add("has-apt");
      if (cellKey === selectedDateFilter) btn.classList.add("is-selected");
      btn.addEventListener("click", () => {
        selectedDateFilter = selectedDateFilter === cellKey ? null : cellKey;
        renderCalendar();
        renderCitas(filterAppointments());
      });
    }
    calGrid.appendChild(btn);
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

function renderCitas(appointments) {
  citasList.innerHTML = "";
  citasEmpty.hidden = appointments.length > 0;

  appointments.forEach((apt) => {
    const card = document.createElement("div");
    card.className = "portal-card";
    card.innerHTML = `
      <img src="${apt.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div class="portal-card-body">
        <strong>${apt.pet_name || "Mascota"} · ${apt.pet_breed || ""}</strong>
        <span>${apt.service || ""} — ${apt.date || ""} ${apt.time || ""}</span>
      </div>
    `;
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
    });
    card.appendChild(select);
    citasList.appendChild(card);
  });
}

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

  const patients = Array.from(byPet.values());
  pacientesList.innerHTML = "";
  pacientesEmpty.hidden = patients.length > 0;

  patients.forEach((p) => {
    const card = document.createElement("div");
    card.className = "portal-patient-card";
    card.innerHTML = `
      <img src="${p.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <strong>${p.pet_name || "Mascota"}</strong>
      <span>${p.pet_breed || ""}</span>
      <span>${p.visits} cita${p.visits > 1 ? "s" : ""}</span>
    `;
    pacientesList.appendChild(card);
  });
}

async function loadTabData({ session }) {
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
  renderPacientes(allAppointments);
}

(async function init() {
  const ctx = await requireProviderSession();
  if (ctx) await loadTabData(ctx);

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") showLogin();
  });
})();

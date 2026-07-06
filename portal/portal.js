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

  const appointments = data || [];
  renderCitas(appointments);
  renderPacientes(appointments);
}

(async function init() {
  const ctx = await requireProviderSession();
  if (ctx) await loadTabData(ctx);

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") showLogin();
  });
})();

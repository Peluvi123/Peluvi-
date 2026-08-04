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

const STORE_STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STORE_CATEGORY_LABELS = {
  food: "Alimento",
  snacks: "Snacks",
  supplements: "Suplementos",
  accessories: "Accesorios",
  hygiene: "Higiene",
};

const CARE_STATUS_LABELS = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const CARE_CATEGORIES = {
  paseo: { label: "Paseos", color: "#7c3aed", bg: "#f5f3ff" },
  guarderia: { label: "Guarderías", color: "#f97316", bg: "#fff7ed" },
  colegio: { label: "Escuelas", color: "#0891b2", bg: "#ecfeff" },
};

const CARE_PROFILE = {
  id: "c1",
  name: "Juan Camilo Reyes",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  address: "Chapinero, Bogotá",
  phone: "+57 314 789 0123",
  email: "juancamilo@peluvicare.com",
  bio: "Cuidador certificado con 4 años de experiencia. Especialista en perros y gatos de todas las razas.",
  rating: 4.9,
  reviewCount: 156,
  totalSessions: 423,
  activeClients: 18,
  monthlyRevenue: "$6.200.000",
  services: ["Visita en casa", "Guardería", "Paseo individual", "Paseo grupal", "Entrenamiento básico"],
  certifications: ["First Aid Pet", "Dog Trainer Level 1"],
};

const DEMO_PASSWORD = "PeluviDemo2026!";
const DEMO_PASSWORD_ALIASES = new Set([DEMO_PASSWORD, "PeluviDemo2026", "peluvidemo2026"]);
const DEMO_SESSION_KEY = "peluvi_demo_provider_session";
const DEMO_ACCOUNTS = {
  "demo.veterinaria@peluvi.test": {
    id: "demo_vet",
    name: "Veterinaria Demo Peluvi",
    business_name: "Veterinaria Demo Peluvi",
    role: "provider",
    provider_type: "vet",
    address: "Cra 43 #10-20",
    phone: "+57 300 111 1111",
    city: "Medellín",
  },
  "demo.peluqueria@peluvi.test": {
    id: "demo_grooming",
    name: "Peluquería Demo Peluvi",
    business_name: "Peluquería Demo Peluvi",
    role: "provider",
    provider_type: "grooming",
    address: "Calle 12 #34-56",
    phone: "+57 300 222 2222",
    city: "Medellín",
  },
  "demo.tienda@peluvi.test": {
    id: "demo_store",
    name: "PetMarket Colombia",
    business_name: "PetMarket Colombia",
    role: "provider",
    provider_type: "store",
    address: "Cl. 72 #10-34, Chapinero, Bogotá",
    phone: "+57 601 234 5678",
    city: "Bogotá",
  },
  "demo.cuidador@peluvi.test": {
    id: "demo_caretaker",
    name: "Juan Camilo Reyes",
    business_name: "Juan Camilo Reyes",
    role: "provider",
    provider_type: "caretaker",
    address: "Chapinero, Bogotá",
    phone: "+57 314 789 0123",
    city: "Bogotá",
  },
};

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const logoutBtn = document.getElementById("logout-btn");
const portalBrandScope = document.getElementById("portal-brand-scope");
const dashboardGreeting = document.getElementById("dashboard-greeting");
const dashboardSub = document.getElementById("dashboard-sub");

const citasList = document.getElementById("citas-list");
const citasEmpty = document.getElementById("citas-empty");
const citasPendingSection = document.getElementById("citas-pending-section");
const citasPendingList = document.getElementById("citas-pending-list");
const solicitudesTabBtn = document.getElementById("solicitudes-tab-btn");
const solicitudesTabCount = document.getElementById("solicitudes-tab-count");
const solicitudesFilter = document.getElementById("solicitudes-filter");
const solicitudesList = document.getElementById("solicitudes-list");
const solicitudesEmpty = document.getElementById("solicitudes-empty");
const pacientesList = document.getElementById("pacientes-list");
const pacientesEmpty = document.getElementById("pacientes-empty");
const pacientesSearch = document.getElementById("pacientes-search");
const pacientesNoResults = document.getElementById("pacientes-no-results");

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
let storeOrders = [];
let storeProducts = [];
let careSessions = [];
let careClients = [];
let activeCareCategory = "paseo";
let calendarViewDate = new Date();
let selectedDateFilter = null;
let currentVetId = null;
let currentProviderType = "vet";
let isDemoSession = false;

const PROVIDER_TYPES = {
  vet: {
    label: "Veterinaria",
    brandScope: "veterinarias",
    profileTable: "vet_profiles",
    mediaBucket: "clinic-media",
    profileTab: "Clínica",
    profileTitle: "Clínica",
    photosTitle: "Fotos de la clínica",
    photosSubtitle: "Imágenes visibles en tu perfil público.",
    appointmentsLabel: "Citas",
    appointmentUnit: "citas",
    patientsLabel: "Pacientes",
    patientsSubtitle: "Mascotas que han agendado contigo.",
    todayTitle: "Agenda de hoy",
    emptyToday: "No tienes citas agendadas para hoy.",
    pendingTitle: "Nuevas citas por aprobar",
    serviceTitle: "Servicios",
  },
  grooming: {
    label: "Peluquería",
    brandScope: "peluquerías",
    profileTable: "grooming_profiles",
    mediaBucket: "grooming-media",
    profileTab: "Peluquería",
    profileTitle: "Peluquería",
    photosTitle: "Fotos de la peluquería",
    photosSubtitle: "Imágenes visibles en tu perfil público.",
    appointmentsLabel: "Citas",
    appointmentUnit: "citas",
    patientsLabel: "Clientes",
    patientsSubtitle: "Mascotas que han reservado servicios contigo.",
    todayTitle: "Agenda de hoy",
    emptyToday: "No tienes servicios agendados para hoy.",
    pendingTitle: "Nuevas citas por aprobar",
    serviceTitle: "Servicios y precios",
  },
  store: {
    label: "Tienda",
    brandScope: "tiendas",
    profileTable: null,
    mediaBucket: null,
    profileTab: "Tienda",
    profileTitle: "Tienda",
    photosTitle: "Fotos de la tienda",
    photosSubtitle: "Productos, vitrinas o imágenes visibles en tu perfil público.",
    appointmentsLabel: "Pedidos",
    appointmentUnit: "pedidos",
    patientsLabel: "Productos",
    patientsSubtitle: "Inventario visible en la tienda de Peluvi.",
    todayTitle: "Pedidos recientes",
    emptyToday: "Aún no tienes pedidos recientes.",
    pendingTitle: "Pedidos pendientes",
    serviceTitle: "Productos destacados",
  },
  caregiver: {
    label: "Cuidador",
    brandScope: "cuidadores",
    profileTable: "caretaker_profiles",
    mediaBucket: "caretaker-media",
    profileTab: "Perfil",
    profileTitle: "Perfil",
    photosTitle: "Fotos del servicio",
    photosSubtitle: "Imágenes visibles en tu perfil público.",
    appointmentsLabel: "Paseos",
    appointmentUnit: "sesiones",
    patientsLabel: "Clientes",
    patientsSubtitle: "Mascotas y dueños que reservan contigo.",
    todayTitle: "¿Qué quieres revisar hoy?",
    emptyToday: "No tienes sesiones registradas para hoy.",
    pendingTitle: "Sesiones por aprobar",
    serviceTitle: "Servicios",
  },
};

PROVIDER_TYPES.food = PROVIDER_TYPES.store;
PROVIDER_TYPES.caretaker = PROVIDER_TYPES.caregiver;

function providerMeta() {
  return PROVIDER_TYPES[currentProviderType] || PROVIDER_TYPES.vet;
}

function profileTable() {
  return providerMeta().profileTable;
}

function isVet() {
  return currentProviderType === "vet";
}

function isGrooming() {
  return currentProviderType === "grooming";
}

function isStore() {
  return currentProviderType === "store" || currentProviderType === "food";
}

function isCaretaker() {
  return currentProviderType === "caregiver" || currentProviderType === "caretaker";
}

function supportsMedicalRecords() {
  return isVet() || isGrooming();
}

function localProfileKey() {
  return `peluvi_provider_profile_${currentVetId || "draft"}_${currentProviderType}`;
}

function loadLocalProviderProfile() {
  try {
    return JSON.parse(localStorage.getItem(localProfileKey()) || "{}");
  } catch {
    return {};
  }
}

function saveLocalProviderProfile(profile) {
  localStorage.setItem(localProfileKey(), JSON.stringify(profile || {}));
}

function demoMedicalRecordsKey() {
  return `peluvi_demo_medical_records_${currentVetId || "demo_vet"}`;
}

function buildDemoPatientRecords() {
  return {
    demo_pet_luna: {
      pet_key: "demo_pet_luna",
      pet_name: "Luna",
      breed: "Golden retriever",
      pet_image_url: "../assets/pet-luna-golden-selfie.png",
      species: "Perro",
      gender: "female",
      born: "2022-05-14",
      color: "Dorado",
      weight: "28.4 kg",
      chip: "COL-9852147",
      blood_type: "DEA 1.1 positivo",
      allergies: ["Pollo"],
      clinical_alerts: ["Sensibilidad digestiva"],
      owner_name: "Laura Martínez",
      owner_phone: "+57 310 555 0148",
      owner_email: "laura.martinez@peluvi.test",
      notes: "Paciente sociable. Sensibilidad digestiva; evitar alimentos con pollo.",
      sterilized: true,
      dewormed: true,
      vaccines: [
        { vaccine_name: "Rabia", date_given: "2026-02-18", next_due_date: "2027-02-18", notes: "Refuerzo anual" },
        { vaccine_name: "Polivalente canina", date_given: "2026-01-22", next_due_date: "2027-01-22", notes: "Esquema al día" },
      ],
    },
    demo_pet_milo: {
      pet_key: "demo_pet_milo",
      pet_name: "Milo",
      breed: "Gato",
      pet_image_url: "../assets/pet-milo-cat-selfie.png",
      species: "Gato",
      gender: "male",
      born: "2023-09-03",
      color: "Atigrado",
      weight: "5.2 kg",
      chip: "COL-7734102",
      blood_type: "A",
      allergies: [],
      clinical_alerts: [],
      owner_name: "Carlos Ramírez",
      owner_phone: "+57 315 444 0281",
      owner_email: "carlos.ramirez@peluvi.test",
      notes: "Paciente tranquilo durante consulta. Vive exclusivamente en interior.",
      sterilized: true,
      dewormed: true,
      vaccines: [
        { vaccine_name: "Triple felina", date_given: "2026-03-10", next_due_date: "2027-03-10", notes: "Refuerzo anual" },
      ],
    },
  };
}

function loadDemoPatientRecords() {
  const defaults = buildDemoPatientRecords();
  try {
    const saved = JSON.parse(localStorage.getItem(demoMedicalRecordsKey()) || "{}");
    Object.keys(defaults).forEach((key) => {
      defaults[key] = { ...defaults[key], ...(saved[key] || {}) };
    });
  } catch {
    // Conserva los datos demo predeterminados si el almacenamiento está dañado.
  }
  return defaults;
}

function saveDemoPatientRecord(key, record) {
  const records = loadDemoPatientRecords();
  records[key] = { ...(records[key] || {}), ...record, pet_key: key };
  localStorage.setItem(demoMedicalRecordsKey(), JSON.stringify(records));
  const linkedIndex = linkedPatientRecords.findIndex((item) => item.pet_key === key);
  if (linkedIndex >= 0) linkedPatientRecords[linkedIndex] = records[key];
  else linkedPatientRecords.push(records[key]);
  return records[key];
}

function buildDemoProfile(providerType) {
  if (providerType === "vet") {
    return {
      whatsapp: "+57 300 111 1111",
      schedule: "Lun-Vie 8:00am-6:00pm | Sáb 9:00am-1:00pm",
      schedule_details: [
        { day: "Lun", open: "08:00", close: "18:00" },
        { day: "Mar", open: "08:00", close: "18:00" },
        { day: "Mié", open: "08:00", close: "18:00" },
        { day: "Jue", open: "08:00", close: "18:00" },
        { day: "Vie", open: "08:00", close: "18:00" },
        { day: "Sáb", open: "09:00", close: "13:00" },
      ],
      services: ["Consulta general", "Vacunación", "Urgencias 24h", "Laboratorio"],
      description: "Atención integral para mascotas con agenda, pacientes, controles y seguimiento clínico.",
      emergency: true,
      doctors: [
        { id: "doc_demo_1", name: "Dra. Laura Pérez", specialty: "Medicina general", available: true },
        { id: "doc_demo_2", name: "Dr. Andrés Gómez", specialty: "Urgencias", available: false },
      ],
      images: [],
    };
  }
  if (providerType === "grooming") {
    return {
      whatsapp: "+57 300 222 2222",
      schedule: "Lun-Sáb 9:00am-5:00pm",
      schedule_details: [
        { day: "Lun", open: "09:00", close: "17:00" },
        { day: "Mar", open: "09:00", close: "17:00" },
        { day: "Mié", open: "09:00", close: "17:00" },
        { day: "Jue", open: "09:00", close: "17:00" },
        { day: "Vie", open: "09:00", close: "17:00" },
        { day: "Sáb", open: "09:00", close: "17:00" },
      ],
      services: [
        { name: "Baño y corte", price: "$45.000", duration: "1h 30m" },
        { name: "Spa completo", price: "$70.000", duration: "2h" },
        { name: "Corte de uñas", price: "$15.000", duration: "20m" },
      ],
      description: "Peluquería aliada con servicios por tamaño, tipo de pelaje y agenda de reservas.",
      images: [],
    };
  }
  if (providerType === "store" || providerType === "food") {
    return {
      whatsapp: "+57 601 234 5678",
      schedule: "Lun-Sáb 8am-8pm · Dom 9am-5pm",
      schedule_details: [
        { day: "Lun", open: "08:00", close: "20:00" },
        { day: "Mar", open: "08:00", close: "20:00" },
        { day: "Mié", open: "08:00", close: "20:00" },
        { day: "Jue", open: "08:00", close: "20:00" },
        { day: "Vie", open: "08:00", close: "20:00" },
        { day: "Sáb", open: "09:00", close: "18:00" },
        { day: "Dom", open: "10:00", close: "16:00" },
      ],
      services: [
        { name: "Concentrado premium", price: "$82.000", duration: "3 kg" },
        { name: "Juguetes interactivos", price: "Desde $25.000", duration: "Perros y gatos" },
        { name: "Snacks naturales", price: "$18.000", duration: "Bolsa 250 g" },
      ],
      description: "Tienda aliada para publicar catálogo, novedades, horarios y solicitudes de clientes.",
      images: [],
    };
  }
  return {
    whatsapp: "+57 300 444 4444",
    schedule: "Lun-Sáb 7:00am-7:00pm",
    schedule_details: [
      { day: "Lun", open: "07:00", close: "19:00" },
      { day: "Mar", open: "07:00", close: "19:00" },
      { day: "Mié", open: "07:00", close: "19:00" },
      { day: "Jue", open: "07:00", close: "19:00" },
      { day: "Vie", open: "07:00", close: "19:00" },
      { day: "Sáb", open: "08:00", close: "16:00" },
    ],
    services: [
      { name: "Paseo de 30 min", price: "$25.000", duration: "30m" },
      { name: "Cuidado en casa", price: "$80.000", duration: "Medio día" },
      { name: "Guardería por día", price: "$120.000", duration: "8h" },
    ],
    description: "Cuidador aliado para gestionar reservas, rutinas, paseos y seguimiento de mascotas.",
    images: [],
  };
}

function buildDemoAppointments(providerType) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowKey = toDateKey(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  const base = {
    vet_id: currentVetId,
    pet_id: "demo_pet_luna",
    pet_name: "Luna",
    pet_breed: "Golden retriever",
    pet_image: "../assets/pet-luna-golden-selfie.png",
    user_id: "demo_user",
    owner_name: "Laura Martínez",
    owner_phone: "+57 310 555 0148",
    request_note: "Control general y revisión preventiva.",
    requested_at: new Date().toISOString(),
  };
  if (providerType === "store") {
    return [
      { ...base, id: "demo_store_1", service: "Consulta de concentrado premium", date: todayKey, time: "10:30 AM", status: "pending" },
      { ...base, id: "demo_store_2", pet_id: "demo_pet_milo", pet_name: "Milo", pet_breed: "Gato", pet_image: "../assets/pet-milo-cat-selfie.png", service: "Disponibilidad de snacks", date: tomorrowKey, time: "3:00 PM", status: "confirmed" },
    ];
  }
  if (providerType === "caregiver") {
    return [
      { ...base, id: "demo_caregiver_1", service: "Paseo programado", date: todayKey, time: "7:30 AM", status: "confirmed" },
      { ...base, id: "demo_caregiver_2", pet_id: "demo_pet_simon", pet_name: "Simon", pet_breed: "Gato", pet_image: "../assets/pet-simon-hamster-selfie.png", service: "Cuidado en casa", date: tomorrowKey, time: "9:00 AM", status: "pending" },
    ];
  }
  if (providerType === "grooming") {
    return [
      { ...base, id: "demo_grooming_1", service: "Baño y corte", date: todayKey, time: "11:00 AM", status: "pending" },
      { ...base, id: "demo_grooming_2", pet_id: "demo_pet_milo", pet_name: "Milo", pet_breed: "Gato", pet_image: "../assets/pet-milo-cat-selfie.png", service: "Corte de uñas", date: tomorrowKey, time: "2:00 PM", status: "confirmed" },
    ];
  }
  return [
    { ...base, id: "demo_vet_1", service: "Consulta general", date: todayKey, time: "9:00 AM", status: "completed", doctor_name: "Dra. Laura Pérez", weight_kg: 28.4, temperature_c: 38.3, heart_rate: 92, respiratory_rate: 24, notes: "Paciente alerta y estable. Se recomienda control nutricional y seguimiento en seis meses." },
    { ...base, id: "demo_vet_2", pet_id: "demo_pet_milo", pet_name: "Milo", pet_breed: "Gato", pet_image: "../assets/pet-milo-cat-selfie.png", owner_name: "Carlos Ramírez", owner_phone: "+57 315 444 0281", request_note: "Aplicación de refuerzo anual.", service: "Vacunación", date: tomorrowKey, time: "4:00 PM", status: "confirmed", doctor_name: "Dr. Andrés Gómez", weight_kg: 5.2, temperature_c: 38.5, heart_rate: 148, respiratory_rate: 28, notes: "Apto para vacunación. Sin reacciones adversas observadas." },
    { ...base, id: "demo_vet_request_1", pet_id: "demo_pet_nala", pet_name: "Nala", pet_breed: "Mestiza", pet_image: "../assets/demo-firulais.png", owner_name: "Valentina Ruiz", owner_phone: "+57 301 602 1194", request_note: "Ha presentado irritación en la piel durante los últimos dos días.", service: "Consulta dermatológica", date: tomorrowKey, time: "11:30 AM", status: "pending", doctor_name: "", weight_kg: null, temperature_c: null, heart_rate: null, respiratory_rate: null, notes: "" },
  ];
}

function demoAppointmentsKey(providerType = currentProviderType) {
  return `peluvi_demo_appointments_v2_${currentVetId || "demo"}_${providerType}`;
}

function loadDemoAppointments(providerType) {
  const defaults = buildDemoAppointments(providerType);
  try {
    const saved = JSON.parse(localStorage.getItem(demoAppointmentsKey(providerType)) || "[]");
    const savedById = new Map(saved.map((appointment) => [appointment.id, appointment]));
    return defaults.map((appointment) => ({ ...appointment, ...(savedById.get(appointment.id) || {}) }));
  } catch {
    return defaults;
  }
}

function saveDemoAppointments() {
  if (isDemoSession) {
    localStorage.setItem(demoAppointmentsKey(), JSON.stringify(allAppointments));
  }
}

function buildDemoStoreProducts() {
  return [
    {
      id: "sp1",
      name: "Rocku Adulto 800g",
      brand: "Bonamigo",
      category: "food",
      species: "Perro",
      price: 28000,
      stock: 24,
      sold: 142,
      image_url: "../assets/prod-rocku.png",
    },
    {
      id: "sp2",
      name: "Pedigree Adulto 20kg",
      brand: "Pedigree",
      category: "food",
      species: "Perro",
      price: 185000,
      stock: 18,
      sold: 98,
      image_url: "../assets/prod-pedigree.png",
    },
    {
      id: "sp3",
      name: "Magic Friends 2kg",
      brand: "Magic Friends",
      category: "food",
      species: "Perro",
      price: 45000,
      stock: 60,
      sold: 310,
      image_url: "../assets/prod-magic.png",
    },
    {
      id: "sp4",
      name: "Champú Hipoalergénico 500ml",
      brand: "Bio-Groom",
      category: "hygiene",
      species: "Perro/Gato",
      price: 35000,
      stock: 32,
      sold: 87,
      image_url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "sp5",
      name: "Vitaminas Articulaciones 60 cáps",
      brand: "NutriVet",
      category: "supplements",
      species: "Perro",
      price: 55000,
      stock: 15,
      sold: 44,
      image_url: "https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?auto=format&fit=crop&w=300&q=80",
    },
    {
      id: "sp6",
      name: "Cama Ortopédica M",
      brand: "PetComfort",
      category: "accessories",
      species: "Perro/Gato",
      price: 120000,
      stock: 8,
      sold: 22,
      image_url: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=300&q=80",
    },
  ];
}

function buildDemoStoreOrders() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 6);
  return [
    {
      id: "so1",
      customerName: "Laura Martínez",
      phone: "+57 310 111 2222",
      products: [
        { name: "Pedigree Adulto 20kg", quantity: 1, price: 185000 },
        { name: "Snack Dental Chew", quantity: 2, price: 22000 },
      ],
      total: 229000,
      date: toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
      time: "10:30 AM",
      status: "pending",
      address: "Cra 15 #80-12, Bogotá",
    },
    {
      id: "so2",
      customerName: "Andrés Mora",
      phone: "+57 315 333 4444",
      products: [{ name: "Magic Friends 2kg", quantity: 2, price: 45000 }],
      total: 90000,
      date: toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
      time: "2:00 PM",
      status: "confirmed",
      address: "Cl. 90 #11-45, Bogotá",
    },
    {
      id: "so3",
      customerName: "Valentina Cruz",
      phone: "+57 301 555 7788",
      products: [
        { name: "Champú Hipoalergénico 500ml", quantity: 1, price: 35000 },
        { name: "Vitaminas Articulaciones", quantity: 1, price: 55000 },
      ],
      total: 90000,
      date: toDateKey(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
      time: "4:15 PM",
      status: "shipped",
      address: "Av. Suba #120-50, Bogotá",
    },
    {
      id: "so4",
      customerName: "Carlos Pérez",
      phone: "+57 320 777 9999",
      products: [{ name: "Cama Ortopédica M", quantity: 1, price: 120000 }],
      total: 120000,
      date: toDateKey(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate()),
      time: "9:20 AM",
      status: "delivered",
      address: "Calle 100 #19-20, Bogotá",
    },
  ];
}

function careCategoryForService(service = "") {
  const value = service.toLowerCase();
  if (value.includes("paseo")) return "paseo";
  if (value.includes("entrenamiento")) return "colegio";
  return "guarderia";
}

function buildDemoCareSessions() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowKey = toDateKey(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
  return [
    { id: "cs1", petName: "Beto", petImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200", petBreed: "Golden Retriever", ownerName: "Sandra López", ownerPhone: "+57 310 100 2000", service: "Paseo individual", date: todayKey, time: "07:00 am", duration: "1h", status: "completed", address: "Cra 15 #85-10", price: 35000 },
    { id: "cs2", petName: "Nala", petImage: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200", petBreed: "Poodle", ownerName: "Camila Torres", ownerPhone: "+57 312 200 3000", service: "Visita en casa", date: todayKey, time: "10:00 am", duration: "30min", status: "in_progress", address: "Cl. 90 #12-34", price: 25000 },
    { id: "cs3", petName: "Max", petImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200", petBreed: "Labrador", ownerName: "Felipe Ruiz", ownerPhone: "+57 315 300 4000", service: "Guardería", date: todayKey, time: "08:00 am", duration: "8h", status: "confirmed", address: "Av. Chile #5-20", price: 80000, notes: "Tiene alergia al pollo" },
    { id: "cs4", petName: "Coco", petImage: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=200", petBreed: "Beagle", ownerName: "Andrea Mora", ownerPhone: "+57 318 400 5000", service: "Paseo grupal", date: todayKey, time: "04:00 pm", duration: "1.5h", status: "confirmed", address: "Parque El Virrey", price: 25000 },
    { id: "cs5", petName: "Luna", petImage: "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=200", petBreed: "Shih Tzu", ownerName: "Paola Gómez", ownerPhone: "+57 316 500 6000", service: "Visita en casa", date: todayKey, time: "06:00 pm", duration: "30min", status: "pending", address: "Cra 11 #93-45", price: 25000 },
    { id: "cs6", petName: "Thor", petImage: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200", petBreed: "Bulldog", ownerName: "Martín Díaz", ownerPhone: "+57 311 600 7000", service: "Entrenamiento básico", date: tomorrowKey, time: "09:00 am", duration: "1h", status: "confirmed", address: "Parque Simón Bolívar", price: 60000 },
  ];
}

function buildDemoCareClients() {
  return [
    { id: "cc1", petName: "Beto", petImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200", petBreed: "Golden Retriever", petSpecies: "Perro", ownerName: "Sandra López", ownerPhone: "+57 310 100 2000", address: "Cra 15 #85-10", lastSession: "26 jun 2026", totalSessions: 48, nextSession: "27 jun 2026" },
    { id: "cc2", petName: "Max", petImage: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200", petBreed: "Labrador", petSpecies: "Perro", ownerName: "Felipe Ruiz", ownerPhone: "+57 315 300 4000", address: "Av. Chile #5-20", lastSession: "26 jun 2026", totalSessions: 32, notes: "Alérgico al pollo" },
    { id: "cc3", petName: "Nala", petImage: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200", petBreed: "Poodle", petSpecies: "Perro", ownerName: "Camila Torres", ownerPhone: "+57 312 200 3000", address: "Cl. 90 #12-34", lastSession: "26 jun 2026", totalSessions: 20 },
    { id: "cc4", petName: "Coco", petImage: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=200", petBreed: "Beagle", petSpecies: "Perro", ownerName: "Andrea Mora", ownerPhone: "+57 318 400 5000", address: "Parque El Virrey", lastSession: "20 jun 2026", totalSessions: 15, nextSession: "26 jun 2026" },
    { id: "cc5", petName: "Luna", petImage: "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=200", petBreed: "Shih Tzu", petSpecies: "Perro", ownerName: "Paola Gómez", ownerPhone: "+57 316 500 6000", address: "Cra 11 #93-45", lastSession: "15 jun 2026", totalSessions: 8 },
  ];
}

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
const scheduleToggleBtn = document.getElementById("schedule-toggle");
const scheduleSummary = document.getElementById("schedule-summary");

scheduleToggleBtn.addEventListener("click", () => {
  scheduleDaysList.hidden = !scheduleDaysList.hidden;
  scheduleToggleBtn.textContent = scheduleDaysList.hidden ? "Editar horario" : "Ocultar";
});

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

const vetServicesBlock = document.getElementById("clinica-vet-services");
const groomingServicesBlock = document.getElementById("clinica-grooming-services");
const groomingServicesList = document.getElementById("grooming-services-list");
const groomingServiceNameInput = document.getElementById("grooming-service-name");
const groomingServicePriceInput = document.getElementById("grooming-service-price");
const groomingServiceDurationInput = document.getElementById("grooming-service-duration");
const groomingServiceAddBtn = document.getElementById("grooming-service-add-btn");
const doctorsBlock = document.getElementById("clinica-doctors-block");
const emergencyRow = document.getElementById("clinica-emergency-row");
const providerServicesTitle = document.getElementById("provider-services-title");
const citasTabBtn = document.getElementById("citas-tab-btn");
const careGuarderiaTabBtn = document.getElementById("care-guarderia-tab-btn");
const careEscuelaTabBtn = document.getElementById("care-escuela-tab-btn");
const pacientesTabBtn = document.getElementById("pacientes-tab-btn");
const clinicaTabBtn = document.getElementById("clinica-tab-btn");
const clinicaPanelTitle = document.getElementById("clinica-panel-title");
const citasPanelTitle = document.getElementById("citas-panel-title");
const citasPanelSubtitle = document.getElementById("citas-panel-subtitle");
const pacientesPanelTitle = document.getElementById("pacientes-panel-title");
const pacientesPanelSubtitle = document.getElementById("pacientes-panel-subtitle");
const todaySectionTitle = document.getElementById("today-section-title");
const statTodayLabel = document.getElementById("stat-today-label");
const statPendingLabel = document.getElementById("stat-pending-label");
const statPatientsLabel = document.getElementById("stat-patients-label");
const statMonthLabel = document.getElementById("stat-month-label");

let selectedServices = new Set();
let currentGroomingServices = [];

function applyProviderTypeUI() {
  const meta = providerMeta();
  const vet = isVet();
  const store = isStore();
  const caretaker = isCaretaker();
  const groomingLike = !vet;
  dashboardView.classList.toggle("is-store-dashboard", store);
  dashboardView.classList.toggle("is-caretaker-dashboard", caretaker);
  portalBrandScope.textContent = meta.brandScope;
  vetServicesBlock.hidden = !vet;
  groomingServicesBlock.hidden = !groomingLike;
  doctorsBlock.hidden = !vet;
  emergencyRow.hidden = !vet;
  careGuarderiaTabBtn.hidden = !caretaker;
  careEscuelaTabBtn.hidden = !caretaker;
  solicitudesTabBtn.hidden = store || caretaker;
  clinicaTabBtn.textContent = meta.profileTab;
  clinicaPanelTitle.textContent = meta.profileTitle;
  citasTabBtn.textContent = caretaker ? "Paseos" : store ? meta.appointmentsLabel : "Agenda";
  careGuarderiaTabBtn.textContent = "Guarderías";
  careEscuelaTabBtn.textContent = "Escuelas";
  pacientesTabBtn.textContent = meta.patientsLabel;
  citasPanelTitle.textContent = caretaker ? CARE_CATEGORIES[activeCareCategory].label : store ? meta.appointmentsLabel : "Agenda";
  citasPanelSubtitle.textContent = store
    ? `Todos los ${meta.appointmentUnit} registrados contigo.`
    : caretaker
      ? `Todas las ${meta.appointmentUnit} registradas contigo.`
      : "Citas confirmadas y atenciones programadas.";
  pacientesPanelTitle.textContent = meta.patientsLabel;
  pacientesPanelSubtitle.textContent = meta.patientsSubtitle;
  todaySectionTitle.textContent = meta.todayTitle;
  const todayEmptyEl = document.getElementById("today-empty");
  if (todayEmptyEl) todayEmptyEl.textContent = meta.emptyToday;
  statTodayLabel.textContent = store ? "Pedidos" : caretaker ? "Sesiones hoy" : `${meta.appointmentsLabel} hoy`;
  statPendingLabel.textContent = store ? "Pendientes" : caretaker ? "Próximas" : "Por aprobar";
  statPatientsLabel.textContent = meta.patientsLabel;
  statMonthLabel.textContent = store ? "Stock bajo" : caretaker ? "Ganado hoy" : `${meta.appointmentsLabel} este mes`;
  providerServicesTitle.textContent = meta.serviceTitle;
  pacientesSearch.placeholder = store ? "Buscar producto, marca o categoría..." : caretaker ? "Buscar mascota, dueño o dirección..." : "Buscar por nombre o raza...";
  pacientesEmpty.textContent = store ? "Aún no tienes productos registrados." : caretaker ? "Aún no tienes clientes registrados." : "Aún no tienes pacientes registrados.";
  pacientesNoResults.textContent = store ? "Ningún producto coincide con tu búsqueda." : caretaker ? "Ningún cliente coincide con tu búsqueda." : "Ninguna mascota coincide con tu búsqueda.";
  citasEmpty.textContent = store ? "Aún no tienes pedidos registrados." : caretaker ? "No hay sesiones para este filtro." : "Aún no tienes citas agendadas.";
  groomingServiceNameInput.placeholder = isGrooming()
    ? "Nombre, ej. Baño y corte"
    : store
      ? "Producto, ej. Concentrado premium"
      : "Servicio, ej. Paseo de 30 min";
  groomingServicePriceInput.placeholder = store ? "Precio, ej. $80.000" : "Precio, ej. $45.000";
  groomingServiceDurationInput.placeholder = store ? "Detalle, ej. 3 kg" : "Duración, ej. 1h";

  const photosTitle = document.querySelector("#clinica-doctors-block + .portal-side-block h3");
  const photosSubtitle = document.querySelector("#clinica-doctors-block + .portal-side-block .portal-muted");
  if (photosTitle) photosTitle.textContent = meta.photosTitle;
  if (photosSubtitle) photosSubtitle.textContent = meta.photosSubtitle;
  const linkCodeButton = document.getElementById("link-code-toggle");
  if (linkCodeButton) linkCodeButton.hidden = !supportsMedicalRecords();
  const pendingHead = document.querySelector(".portal-pending-head span");
  if (pendingHead) pendingHead.textContent = `🔔 ${meta.pendingTitle}`;
  const authSubtitleEl = document.getElementById("auth-subtitle");
  const signupFormEl = document.getElementById("signup-form");
  if (authSubtitleEl && signupFormEl?.hidden) {
    authSubtitleEl.textContent = `Ingresa con la cuenta de tu negocio para gestionar tus ${meta.appointmentUnit}.`;
  }
}

function renderGroomingServices() {
  groomingServicesList.innerHTML = "";
  currentGroomingServices.forEach((svc, index) => {
    const row = document.createElement("div");
    row.className = "portal-grooming-service-row";
    row.innerHTML = `
      <strong>${svc.name || ""}</strong>
      <span>${svc.duration || ""}</span>
      <span>${svc.price || ""}</span>
      <button type="button" class="portal-remove-x" aria-label="Quitar">✕</button>
    `;
    row.querySelector(".portal-remove-x").addEventListener("click", () => {
      currentGroomingServices.splice(index, 1);
      renderGroomingServices();
    });
    groomingServicesList.appendChild(row);
  });
}

groomingServiceAddBtn.addEventListener("click", () => {
  const name = groomingServiceNameInput.value.trim();
  const price = groomingServicePriceInput.value.trim();
  const duration = groomingServiceDurationInput.value.trim();
  if (!name) return;
  currentGroomingServices.push({ name, price, duration });
  groomingServiceNameInput.value = "";
  groomingServicePriceInput.value = "";
  groomingServiceDurationInput.value = "";
  renderGroomingServices();
});

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
  if (isDemoSession) {
    saveLocalProviderProfile({ ...loadLocalProviderProfile(), ...patch });
    return;
  }
  const table = profileTable();
  if (!table) {
    saveLocalProviderProfile({ ...loadLocalProviderProfile(), ...patch });
    return;
  }
  await supabase.from(table).upsert({ id: currentVetId, ...patch });
}

async function uploadClinicMedia(file) {
  if (isDemoSession) return URL.createObjectURL(file);
  const bucket = providerMeta().mediaBucket;
  if (!bucket) return URL.createObjectURL(file);
  const path = `${currentVetId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
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

function loginDemoProvider(profile, email = "") {
  isDemoSession = true;
  if (email) sessionStorage.setItem(DEMO_SESSION_KEY, email.toLowerCase());
  currentProviderType = profile.provider_type;
  currentVetId = profile.id;
  currentProfile = profile;
  applyProviderTypeUI();
  const providerProfile = buildDemoProfile(profile.provider_type);
  showDashboard(profile);
  fillClinicForm(profile, providerProfile);
  currentDoctors = providerProfile.doctors ?? [];
  currentImages = providerProfile.images ?? [];
  renderDoctors();
  renderClinicImages();
  loadDemoTabData(profile.provider_type);
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

  if (error || !profile || profile.role !== "provider" || !Object.keys(PROVIDER_TYPES).includes(profile.provider_type)) {
    await supabase.auth.signOut();
    showLogin("Esta cuenta no es de un proveedor válido.");
    return null;
  }

  currentProviderType = profile.provider_type;
  currentVetId = session.user.id;
  applyProviderTypeUI();

  let vetProfile = loadLocalProviderProfile();
  const table = profileTable();
  if (table) {
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    vetProfile = data || {};
  }

  showDashboard(profile);
  currentProfile = profile;
  fillClinicForm(profile, vetProfile);
  currentDoctors = vetProfile?.doctors ?? [];
  currentImages = vetProfile?.images ?? [];
  renderDoctors();
  renderClinicImages();
  return { session, profile, vetProfile };
}

document.querySelectorAll(".portal-password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordTarget);
    if (!input) return;

    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.setAttribute("aria-pressed", String(showPassword));
    button.setAttribute("aria-label", showPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    input.focus({ preventScroll: true });
  });
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  loginSubmit.disabled = true;
  loginSubmit.textContent = "Ingresando...";

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const demoProfile = DEMO_ACCOUNTS[email.toLowerCase()];

  if (demoProfile && DEMO_PASSWORD_ALIASES.has(password)) {
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Ingresar";
    loginDemoProvider(demoProfile, email);
    return;
  }

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

const signupForm = document.getElementById("signup-form");
const signupSubmit = document.getElementById("signup-submit");
const signupError = document.getElementById("signup-error");
const authToggle = document.getElementById("auth-toggle");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const signupProviderTypeInput = document.getElementById("signup-provider-type");
const portalParams = new URLSearchParams(window.location.search);
const requestedProviderType = portalParams.get("tipo");
if (Object.keys(PROVIDER_TYPES).includes(requestedProviderType)) {
  signupProviderTypeInput.value = requestedProviderType;
  currentProviderType = requestedProviderType;
  applyProviderTypeUI();
}
signupProviderTypeInput.addEventListener("change", () => {
  currentProviderType = signupProviderTypeInput.value;
  applyProviderTypeUI();
});

let showingSignup = false;
authToggle.addEventListener("click", () => {
  showingSignup = !showingSignup;
  loginForm.hidden = showingSignup;
  signupForm.hidden = !showingSignup;
  authTitle.textContent = showingSignup ? "Crea tu cuenta de proveedor" : "Portal de proveedores";
  authSubtitle.textContent = showingSignup
    ? `Regístrate para empezar a gestionar tus ${providerMeta().appointmentUnit} en Peluvi.`
    : `Ingresa con la cuenta de tu negocio para gestionar tus ${providerMeta().appointmentUnit}.`;
  authToggle.textContent = showingSignup ? "¿Ya tienes cuenta? Ingresa aquí" : "¿Tienes un negocio de mascotas? Crea tu cuenta";
  loginError.hidden = true;
  signupError.hidden = true;
});

if (portalParams.get("registro") === "1") {
  authToggle.click();
}

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  signupError.hidden = true;
  signupSubmit.disabled = true;
  signupSubmit.textContent = "Creando cuenta...";

  const signupProviderType = document.getElementById("signup-provider-type").value;
  const businessName = document.getElementById("signup-business-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const address = document.getElementById("signup-address").value.trim();
  const phone = document.getElementById("signup-phone").value.trim();
  const city = document.getElementById("signup-city").value.trim();

  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });

  if (signUpErr || !signUpData.session) {
    signupError.textContent = signUpErr
      ? signUpErr.message
      : "No se pudo iniciar sesión automáticamente. Intenta ingresar manualmente.";
    signupError.hidden = false;
    signupSubmit.disabled = false;
    signupSubmit.textContent = "Crear cuenta";
    return;
  }

  const userId = signUpData.user.id;
  const { error: profileErr } = await supabase.from("profiles").insert({
    id: userId,
    name: businessName,
    role: "provider",
    provider_type: signupProviderType,
    business_name: businessName,
    address,
    phone,
    city,
  });

  if (profileErr) {
    signupError.textContent = "Cuenta creada, pero hubo un error guardando tu perfil: " + profileErr.message;
    signupError.hidden = false;
    signupSubmit.disabled = false;
    signupSubmit.textContent = "Crear cuenta";
    return;
  }

  currentProviderType = signupProviderType;
  const table = profileTable();
  if (table) {
    await supabase.from(table).insert({ id: userId });
  } else {
    saveLocalProviderProfile({ id: userId, services: [], images: [] });
  }

  signupSubmit.disabled = false;
  signupSubmit.textContent = "Crear cuenta";
  const ctx = await requireProviderSession();
  if (ctx) loadTabData(ctx);
});

logoutBtn.addEventListener("click", async () => {
  if (isDemoSession) {
    isDemoSession = false;
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    showLogin();
    return;
  }
  await supabase.auth.signOut();
  showLogin();
});

document.querySelectorAll(".portal-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".portal-tab").forEach((b) => b.classList.remove("is-active"));
    document.querySelectorAll(".portal-panel").forEach((p) => (p.hidden = true));
    btn.classList.add("is-active");
    document.querySelector(`.portal-panel[data-panel="${btn.dataset.tab}"]`).hidden = false;
    if (isCaretaker() && btn.dataset.careCategory) {
      renderCareSessions(btn.dataset.careCategory);
    }
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
  scheduleDaysList.hidden = true;
  scheduleToggleBtn.textContent = "Editar horario";
  scheduleSummary.textContent = vetProfile?.schedule || "Sin definir";
  if (isVet()) {
    selectedServices = new Set(vetProfile?.services || []);
    renderServicesPicker();
  } else {
    currentGroomingServices = vetProfile?.services || [];
    renderGroomingServices();
  }
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
  if (isDemoSession) {
    const scheduleData = getScheduleData();
    const scheduleSummaryText = buildScheduleSummary(scheduleData);
    await persistVetProfile({
      whatsapp: clinicaFields.whatsapp.value.trim(),
      schedule: scheduleSummaryText,
      schedule_details: scheduleData,
      description: clinicaFields.description.value.trim(),
      services: isVet() ? Array.from(selectedServices) : currentGroomingServices,
      emergency: isVet() ? clinicaFields.emergency.checked : undefined,
    });
    scheduleSummary.textContent = scheduleSummaryText || "Sin definir";
    clinicaSuccess.hidden = false;
    dashboardGreeting.textContent = `Hola, ${clinicaFields.business_name.value.trim()}`;
    return;
  }
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
  const scheduleSummaryText = buildScheduleSummary(scheduleData);
  const patch = {
    id: session.user.id,
    whatsapp: clinicaFields.whatsapp.value.trim(),
    schedule: scheduleSummaryText,
    schedule_details: scheduleData,
    description: clinicaFields.description.value.trim(),
  };
  if (isVet()) {
    patch.services = Array.from(selectedServices);
    patch.emergency = clinicaFields.emergency.checked;
  } else {
    patch.services = currentGroomingServices;
  }
  await supabase.from(profileTable()).upsert(patch);
  scheduleSummary.textContent = scheduleSummaryText || "Sin definir";

  clinicaSuccess.hidden = false;
  dashboardGreeting.textContent = `Hola, ${clinicaFields.business_name.value.trim()}`;
});

function renderCalendar() {
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  calMonthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;

  const todayKey = toDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const aptCountByDate = new Map();
  const calendarAppointments = isStore() || isCaretaker()
    ? allAppointments
    : allAppointments.filter((appointment) => !["pending", "cancelled"].includes(appointment.status));
  calendarAppointments.forEach((a) => {
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
      btn.setAttribute(
        "aria-label",
        `${dayNum} de ${MONTH_NAMES[month]} de ${year}${count ? `, ${count} cita${count === 1 ? "" : "s"}` : ", sin citas"}`
      );
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
  renderSolicitudes();
  renderDashboard();
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
      if (!isDemoSession) await supabase.from("appointments").update({ status: "confirmed" }).eq("id", apt.id);
      apt.status = "confirmed";
      saveDemoAppointments();
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
    if (!isDemoSession) await supabase.from("appointments").update({ status: select.value }).eq("id", apt.id);
    apt.status = select.value;
    saveDemoAppointments();
    refreshCitasViews();
  });
  actions.appendChild(select);

  const rescheduleToggle = document.createElement("button");
  rescheduleToggle.type = "button";
  rescheduleToggle.className = "portal-reschedule-toggle";
  rescheduleToggle.textContent = apt.reschedule_status === "pending" ? "Proponer otra hora" : "Reprogramar";
  actions.appendChild(rescheduleToggle);

  card.appendChild(actions);

  // Banner de propuesta de reprogramación pendiente
  if (apt.reschedule_status === "pending") {
    const banner = document.createElement("div");
    banner.className = "portal-proposal-banner";
    if (apt.proposed_by === "client") {
      banner.innerHTML = `
        <span>🔄 El cliente propone: <strong>${apt.proposed_date || ""} ${apt.proposed_time || ""}</strong></span>
        <div class="portal-proposal-actions">
          <button type="button" class="portal-approve-btn portal-proposal-accept">Aceptar propuesta del cliente</button>
        </div>
      `;
      banner.querySelector(".portal-proposal-accept").addEventListener("click", async () => {
        const newDate = apt.proposed_date;
        const newTime = apt.proposed_time;
        if (!isDemoSession) {
          await supabase.from("appointments").update({
            date: newDate, time: newTime,
            proposed_date: null, proposed_time: null, proposed_by: null, reschedule_status: null,
          }).eq("id", apt.id);
        }
        apt.date = newDate;
        apt.time = newTime;
        apt.proposed_date = null;
        apt.proposed_time = null;
        apt.proposed_by = null;
        apt.reschedule_status = null;
        saveDemoAppointments();
        refreshCitasViews();
      });
    } else {
      banner.innerHTML = `<span>⏳ Esperando que el cliente confirme: <strong>${apt.proposed_date || ""} ${apt.proposed_time || ""}</strong></span>`;
    }
    card.appendChild(banner);
  }

  const rescheduleForm = document.createElement("div");
  rescheduleForm.className = "portal-reschedule-form";
  rescheduleForm.hidden = true;
  rescheduleForm.innerHTML = `
    <input type="date" class="reschedule-date" value="${apt.proposed_date || apt.date || ""}" />
    <input type="text" class="reschedule-time" value="${apt.proposed_time || apt.time || ""}" placeholder="Hora, ej. 10:00 AM" />
    <button type="button" class="portal-reschedule-save">Enviar propuesta</button>
  `;
  rescheduleToggle.addEventListener("click", () => {
    rescheduleForm.hidden = !rescheduleForm.hidden;
  });
  rescheduleForm.querySelector(".portal-reschedule-save").addEventListener("click", async () => {
    const newDate = rescheduleForm.querySelector(".reschedule-date").value;
    const newTime = rescheduleForm.querySelector(".reschedule-time").value.trim();
    if (!newDate || !newTime) return;
    if (!isDemoSession) {
      await supabase.from("appointments").update({
        proposed_date: newDate, proposed_time: newTime, proposed_by: "vet", reschedule_status: "pending",
      }).eq("id", apt.id);
    }
    apt.proposed_date = newDate;
    apt.proposed_time = newTime;
    apt.proposed_by = "vet";
    apt.reschedule_status = "pending";
    saveDemoAppointments();

    if (!isDemoSession && apt.user_id) {
      const providerWord = providerMeta().label.toLowerCase();
      await supabase.from("notifications").insert({
        user_id: apt.user_id,
        type: "reschedule_proposed",
        title: "🔄 Te proponen una nueva fecha",
        body: `Tu ${providerWord} propone mover la cita de ${apt.pet_name || "tu mascota"} en ${apt.vet_name || "el negocio"} a ${newDate} a las ${newTime}. Ingresa a la app para aceptar, rechazar o proponer otra hora.`,
        appointment_id: apt.id,
      });
    }

    refreshCitasViews();
  });
  card.appendChild(rescheduleForm);

  return card;
}

function buildRequestCard(apt) {
  const card = document.createElement("article");
  card.className = "portal-request-card";
  const hasProposal = apt.reschedule_status === "pending";
  const requestStatus = hasProposal ? "Cambio propuesto" : "Pendiente";
  card.innerHTML = `
    <div class="portal-request-pet">
      <img src="${apt.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <div>
        <span class="portal-request-status">${requestStatus}</span>
        <h3>${apt.pet_name || "Mascota"} <small>· ${apt.pet_breed || ""}</small></h3>
        <p>${apt.owner_name || "Responsable no registrado"}${apt.owner_phone ? ` · ${apt.owner_phone}` : ""}</p>
      </div>
    </div>
    <div class="portal-request-details">
      <div><span>Servicio solicitado</span><strong>${apt.service || "Consulta"}</strong></div>
      <div><span>Fecha y hora</span><strong>${apt.date || "Por definir"} · ${apt.time || "Por definir"}</strong></div>
      <div><span>Nota del responsable</span><strong>${apt.request_note || "Sin observaciones adicionales"}</strong></div>
    </div>
    ${hasProposal ? `<div class="portal-proposal-banner"><span>⏳ Propuesta enviada: <strong>${apt.proposed_date || ""} ${apt.proposed_time || ""}</strong></span></div>` : ""}
    <div class="portal-request-actions">
      <button type="button" class="portal-approve-btn request-confirm">Confirmar cita</button>
      <button type="button" class="portal-reschedule-toggle request-propose">Proponer horario</button>
      <button type="button" class="portal-request-reject request-reject-toggle">No aceptar</button>
    </div>
    <div class="portal-reschedule-form request-proposal-form" hidden>
      <input type="date" class="request-date" value="${apt.proposed_date || apt.date || ""}" />
      <input type="text" class="request-time" value="${apt.proposed_time || apt.time || ""}" placeholder="Hora, ej. 10:00 AM" />
      <button type="button" class="portal-reschedule-save request-proposal-save">Enviar propuesta</button>
    </div>
    <div class="portal-request-reject-form" hidden>
      <select class="request-reject-reason" aria-label="Motivo para no aceptar">
        <option value="">Selecciona un motivo</option>
        <option value="Sin disponibilidad">Sin disponibilidad</option>
        <option value="Servicio no disponible">Servicio no disponible</option>
        <option value="Se requiere otra especialidad">Se requiere otra especialidad</option>
        <option value="Información incompleta">Información incompleta</option>
      </select>
      <button type="button" class="request-reject-save">Confirmar</button>
    </div>
  `;

  card.querySelector(".request-confirm").addEventListener("click", async () => {
    if (!isDemoSession) {
      await supabase.from("appointments").update({ status: "confirmed", reschedule_status: null }).eq("id", apt.id);
    }
    apt.status = "confirmed";
    apt.reschedule_status = null;
    saveDemoAppointments();
    refreshCitasViews();
  });

  const proposalForm = card.querySelector(".request-proposal-form");
  card.querySelector(".request-propose").addEventListener("click", () => {
    proposalForm.hidden = !proposalForm.hidden;
  });
  card.querySelector(".request-proposal-save").addEventListener("click", async () => {
    const proposedDate = card.querySelector(".request-date").value;
    const proposedTime = card.querySelector(".request-time").value.trim();
    if (!proposedDate || !proposedTime) return;
    if (!isDemoSession) {
      await supabase.from("appointments").update({
        proposed_date: proposedDate,
        proposed_time: proposedTime,
        proposed_by: "vet",
        reschedule_status: "pending",
      }).eq("id", apt.id);
    }
    Object.assign(apt, {
      proposed_date: proposedDate,
      proposed_time: proposedTime,
      proposed_by: "vet",
      reschedule_status: "pending",
    });
    saveDemoAppointments();
    refreshCitasViews();
  });

  const rejectForm = card.querySelector(".portal-request-reject-form");
  card.querySelector(".request-reject-toggle").addEventListener("click", () => {
    rejectForm.hidden = !rejectForm.hidden;
  });
  card.querySelector(".request-reject-save").addEventListener("click", async () => {
    const reason = card.querySelector(".request-reject-reason").value;
    if (!reason) return;
    if (!isDemoSession) {
      await supabase.from("appointments").update({ status: "cancelled" }).eq("id", apt.id);
    }
    apt.status = "cancelled";
    apt.rejection_reason = reason;
    saveDemoAppointments();
    refreshCitasViews();
  });

  return card;
}

function renderSolicitudes() {
  if (!solicitudesList || isStore() || isCaretaker()) return;
  const pending = allAppointments.filter((appointment) => appointment.status === "pending");
  const proposed = allAppointments.filter((appointment) => appointment.reschedule_status === "pending");
  const filter = solicitudesFilter.value;
  const requests = filter === "pending"
    ? pending
    : filter === "reschedule"
      ? proposed
      : Array.from(new Map([...pending, ...proposed].map((appointment) => [appointment.id, appointment])).values());
  solicitudesList.innerHTML = "";
  solicitudesEmpty.hidden = requests.length > 0;
  requests.forEach((appointment) => solicitudesList.appendChild(buildRequestCard(appointment)));
  const count = new Set([...pending, ...proposed].map((appointment) => appointment.id)).size;
  solicitudesTabCount.textContent = String(count);
  solicitudesTabCount.hidden = count === 0;
}

solicitudesFilter.addEventListener("change", renderSolicitudes);

function renderCitas(appointments) {
  citasList.innerHTML = "";
  const visibleAppointments = isStore() || isCaretaker()
    ? appointments
    : appointments.filter((appointment) => !["pending", "cancelled"].includes(appointment.status));
  citasEmpty.hidden = visibleAppointments.length > 0;
  visibleAppointments.forEach((apt) => citasList.appendChild(buildAppointmentCard(apt)));
}

function renderPendingCitas() {
  const pending = allAppointments.filter((a) => a.status === "pending");
  citasPendingSection.hidden = true;
  citasPendingList.innerHTML = "";
  if (isStore() || isCaretaker()) {
    citasPendingSection.hidden = pending.length === 0;
    pending.forEach((apt) => citasPendingList.appendChild(buildAppointmentCard(apt)));
  }
  renderSolicitudes();
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatStoreDate(order) {
  const label = order.date
    ? new Date(`${order.date}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
    : "";
  return [label, order.time].filter(Boolean).join(" · ");
}

function updateDemoOrderStatus(orderId, status) {
  storeOrders = storeOrders.map((order) => (order.id === orderId ? { ...order, status } : order));
  renderStoreOrders(storeOrders);
  renderDashboard();
}

function buildStoreOrderCard(order) {
  const card = document.createElement("article");
  card.className = "portal-store-order-card";
  const products = (order.products || [])
    .map((item) => `<li><strong>${item.quantity || 1}x</strong> ${item.name || "Producto"} <span>${formatMoney(item.price)}</span></li>`)
    .join("");

  let actions = "";
  if (order.status === "pending") {
    actions = `
      <button type="button" data-order-action="confirmed">Confirmar</button>
      <button type="button" data-order-action="cancelled" class="is-ghost">Cancelar</button>
    `;
  } else if (order.status === "confirmed") {
    actions = `<button type="button" data-order-action="shipped">Marcar enviado</button>`;
  } else if (order.status === "shipped") {
    actions = `<button type="button" data-order-action="delivered">Marcar entregado</button>`;
  }

  card.innerHTML = `
    <div class="portal-store-order-main">
      <div class="portal-store-order-head">
        <div>
          <strong>${order.customerName || "Cliente"}</strong>
          <span>${order.phone || ""}</span>
        </div>
        <span class="portal-store-status is-${order.status || "pending"}">${STORE_STATUS_LABELS[order.status] || order.status}</span>
      </div>
      <ul>${products}</ul>
      <div class="portal-store-order-foot">
        <span>${order.address || ""}</span>
        <span>${formatStoreDate(order)}</span>
      </div>
    </div>
    <div class="portal-store-order-side">
      <strong>${formatMoney(order.total)}</strong>
      <div class="portal-store-actions">${actions}</div>
    </div>
  `;

  card.querySelectorAll("[data-order-action]").forEach((btn) => {
    btn.addEventListener("click", () => updateDemoOrderStatus(order.id, btn.dataset.orderAction));
  });

  return card;
}

function renderStoreOrders(orders = storeOrders) {
  citasPendingSection.hidden = true;
  citasList.innerHTML = "";
  citasEmpty.hidden = orders.length > 0;
  orders.forEach((order) => citasList.appendChild(buildStoreOrderCard(order)));
}

function buildStoreProductCard(product) {
  const card = document.createElement("article");
  card.className = "portal-store-product-card";
  const lowStock = Number(product.stock || 0) <= 10;
  card.innerHTML = `
    <img src="${product.image_url || "../assets/icon-food-tight.png"}" alt="" onerror="this.src='../assets/icon-food-tight.png'" />
    <div class="portal-store-product-body">
      <div class="portal-store-product-top">
        <span>${STORE_CATEGORY_LABELS[product.category] || product.category || "Producto"}</span>
        <span class="${lowStock ? "is-low-stock" : ""}">${product.stock || 0} und.</span>
      </div>
      <strong>${product.name || "Producto"}</strong>
      <p>${product.brand || ""} · ${product.species || ""}</p>
      <div class="portal-store-product-bottom">
        <b>${formatMoney(product.price)}</b>
        <span>${product.sold || 0} vendidos</span>
      </div>
    </div>
  `;
  return card;
}

function renderStoreProducts(products = storeProducts) {
  allPatients = [];
  pacientesList.innerHTML = "";
  pacientesEmpty.hidden = products.length > 0;
  pacientesNoResults.hidden = products.length > 0 || storeProducts.length === 0;
  pacientesList.classList.remove("portal-care-client-grid");
  pacientesList.classList.add("portal-store-products-grid");
  products.forEach((product) => pacientesList.appendChild(buildStoreProductCard(product)));
}

function renderStoreDashboard() {
  const pending = storeOrders.filter((order) => order.status === "pending").length;
  const lowStock = storeProducts.filter((product) => Number(product.stock || 0) <= 10).length;
  statToday.textContent = storeOrders.length;
  statPending.textContent = pending;
  statPatients.textContent = storeProducts.length;
  statMonth.textContent = lowStock;
  todayDateLabel.textContent = "Pedidos, inventario y ventas de la tienda";

  todayList.innerHTML = "";
  todayEmpty.hidden = storeOrders.length > 0;
  storeOrders.slice(0, 3).forEach((order) => todayList.appendChild(buildStoreOrderCard(order)));

  const strip = document.createElement("section");
  strip.className = "portal-store-strip";
  strip.innerHTML = `
    <div>
      <span>Plan Tienda</span>
      <strong>Período de prueba activo</strong>
    </div>
    <div>
      <span>Productos más vendidos</span>
      <strong>${storeProducts.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0))[0]?.name || "Sin productos"}</strong>
    </div>
    <div>
      <span>Ventas registradas</span>
      <strong>${formatMoney(storeOrders.reduce((sum, order) => sum + Number(order.total || 0), 0))}</strong>
    </div>
  `;
  todayList.appendChild(strip);
}

function updateCareSessionStatus(sessionId, status) {
  careSessions = careSessions.map((session) => (session.id === sessionId ? { ...session, status } : session));
  renderCareSessions(activeCareCategory);
  renderDashboard();
}

function buildCareSessionCard(session) {
  const card = document.createElement("article");
  const category = CARE_CATEGORIES[careCategoryForService(session.service)];
  card.className = "portal-care-session-card";
  const actions = {
    pending: [
      { next: "confirmed", label: "Confirmar" },
      { next: "cancelled", label: "Cancelar", ghost: true },
    ],
    confirmed: [{ next: "in_progress", label: "Iniciar" }],
    in_progress: [{ next: "completed", label: "Completar" }],
  }[session.status] || [];

  card.innerHTML = `
    <div class="portal-care-stripe" style="background:${category.color}"></div>
    <img src="${session.petImage || ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div class="portal-care-session-body">
      <div class="portal-care-session-head">
        <div>
          <strong>${session.petName} <span>· ${session.petBreed}</span></strong>
          <p>${session.ownerName} · ${session.ownerPhone}</p>
        </div>
        <span class="portal-care-status is-${session.status}">${CARE_STATUS_LABELS[session.status] || session.status}</span>
      </div>
      <p class="portal-care-service">${session.service} · ${session.duration}</p>
      <p class="portal-care-muted">${session.address}</p>
      <div class="portal-care-session-foot">
        <span>${session.date} · ${session.time}</span>
        <strong>${formatMoney(session.price)}</strong>
      </div>
      ${session.notes ? `<div class="portal-care-note">${session.notes}</div>` : ""}
      <div class="portal-care-actions">
        ${actions.map((action) => `<button type="button" class="${action.ghost ? "is-ghost" : ""}" data-care-status="${action.next}">${action.label}</button>`).join("")}
      </div>
    </div>
  `;

  card.querySelectorAll("[data-care-status]").forEach((btn) => {
    btn.addEventListener("click", () => updateCareSessionStatus(session.id, btn.dataset.careStatus));
  });

  return card;
}

function renderCareSessions(category = activeCareCategory) {
  activeCareCategory = category;
  const categoryMeta = CARE_CATEGORIES[category] || CARE_CATEGORIES.paseo;
  citasPanelTitle.textContent = categoryMeta.label;
  citasPanelSubtitle.textContent = `Sesiones de ${categoryMeta.label.toLowerCase()} con estado, horario, cliente y valor.`;
  citasPendingSection.hidden = true;
  citasList.innerHTML = "";
  const sessions = careSessions.filter((session) => careCategoryForService(session.service) === category);
  citasEmpty.hidden = sessions.length > 0;
  sessions.forEach((session) => citasList.appendChild(buildCareSessionCard(session)));
}

function buildCareClientCard(client) {
  const card = document.createElement("article");
  card.className = "portal-care-client-card";
  card.innerHTML = `
    <img src="${client.petImage || ""}" alt="" onerror="this.style.visibility='hidden'" />
    <div>
      <strong>${client.petName}</strong>
      <p>${client.petSpecies} · ${client.petBreed}</p>
      <p>${client.ownerName} · ${client.ownerPhone}</p>
      <p class="portal-care-muted">${client.address}</p>
      ${client.notes ? `<div class="portal-care-note">${client.notes}</div>` : ""}
      <div class="portal-care-client-badges">
        <span>${client.totalSessions} sesiones</span>
        ${client.nextSession ? `<span>Próxima: ${client.nextSession}</span>` : ""}
      </div>
      <small>Última sesión: ${client.lastSession}</small>
    </div>
  `;
  return card;
}

function renderCareClients(clients = careClients) {
  allPatients = [];
  pacientesList.innerHTML = "";
  pacientesList.classList.remove("portal-store-products-grid");
  pacientesList.classList.add("portal-care-client-grid");
  pacientesEmpty.hidden = clients.length > 0;
  pacientesNoResults.hidden = clients.length > 0 || careClients.length === 0;
  clients.forEach((client) => pacientesList.appendChild(buildCareClientCard(client)));
}

function renderCareProfile() {
  const profile = CARE_PROFILE;
  clinicaPanelTitle.textContent = "Perfil";
  const panel = document.querySelector('[data-panel="clinica"] .portal-clinica-layout');
  if (!panel) return;
  panel.innerHTML = `
    <section class="portal-care-profile-cover">
      <img src="${profile.avatar}" alt="" />
      <h3>${profile.name}</h3>
      <p>★ ${profile.rating} (${profile.reviewCount} reseñas)</p>
    </section>
    <section class="portal-care-profile-stats">
      <div><strong>${profile.totalSessions}</strong><span>Sesiones</span></div>
      <div><strong>${profile.activeClients}</strong><span>Clientes</span></div>
      <div><strong>${profile.monthlyRevenue}</strong><span>Este mes</span></div>
    </section>
    <section class="portal-side-block">
      <h3>Sobre mí</h3>
      <p class="portal-muted">${profile.bio}</p>
    </section>
    <section class="portal-side-block">
      <h3>Servicios</h3>
      <div class="portal-care-tags">${profile.services.map((service) => `<span>${service}</span>`).join("")}</div>
    </section>
    <section class="portal-side-block">
      <h3>Certificaciones</h3>
      ${profile.certifications.map((cert) => `<p class="portal-care-muted">🎖 ${cert}</p>`).join("")}
    </section>
    <section class="portal-side-block">
      <h3>Contacto</h3>
      <p class="portal-care-muted">${profile.address}</p>
      <p class="portal-care-muted">${profile.phone}</p>
      <p class="portal-care-muted">${profile.email}</p>
    </section>
  `;
}

function renderCareDashboard() {
  const now = new Date();
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const todays = careSessions.filter((session) => session.date === todayKey);
  const upcoming = todays.filter((session) => session.status === "pending" || session.status === "confirmed").length;
  const revenue = todays.reduce((sum, session) => sum + Number(session.price || 0), 0);

  statToday.textContent = todays.length;
  statPending.textContent = upcoming;
  statPatients.textContent = careClients.length;
  statMonth.textContent = formatMoney(revenue).replace(/\s?COP/, "");
  todayDateLabel.textContent = "Paseos, guarderías y escuelas organizados por categoría";

  todayList.innerHTML = "";
  todayEmpty.hidden = false;
  todayEmpty.hidden = true;

  Object.entries(CARE_CATEGORIES).forEach(([category, meta]) => {
    const sessions = todays.filter((session) => careCategoryForService(session.service) === category);
    const next = sessions.find((session) => ["pending", "confirmed", "in_progress"].includes(session.status));
    const card = document.createElement("button");
    card.type = "button";
    card.className = "portal-care-category-card";
    card.style.setProperty("--care-color", meta.color);
    card.style.setProperty("--care-bg", meta.bg);
    card.innerHTML = `
      <span>${meta.label}</span>
      <strong>${sessions.length}</strong>
      <p>${sessions.length === 0 ? "Sin sesiones hoy" : `${sessions.length} ${sessions.length === 1 ? "sesión" : "sesiones"} hoy${next ? ` · próxima ${next.time}` : ""}`}</p>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".portal-tab").forEach((b) => b.classList.remove("is-active"));
      document.querySelectorAll(".portal-panel").forEach((p) => (p.hidden = true));
      document.querySelector(`.portal-panel[data-panel="citas"]`).hidden = false;
      const tab = document.querySelector(`.portal-tab[data-care-category="${category}"]`);
      if (tab) tab.classList.add("is-active");
      renderCareSessions(category);
    });
    todayList.appendChild(card);
  });
}

let allPatients = [];

function renderPacientes(appointments, linkedRecords = []) {
  const byPet = new Map();
  const patientAppointments = isStore() || isCaretaker()
    ? appointments
    : appointments.filter((appointment) => !["pending", "cancelled"].includes(appointment.status));
  patientAppointments.forEach((apt) => {
    const key = apt.pet_id || apt.pet_name;
    if (!key) return;
    if (!byPet.has(key)) {
      byPet.set(key, { ...apt, visits: 0 });
    }
    byPet.get(key).visits += 1;
  });

  // Pacientes vinculados por código que todavía no tienen ninguna cita
  linkedRecords.forEach((rec) => {
    if (!byPet.has(rec.pet_key)) {
      byPet.set(rec.pet_key, {
        pet_id: rec.pet_key,
        pet_name: rec.pet_name || "Mascota",
        pet_breed: rec.breed || "",
        pet_image: rec.pet_image_url || "",
        visits: 0,
      });
    }
  });

  allPatients = Array.from(byPet.values());
  pacientesEmpty.hidden = allPatients.length > 0;
  renderPatientCards(allPatients);
}

function renderPatientCards(patients) {
  pacientesList.innerHTML = "";
  pacientesList.classList.remove("portal-store-products-grid");
  pacientesList.classList.remove("portal-care-client-grid");
  pacientesNoResults.hidden = patients.length > 0 || allPatients.length === 0;

  patients.forEach((p) => {
    const card = document.createElement("div");
    card.className = "portal-patient-card";
    card.innerHTML = `
      <img src="${p.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
      <strong>${p.pet_name || "Mascota"}</strong>
      <span>${p.pet_breed || ""}</span>
      <span>${p.owner_name ? `Responsable: ${p.owner_name}` : "Responsable sin registrar"}</span>
      <span>${p.visits} cita${p.visits > 1 ? "s" : ""}</span>
    `;
    card.addEventListener("click", () => showPatientDetail(p.pet_id || p.pet_name, p));
    pacientesList.appendChild(card);
  });
}

pacientesSearch.addEventListener("input", () => {
  const q = pacientesSearch.value.trim().toLowerCase();
  if (isStore()) {
    if (!q) {
      renderStoreProducts(storeProducts);
      return;
    }
    const filtered = storeProducts.filter((product) =>
      [product.name, product.brand, STORE_CATEGORY_LABELS[product.category], product.species]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
    renderStoreProducts(filtered);
    return;
  }
  if (isCaretaker()) {
    if (!q) {
      renderCareClients(careClients);
      return;
    }
    const filtered = careClients.filter((client) =>
      [client.petName, client.petBreed, client.petSpecies, client.ownerName, client.ownerPhone, client.address]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
    renderCareClients(filtered);
    return;
  }
  if (!q) {
    renderPatientCards(allPatients);
    return;
  }
  const filtered = allPatients.filter(
    (p) => [p.pet_name, p.pet_breed, p.owner_name, p.owner_phone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
  renderPatientCards(filtered);
});

const linkCodeToggle = document.getElementById("link-code-toggle");
const linkCodeForm = document.getElementById("link-code-form");
const linkCodeInput = document.getElementById("link-code-input");
const linkCodeSubmit = document.getElementById("link-code-submit");
const linkCodeError = document.getElementById("link-code-error");

linkCodeToggle.addEventListener("click", () => {
  if (!supportsMedicalRecords()) return;
  linkCodeForm.hidden = !linkCodeForm.hidden;
  linkCodeError.hidden = true;
});

linkCodeSubmit.addEventListener("click", async () => {
  if (!supportsMedicalRecords()) return;
  const code = linkCodeInput.value.trim();
  linkCodeError.hidden = true;
  if (!code) return;

  linkCodeSubmit.disabled = true;
  linkCodeSubmit.textContent = "Vinculando...";

  const { data: match, error: matchErr } = await supabase
    .from("pet_link_codes")
    .select("*")
    .eq("code", code)
    .is("used_by_vet_id", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (matchErr || !match) {
    linkCodeError.textContent = "Código inválido o expirado.";
    linkCodeError.hidden = false;
    linkCodeSubmit.disabled = false;
    linkCodeSubmit.textContent = "Vincular";
    return;
  }

  const { error: claimErr } = await supabase
    .from("pet_link_codes")
    .update({ used_by_vet_id: currentVetId, used_at: new Date().toISOString() })
    .eq("id", match.id);

  if (claimErr) {
    linkCodeError.textContent = "No se pudo reclamar el código. Intenta de nuevo.";
    linkCodeError.hidden = false;
    linkCodeSubmit.disabled = false;
    linkCodeSubmit.textContent = "Vincular";
    return;
  }

  const { data: pet, error: petErr } = await supabase
    .from("user_pets")
    .select("*")
    .eq("id", match.pet_id)
    .single();

  if (petErr || !pet) {
    linkCodeError.textContent = "No se pudo leer la ficha de la mascota.";
    linkCodeError.hidden = false;
    linkCodeSubmit.disabled = false;
    linkCodeSubmit.textContent = "Vincular";
    return;
  }

  await supabase.from("patient_records").upsert(
    {
      vet_id: currentVetId,
      pet_key: pet.id,
      pet_name: pet.name,
      pet_image_url: pet.image_url,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      born: pet.born,
      weight: pet.weight,
      color: pet.color,
      chip: pet.chip,
      blood_type: pet.blood_type,
      allergies: pet.allergies || [],
      sterilized: pet.sterilized,
      dewormed: pet.dewormed,
    },
    { onConflict: "vet_id,pet_key" }
  );

  await refetchLinkedPatientRecords();
  renderPacientes(allAppointments, linkedPatientRecords);

  linkCodeInput.value = "";
  linkCodeForm.hidden = true;
  linkCodeSubmit.disabled = false;
  linkCodeSubmit.textContent = "Vincular";
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
    <div class="portal-rx-row-top">
      <input type="text" placeholder="Medicamento" class="rx-name" />
      <input type="text" placeholder="Dosis" class="rx-dose" />
      <input type="text" placeholder="Frecuencia" class="rx-frequency" />
      <input type="text" placeholder="Duración" class="rx-duration" />
      <button type="button" class="portal-rx-remove-line" aria-label="Quitar">✕</button>
    </div>
    <input type="text" placeholder="Indicaciones (ej. con comida, aplicar en la mañana...)" class="rx-instructions" />
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
      <div class="med">
        <div class="med-name">${m.name || ""}${m.dose ? ` — ${m.dose}` : ""}</div>
        <div class="med-detail">${[m.frequency, m.duration].filter(Boolean).join(" · ")}</div>
        ${m.instructions ? `<div class="med-instructions">${m.instructions}</div>` : ""}
      </div>`
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
        @page { size: 5.5in 8.5in; margin: 0; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        html, body { margin: 0; }
        body {
          font-family: -apple-system, Arial, sans-serif;
          color: #1c1330;
          width: 5.5in;
          max-width: 100%;
          margin: 0 auto;
        }
        .content { padding: 24px; }
        .header-band {
          background: linear-gradient(135deg, #6d38ee, #9c56ff);
          color: #fff;
          padding: 22px 24px;
        }
        .header-band h1 { margin: 0 0 2px; font-size: 18px; }
        .header-band p { margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.85); }
        .row { display: flex; justify-content: space-between; margin: 18px 0 16px; font-size: 12px; gap: 8px; flex-wrap: wrap; }
        .row strong { color: #6d38ee; }
        .section-label {
          font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;
          color: #6d38ee; margin: 18px 0 8px; padding-bottom: 5px; border-bottom: 2px solid #6d38ee;
          display: inline-block;
        }
        .med {
          padding: 8px 10px; margin-bottom: 6px; font-size: 13px;
          background: #f5f1fd; border-left: 3px solid #6d38ee; border-radius: 0 8px 8px 0;
        }
        .med-name { font-weight: 700; color: #1c1330; }
        .med-detail { color: #6c6480; font-size: 11px; margin-top: 1px; }
        .med-instructions { font-style: italic; font-size: 11px; margin-top: 2px; color: #6d38ee; }
        .free-text-box {
          font-size: 12px; white-space: pre-wrap; background: #f5f1fd;
          border-radius: 8px; padding: 10px 12px; border-left: 3px solid #9c56ff;
        }
        .sign { margin-top: 50px; }
        .sign-line { border-top: 2px solid #6d38ee; width: 220px; padding-top: 6px; font-size: 11px; color: #6c6480; }
        .print-bar { padding: 16px 24px 0; }
        .print-bar button {
          background: linear-gradient(135deg, #6d38ee, #9c56ff); border: none; color: #fff;
          font-weight: 700; font-size: 13px; padding: 8px 18px; border-radius: 999px; cursor: pointer;
        }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="print-bar no-print">
        <button onclick="window.print()">🖨️ Imprimir</button>
      </div>
      <div class="header-band">
        <h1>${currentProfile?.business_name || currentProfile?.name || ""}</h1>
        <p>${currentProfile?.address || ""}${currentProfile?.phone ? " · " + currentProfile.phone : ""}</p>
      </div>
      <div class="content">
        <div class="row">
          <span><strong>Paciente:</strong> ${apt.pet_name || ""} (${apt.pet_breed || ""})</span>
          <span><strong>Fecha:</strong> ${date}</span>
        </div>

        <div class="section-label">Medicamentos</div>
        ${meds}

        ${rx.notes ? `<div class="section-label">Exámenes solicitados</div><div class="free-text-box">${rx.notes}</div>` : ""}
        ${rx.recommendations ? `<div class="section-label">Recomendaciones</div><div class="free-text-box">${rx.recommendations}</div>` : ""}

        <div class="sign">
          <div class="sign-line">Firma del veterinario</div>
        </div>
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
    card.className = "portal-rx-group";
    const meds = (rx.medications || [])
      .map(
        (m) => `
        <div class="portal-vaccine-card">
          <span class="portal-vaccine-icon">💊</span>
          <div class="portal-vaccine-body">
            <strong>${m.name || ""}${m.dose ? ` — ${m.dose}` : ""}</strong>
            <span>${[m.frequency, m.instructions].filter(Boolean).join(" · ")}</span>
          </div>
          ${m.duration ? `<span class="portal-vaccine-due" style="--due-color:#7c3aed">${m.duration}</span>` : ""}
        </div>`
      )
      .join("");
    const date = rx.created_at ? new Date(rx.created_at).toLocaleDateString("es-CO") : "";
    const notesHtml = rx.notes ? `<p class="portal-rx-extra">🧪 ${rx.notes}</p>` : "";
    const recommendationsHtml = rx.recommendations ? `<p class="portal-rx-extra">📋 ${rx.recommendations}</p>` : "";
    card.innerHTML = `<span class="portal-rx-date">${date}</span>${meds}${notesHtml}${recommendationsHtml}`;

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
  notesInput.placeholder = "Exámenes solicitados (opcional)";
  form.appendChild(notesInput);

  const recommendationsInput = document.createElement("textarea");
  recommendationsInput.className = "rx-notes";
  recommendationsInput.rows = 2;
  recommendationsInput.placeholder = "Recomendaciones (reposo, dieta, cuidados en casa...)";
  form.appendChild(recommendationsInput);

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

    let inserted = null;
    if (isDemoSession) {
      inserted = {
        id: `demo_rx_${Date.now()}`,
        appointment_id: apt.id,
        vet_id: currentVetId,
        medications,
        notes: notesInput.value.trim() || null,
        recommendations: recommendationsInput.value.trim() || null,
        created_at: new Date().toISOString(),
      };
    } else {
      const result = await supabase
        .from("prescriptions")
        .insert({
          appointment_id: apt.id,
          vet_id: currentVetId,
          medications,
          notes: notesInput.value.trim() || null,
          recommendations: recommendationsInput.value.trim() || null,
        })
        .select()
        .single();
      inserted = result.data;
    }

    if (inserted) {
      rxState.unshift(inserted);
      renderRxList(listEl, rxState, apt);
      rows.innerHTML = "";
      createMedicationRow(rows);
      notesInput.value = "";
      recommendationsInput.value = "";
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
      if (exam.local_url) {
        window.open(exam.local_url, "_blank");
        return;
      }
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

    if (isDemoSession) {
      examState.unshift({
        id: `demo_exam_${Date.now()}`,
        appointment_id: apt.id,
        vet_id: currentVetId,
        file_name: file.name,
        mime_type: file.type,
        local_url: URL.createObjectURL(file),
      });
      renderExamList(listEl, examState);
    } else {
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

function vaccineDueStatus(nextDueDate) {
  if (!nextDueDate) return null;
  const today = new Date().toISOString().split("T")[0];
  const daysUntil = (new Date(nextDueDate) - new Date(today)) / 86400000;
  if (daysUntil < 0) return { label: `Vencida · ${nextDueDate}`, color: "#e11d48" };
  if (daysUntil <= 30) return { label: `Próxima: ${nextDueDate}`, color: "#f59e0b" };
  return { label: `Próxima: ${nextDueDate}`, color: "#16a34a" };
}

function renderVaccineList(container, vaccines) {
  container.innerHTML = "";
  if (vaccines.length === 0) {
    container.innerHTML = `<div class="portal-empty">Aún no hay vacunas registradas.</div>`;
    return;
  }
  vaccines
    .slice()
    .sort((a, b) => (a.date_given < b.date_given ? 1 : -1))
    .forEach((v) => {
      const item = document.createElement("div");
      item.className = "portal-vaccine-card";
      const due = vaccineDueStatus(v.next_due_date);
      item.innerHTML = `
        <span class="portal-vaccine-icon">💉</span>
        <div class="portal-vaccine-body">
          <strong>${v.vaccine_name || ""}</strong>
          <span>${v.date_given ? `Aplicada: ${v.date_given}` : ""}${v.notes ? ` · ${v.notes}` : ""}</span>
        </div>
        ${due ? `<span class="portal-vaccine-due" style="--due-color:${due.color}">${due.label}</span>` : ""}
      `;
      container.appendChild(item);
    });
}

async function showPatientDetail(key, petInfo) {
  const visits = allAppointments
    .filter((a) => (a.pet_id || a.pet_name) === key && !["pending", "cancelled"].includes(a.status))
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const visitIds = visits.map((v) => v.id);
  let rxData = [];
  let examData = [];
  let recordData = null;
  if (isDemoSession) {
    recordData = loadDemoPatientRecords()[key] || {};
  } else {
    const [rxResult, examResult, recordResult] = await Promise.all([
      supabase.from("prescriptions").select("*").in("appointment_id", visitIds).order("created_at", { ascending: false }),
      supabase.from("medical_exams").select("*").in("appointment_id", visitIds).order("uploaded_at", { ascending: false }),
      supabase.from("patient_records").select("*").eq("vet_id", currentVetId).eq("pet_key", key).maybeSingle(),
    ]);
    rxData = rxResult.data || [];
    examData = examResult.data || [];
    recordData = recordResult.data || {};
  }
  const rxByApt = groupBy(rxData || [], "appointment_id");
  const examByApt = groupBy(examData || [], "appointment_id");
  const record = recordData || {};
  let vaccines = record.vaccines || [];

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

    <div class="portal-side-block" style="margin-bottom: 24px">
      <nav class="portal-subtabs">
        <button type="button" class="portal-subtab is-active" data-subtab="carnet">Carnet de la mascota</button>
        ${isVet() ? '<button type="button" class="portal-subtab" data-subtab="vacunas">Carnet de vacunas</button>' : ""}
        <button type="button" class="portal-subtab" data-subtab="datos">Datos del paciente</button>
      </nav>

      <div class="portal-subpanel" data-subpanel="carnet">
        <div class="portal-id-card" id="pet-id-card"></div>
      </div>

      <div class="portal-subpanel" data-subpanel="vacunas" hidden>
        <div class="portal-side-block-head">
          <h3>Carnet de vacunas</h3>
          <button type="button" class="portal-visit-toggle" id="vaccine-add-toggle">+ Agregar vacuna</button>
        </div>
        <div id="vaccine-list" class="portal-rx-list"></div>
        <div id="vaccine-form" class="portal-rx-form" hidden>
          <div class="portal-field-row">
            <label class="portal-field"><span>Vacuna</span><input type="text" id="vaccine-name" placeholder="Ej. Rabia" /></label>
            <label class="portal-field"><span>Fecha aplicada</span><input type="date" id="vaccine-date-given" /></label>
          </div>
          <div class="portal-field-row">
            <label class="portal-field"><span>Próxima dosis</span><input type="date" id="vaccine-next-due" /></label>
            <label class="portal-field"><span>Notas</span><input type="text" id="vaccine-notes" placeholder="Opcional" /></label>
          </div>
          <button type="button" class="portal-rx-save" id="vaccine-save-btn">Guardar vacuna</button>
        </div>
      </div>

      <div class="portal-subpanel" data-subpanel="datos" hidden>
        <div class="portal-field-row">
          <label class="portal-field"><span>Especie</span><input type="text" id="record-species" placeholder="Perro, gato..." /></label>
          <label class="portal-field"><span>Raza</span><input type="text" id="record-breed" /></label>
        </div>
        <div class="portal-field-row">
          <label class="portal-field">
            <span>Sexo</span>
            <select id="record-gender">
              <option value="">Sin definir</option>
              <option value="male">Macho</option>
              <option value="female">Hembra</option>
            </select>
          </label>
          <label class="portal-field"><span>Fecha de nacimiento</span><input type="date" id="record-born" /></label>
        </div>
        <div class="portal-field-row">
          <label class="portal-field"><span>Color</span><input type="text" id="record-color" /></label>
          <label class="portal-field"><span>Peso de referencia</span><input type="text" id="record-weight" placeholder="ej. 12 kg" /></label>
        </div>
        <div class="portal-field-row">
          <label class="portal-field"><span>Chip</span><input type="text" id="record-chip" /></label>
          <label class="portal-field"><span>Tipo de sangre</span><input type="text" id="record-blood-type" /></label>
        </div>
        <label class="portal-field"><span>Alergias (separadas por coma)</span><input type="text" id="record-allergies" /></label>
        <label class="portal-field"><span>Notas generales</span><textarea id="record-notes" rows="2"></textarea></label>
        <div class="portal-field-row">
          <label class="portal-checkbox"><input type="checkbox" id="record-sterilized" /><span>Esterilizado</span></label>
          <label class="portal-checkbox"><input type="checkbox" id="record-dewormed" /><span>Desparasitado</span></label>
        </div>
        <button type="button" class="portal-rx-save" id="record-save-btn" style="margin-top: 10px">Guardar ficha</button>
        <span class="portal-success" id="record-success" hidden>Guardado ✓</span>
      </div>
    </div>

    <div class="portal-timeline-filters">
      <input type="search" id="visit-search" class="portal-search-input" placeholder="Buscar por servicio o nota..." />
      <select id="visit-status-filter">
        <option value="">Todos los estados</option>
        <option value="pending">Pendiente</option>
        <option value="confirmed">Confirmada</option>
        <option value="in_progress">En curso</option>
        <option value="completed">Completada</option>
        <option value="cancelled">Cancelada</option>
      </select>
    </div>
    <div id="timeline-no-results" class="portal-empty" hidden>Ninguna visita coincide con el filtro.</div>
    <div class="portal-timeline" id="patient-timeline"></div>
  `;

  // Sub-pestañas: Carnet / Vacunas / Datos
  patientDetailBody.querySelectorAll(".portal-subtab").forEach((btn) => {
    btn.addEventListener("click", () => {
      patientDetailBody.querySelectorAll(".portal-subtab").forEach((b) => b.classList.remove("is-active"));
      patientDetailBody.querySelectorAll(".portal-subpanel").forEach((p) => (p.hidden = true));
      btn.classList.add("is-active");
      patientDetailBody.querySelector(`.portal-subpanel[data-subpanel="${btn.dataset.subtab}"]`).hidden = false;
    });
  });

  // Ficha del paciente
  const recordFields = {
    species: patientDetailBody.querySelector("#record-species"),
    breed: patientDetailBody.querySelector("#record-breed"),
    gender: patientDetailBody.querySelector("#record-gender"),
    born: patientDetailBody.querySelector("#record-born"),
    color: patientDetailBody.querySelector("#record-color"),
    weight: patientDetailBody.querySelector("#record-weight"),
    chip: patientDetailBody.querySelector("#record-chip"),
    blood_type: patientDetailBody.querySelector("#record-blood-type"),
    allergies: patientDetailBody.querySelector("#record-allergies"),
    notes: patientDetailBody.querySelector("#record-notes"),
    sterilized: patientDetailBody.querySelector("#record-sterilized"),
    dewormed: patientDetailBody.querySelector("#record-dewormed"),
  };

  const GENDER_LABELS = { male: "Macho", female: "Hembra" };
  const idCardEl = patientDetailBody.querySelector("#pet-id-card");

  function renderIdCard() {
    const responsibleName = record.owner_name || petInfo.owner_name || visits[0]?.owner_name || "Sin registrar";
    const responsiblePhone = record.owner_phone || petInfo.owner_phone || visits[0]?.owner_phone || "Sin teléfono";
    const alerts = [...(record.clinical_alerts || []), ...(record.allergies || []).map((allergy) => `Alergia: ${allergy}`)];
    const rows = [
      ["🐾", "Especie", record.species],
      ["🏷️", "Raza", record.breed || petInfo.pet_breed],
      ["⚧", "Sexo", GENDER_LABELS[record.gender]],
      ["🎂", "Nacimiento", record.born],
      ["⚖️", "Peso", record.weight],
      ["🎨", "Color", record.color],
      ["🔖", "Chip", record.chip],
      ["🩸", "Tipo de sangre", record.blood_type],
      ["⚠️", "Alergias", (record.allergies || []).join(", ")],
    ];

    const badges = [
      `<span class="portal-id-badge ${record.sterilized ? "is-yes" : "is-no"}">${record.sterilized ? "✓" : "✕"} Esterilizado</span>`,
      `<span class="portal-id-badge ${record.dewormed ? "is-yes" : "is-no"}">${record.dewormed ? "✓" : "✕"} Desparasitado</span>`,
    ].join("");

    idCardEl.innerHTML = `
      <div class="portal-id-card-header">
        <img src="${petInfo.pet_image || ""}" alt="" onerror="this.style.visibility='hidden'" />
        <div>
          <strong>${petInfo.pet_name || "Mascota"}</strong>
          <span>Carnet de identificación</span>
        </div>
      </div>
      <div class="portal-patient-responsible">
        <div><span>Responsable</span><strong>${responsibleName}</strong></div>
        <div><span>Contacto</span><strong>${responsiblePhone}</strong></div>
      </div>
      ${alerts.length ? `<div class="portal-clinical-alert"><strong>Alertas clínicas</strong><span>${alerts.join(" · ")}</span></div>` : ""}
      <div class="portal-id-card-grid">
        ${rows
          .map(
            ([icon, label, value]) => `
          <div class="portal-id-card-cell">
            <span class="portal-id-card-label">${icon} ${label}</span>
            <strong>${value || "—"}</strong>
          </div>`
          )
          .join("")}
      </div>
      <div class="portal-id-card-badges">${badges}</div>
    `;
  }
  renderIdCard();

  recordFields.species.value = record?.species || "";
  recordFields.breed.value = record?.breed || petInfo.pet_breed || "";
  recordFields.gender.value = record?.gender || "";
  recordFields.born.value = record?.born || "";
  recordFields.color.value = record?.color || "";
  recordFields.weight.value = record?.weight || "";
  recordFields.chip.value = record?.chip || "";
  recordFields.blood_type.value = record?.blood_type || "";
  recordFields.allergies.value = (record?.allergies || []).join(", ");
  recordFields.notes.value = record?.notes || "";
  recordFields.sterilized.checked = !!record?.sterilized;
  recordFields.dewormed.checked = !!record?.dewormed;

  patientDetailBody.querySelector("#record-save-btn").addEventListener("click", async () => {
    const patch = {
      vet_id: currentVetId,
      pet_key: key,
      species: recordFields.species.value.trim(),
      breed: recordFields.breed.value.trim(),
      gender: recordFields.gender.value,
      born: recordFields.born.value,
      color: recordFields.color.value.trim(),
      weight: recordFields.weight.value.trim(),
      chip: recordFields.chip.value.trim(),
      blood_type: recordFields.blood_type.value.trim(),
      allergies: recordFields.allergies.value.split(",").map((a) => a.trim()).filter(Boolean),
      notes: recordFields.notes.value.trim(),
      sterilized: recordFields.sterilized.checked,
      dewormed: recordFields.dewormed.checked,
      updated_at: new Date().toISOString(),
    };
    let saved = null;
    if (isDemoSession) {
      saved = saveDemoPatientRecord(key, patch);
    } else {
      const result = await supabase
        .from("patient_records")
        .upsert(patch, { onConflict: "vet_id,pet_key" })
        .select()
        .single();
      saved = result.data;
    }
    if (saved) {
      Object.assign(record, saved);
      renderIdCard();
    }
    const successLabel = patientDetailBody.querySelector("#record-success");
    successLabel.hidden = false;
    setTimeout(() => (successLabel.hidden = true), 2000);
  });

  // Carnet de vacunas
  const vaccineList = patientDetailBody.querySelector("#vaccine-list");
  const vaccineForm = patientDetailBody.querySelector("#vaccine-form");
  const vaccineAddToggle = patientDetailBody.querySelector("#vaccine-add-toggle");
  renderVaccineList(vaccineList, vaccines);

  vaccineAddToggle.addEventListener("click", () => {
    vaccineForm.hidden = !vaccineForm.hidden;
  });

  patientDetailBody.querySelector("#vaccine-save-btn").addEventListener("click", async () => {
    const nameInput = patientDetailBody.querySelector("#vaccine-name");
    const dateGivenInput = patientDetailBody.querySelector("#vaccine-date-given");
    const nextDueInput = patientDetailBody.querySelector("#vaccine-next-due");
    const notesInput = patientDetailBody.querySelector("#vaccine-notes");
    if (!nameInput.value.trim()) return;

    vaccines = [
      ...vaccines,
      {
        vaccine_name: nameInput.value.trim(),
        date_given: dateGivenInput.value,
        next_due_date: nextDueInput.value,
        notes: notesInput.value.trim(),
      },
    ];

    if (isDemoSession) {
      saveDemoPatientRecord(key, { ...record, vaccines });
    } else {
      await supabase
        .from("patient_records")
        .upsert({ vet_id: currentVetId, pet_key: key, vaccines }, { onConflict: "vet_id,pet_key" });
    }

    renderVaccineList(vaccineList, vaccines);
    nameInput.value = "";
    dateGivenInput.value = "";
    nextDueInput.value = "";
    notesInput.value = "";
    vaccineForm.hidden = true;
  });

  const timeline = patientDetailBody.querySelector("#patient-timeline");
  const timelineNoResults = patientDetailBody.querySelector("#timeline-no-results");
  const visitSearch = patientDetailBody.querySelector("#visit-search");
  const visitStatusFilter = patientDetailBody.querySelector("#visit-status-filter");

  function renderTimeline(list) {
    timeline.innerHTML = "";
    timelineNoResults.hidden = list.length > 0;
    list.forEach((apt) => renderTimelineItem(apt));
  }

  function applyTimelineFilter() {
    const q = visitSearch.value.trim().toLowerCase();
    const statusFilter = visitStatusFilter.value;
    const filtered = visits.filter((apt) => {
      const matchesQ =
        !q || (apt.service || "").toLowerCase().includes(q) || (apt.notes || "").toLowerCase().includes(q);
      const matchesStatus = !statusFilter || apt.status === statusFilter;
      return matchesQ && matchesStatus;
    });
    renderTimeline(filtered);
  }

  visitSearch.addEventListener("input", applyTimelineFilter);
  visitStatusFilter.addEventListener("change", applyTimelineFilter);

  function renderTimelineItem(apt) {
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
      <span class="portal-visit-notes-label">Signos vitales de esta visita</span>
      <div class="portal-vitals-grid">
        <label>Peso (kg)<input type="number" step="0.1" class="vital-weight" value="${apt.weight_kg ?? ""}" /></label>
        <label>Temp. (°C)<input type="number" step="0.1" class="vital-temp" value="${apt.temperature_c ?? ""}" /></label>
        <label>Frec. cardíaca<input type="number" class="vital-hr" value="${apt.heart_rate ?? ""}" /></label>
        <label>Frec. respiratoria<input type="number" class="vital-rr" value="${apt.respiratory_rate ?? ""}" /></label>
      </div>
      <button type="button" class="portal-visit-save vitals-save">Guardar signos vitales</button>
      <span class="portal-success vitals-success" hidden>Guardado ✓</span>

      <span class="portal-visit-notes-label">Notas clínicas</span>
      <textarea placeholder="Diagnóstico, tratamiento, indicaciones...">${apt.notes || ""}</textarea>
      <button type="button" class="portal-visit-save">Guardar nota</button>
      <span class="portal-success" hidden>Guardado ✓</span>
    `;
    const textarea = visit.querySelector("textarea");
    const saveBtn = visit.querySelector(".portal-visit-save:not(.vitals-save)");
    const savedLabel = visit.querySelector(".portal-success:not(.vitals-success)");
    saveBtn.addEventListener("click", async () => {
      if (!isDemoSession) {
        await supabase.from("appointments").update({ notes: textarea.value.trim() }).eq("id", apt.id);
      }
      apt.notes = textarea.value.trim();
      saveDemoAppointments();
      savedLabel.hidden = false;
      setTimeout(() => (savedLabel.hidden = true), 2000);
    });

    const vitalsSaveBtn = visit.querySelector(".vitals-save");
    const vitalsSavedLabel = visit.querySelector(".vitals-success");
    vitalsSaveBtn.addEventListener("click", async () => {
      const toNumOrNull = (val) => (val === "" ? null : Number(val));
      const weight_kg = toNumOrNull(visit.querySelector(".vital-weight").value);
      const temperature_c = toNumOrNull(visit.querySelector(".vital-temp").value);
      const heart_rate = toNumOrNull(visit.querySelector(".vital-hr").value);
      const respiratory_rate = toNumOrNull(visit.querySelector(".vital-rr").value);
      if (!isDemoSession) {
        await supabase
          .from("appointments")
          .update({ weight_kg, temperature_c, heart_rate, respiratory_rate })
          .eq("id", apt.id);
      }
      Object.assign(apt, { weight_kg, temperature_c, heart_rate, respiratory_rate });
      saveDemoAppointments();
      vitalsSavedLabel.hidden = false;
      setTimeout(() => (vitalsSavedLabel.hidden = true), 2000);
    });

    if (isVet()) {
      const { section: rxSection, listEl: rxListEl, rxState } = createRxSection(apt);
      rxState.push(...(rxByApt.get(apt.id) || []));
      renderRxList(rxListEl, rxState, apt);
      visit.appendChild(rxSection);

      const { section: examSection, listEl: examListEl, examState } = createExamSection(apt);
      examState.push(...(examByApt.get(apt.id) || []));
      renderExamList(examListEl, examState);
      visit.appendChild(examSection);
    }

    item.appendChild(visit);
    timeline.appendChild(item);
  }

  renderTimeline(visits);

  pacientesGridView.hidden = true;
  patientDetailView.hidden = false;
}

let linkedPatientRecords = [];

async function refetchLinkedPatientRecords() {
  if (!supportsMedicalRecords()) {
    linkedPatientRecords = [];
    return;
  }
  const { data } = await supabase
    .from("patient_records")
    .select("pet_key,pet_name,breed,pet_image_url")
    .eq("vet_id", currentVetId);
  linkedPatientRecords = data || [];
}

async function loadTabData({ session }) {
  currentVetId = session.user.id;
  if (isStore()) {
    allAppointments = [];
    linkedPatientRecords = [];
    storeOrders = buildDemoStoreOrders();
    storeProducts = buildDemoStoreProducts();
    selectedDateFilter = null;
    renderCalendar();
    renderStoreOrders(storeOrders);
    renderStoreProducts(storeProducts);
    renderDashboard();
    return;
  }
  if (isCaretaker()) {
    allAppointments = [];
    linkedPatientRecords = [];
    careSessions = buildDemoCareSessions();
    careClients = buildDemoCareClients();
    activeCareCategory = "paseo";
    selectedDateFilter = null;
    renderCalendar();
    renderCareSessions(activeCareCategory);
    renderCareClients(careClients);
    renderCareProfile();
    renderDashboard();
    return;
  }

  const { data } = await supabase
    .from("appointments")
    .select("*")
    .eq("vet_id", session.user.id)
    .order("date", { ascending: true });

  allAppointments = data || [];
  await refetchLinkedPatientRecords();
  selectedDateFilter = null;
  if (allAppointments[0]?.date) {
    const [y, m] = allAppointments[0].date.split("-").map(Number);
    calendarViewDate = new Date(y, m - 1, 1);
  }
  renderCalendar();
  renderCitas(filterAppointments());
  renderPendingCitas();
  renderPacientes(allAppointments, linkedPatientRecords);
  renderDashboard();
}

function loadDemoTabData(providerType) {
  if (providerType === "store" || providerType === "food") {
    allAppointments = [];
    linkedPatientRecords = [];
    storeOrders = buildDemoStoreOrders();
    storeProducts = buildDemoStoreProducts();
    selectedDateFilter = null;
    renderCalendar();
    renderStoreOrders(storeOrders);
    renderStoreProducts(storeProducts);
    renderDashboard();
    return;
  }
  if (providerType === "caregiver" || providerType === "caretaker") {
    allAppointments = [];
    linkedPatientRecords = [];
    storeOrders = [];
    storeProducts = [];
    careSessions = buildDemoCareSessions();
    careClients = buildDemoCareClients();
    activeCareCategory = "paseo";
    selectedDateFilter = null;
    renderCalendar();
    renderCareSessions(activeCareCategory);
    renderCareClients(careClients);
    renderCareProfile();
    renderDashboard();
    return;
  }

  allAppointments = loadDemoAppointments(providerType);
  storeOrders = [];
  storeProducts = [];
  careSessions = [];
  careClients = [];
  linkedPatientRecords = supportsMedicalRecords()
    ? Object.values(loadDemoPatientRecords())
    : [];
  selectedDateFilter = null;
  if (allAppointments[0]?.date) {
    const [y, m] = allAppointments[0].date.split("-").map(Number);
    calendarViewDate = new Date(y, m - 1, 1);
  }
  renderCalendar();
  renderCitas(filterAppointments());
  renderPendingCitas();
  renderPacientes(allAppointments, linkedPatientRecords);
  renderDashboard();
}

const statToday = document.getElementById("stat-today");
const statPending = document.getElementById("stat-pending");
const statPatients = document.getElementById("stat-patients");
const statMonth = document.getElementById("stat-month");
const todayDateLabel = document.getElementById("today-date-label");
const todayEmpty = document.getElementById("today-empty");
const todayList = document.getElementById("today-list");

function renderDashboard() {
  if (isStore()) {
    renderStoreDashboard();
    return;
  }
  if (isCaretaker()) {
    renderCareDashboard();
    return;
  }

  const now = new Date();
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  const monthPrefix = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

  const scheduledAppointments = allAppointments.filter((appointment) => !["pending", "cancelled"].includes(appointment.status));
  const todaysAppointments = scheduledAppointments.filter((a) => a.date === todayKey);
  const pendingCount = allAppointments.filter((a) => a.status === "pending").length;
  const monthCount = scheduledAppointments.filter((a) => (a.date || "").startsWith(monthPrefix)).length;
  const patientKeys = new Set(scheduledAppointments.map((a) => a.pet_id || a.pet_name).filter(Boolean));

  statToday.textContent = todaysAppointments.length;
  statPending.textContent = pendingCount;
  statPatients.textContent = patientKeys.size;
  statMonth.textContent = monthCount;

  todayDateLabel.textContent = now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });

  todayList.innerHTML = "";
  todayEmpty.hidden = todaysAppointments.length > 0;
  todaysAppointments.forEach((apt) => todayList.appendChild(buildAppointmentCard(apt)));
}

(async function init() {
  const demoEmail = sessionStorage.getItem(DEMO_SESSION_KEY) || "";
  const demoProfile = DEMO_ACCOUNTS[demoEmail.toLowerCase()];
  if (demoProfile) {
    loginDemoProvider(demoProfile, demoEmail);
  } else {
    const ctx = await requireProviderSession();
    if (ctx) await loadTabData(ctx);
  }

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") showLogin();
  });
})();

const chatWidget = document.querySelector(".chat-widget");
const chatToggle = document.querySelector(".chat-toggle");
const chatPanel = document.querySelector(".chat-panel");
const chatClose = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector(".chat-messages");
const heroVideo = document.querySelector(".hero-video");
const adoptionTrigger = document.querySelector(".adoption-trigger");
const adoptionPanel = document.querySelector(".adoption-panel");
const adoptionSurface = document.querySelector(".adoption-surface");
const adoptionClose = document.querySelector(".adoption-close");
const swipePaw = document.querySelector(".swipe-paw");
const vetTrigger = document.querySelector(".vet-trigger");
const vetPanel = document.querySelector(".vet-panel");
const vetClose = document.querySelector(".vet-close");
const vetDetailButtons = document.querySelectorAll("[data-vet-detail]");
const vetDetailModal = document.querySelector(".vet-detail-modal");
const vetDetailClose = document.querySelector(".vet-detail-close");
const vetDetailIcon = document.querySelector(".vet-detail-icon");
const vetDetailTitle = document.querySelector("#vet-detail-title");
const vetDetailText = document.querySelector(".vet-detail-card p");
const vetDetailList = document.querySelector(".vet-detail-card ul");
const groomingTrigger = document.querySelector(".grooming-trigger");
const groomingPanel = document.querySelector(".grooming-panel");
const groomingClose = document.querySelector(".grooming-close");
const groomingDetailButtons = document.querySelectorAll("[data-grooming-detail]");
const groomingDetailModal = document.querySelector(".grooming-detail-modal");
const groomingDetailClose = document.querySelector(".grooming-detail-close");
const groomingDetailIcon = document.querySelector(".grooming-detail-icon");
const groomingDetailTitle = document.querySelector("#grooming-detail-title");
const groomingDetailText = document.querySelector(".grooming-detail-card p");
const groomingDetailList = document.querySelector(".grooming-detail-card ul");
const storeTrigger = document.querySelector(".store-trigger");
const storePanel = document.querySelector(".store-panel");
const storeClose = document.querySelector(".store-close");
const storeDetailButtons = document.querySelectorAll("[data-store-detail]");
const storeDetailModal = document.querySelector(".store-detail-modal");
const storeDetailClose = document.querySelector(".store-detail-close");
const storeDetailIcon = document.querySelector(".store-detail-icon");
const storeDetailTitle = document.querySelector("#store-detail-title");
const storeDetailText = document.querySelector(".store-detail-card p");
const storeDetailList = document.querySelector(".store-detail-card ul");
const caregiversTrigger = document.querySelector(".caregivers-trigger");
const caregiversPanel = document.querySelector(".caregivers-panel");
const caregiversClose = document.querySelector(".caregivers-close");
const caregiversDetailButtons = document.querySelectorAll("[data-caregivers-detail]");
const caregiversDetailModal = document.querySelector(".caregivers-detail-modal");
const caregiversDetailClose = document.querySelector(".caregivers-detail-close");
const caregiversDetailIcon = document.querySelector(".caregivers-detail-icon");
const caregiversDetailTitle = document.querySelector("#caregivers-detail-title");
const caregiversDetailText = document.querySelector(".caregivers-detail-card p");
const caregiversDetailList = document.querySelector(".caregivers-detail-card ul");
const sosTrigger = document.querySelector(".sos-trigger");
const sosPanel = document.querySelector(".sos-panel");
const sosClose = document.querySelector(".sos-close");
const sosDetailButtons = document.querySelectorAll("[data-sos-detail]");
const sosDetailModal = document.querySelector(".sos-detail-modal");
const sosDetailClose = document.querySelector(".sos-detail-close");
const sosDetailIcon = document.querySelector(".sos-detail-icon");
const sosDetailTitle = document.querySelector("#sos-detail-title");
const sosDetailText = document.querySelector(".sos-detail-card p");
const sosDetailList = document.querySelector(".sos-detail-card ul");

const history = [];

const vetDetails = {
  search: {
    icon: "⌕",
    title: "Busca veterinarias",
    text: "Encuentra clínicas cercanas, compara opciones y elige con confianza según lo que necesita tu mascota.",
    items: ["Búsqueda por ubicación.", "Filtros por servicio y disponibilidad.", "Perfiles con fotos, horarios y opiniones."],
  },
  schedule: {
    icon: "▦",
    title: "Agenda citas",
    text: "Reserva una cita sin llamadas largas: escoge fecha, hora, servicio y confirma desde Peluvi.",
    items: ["Horarios disponibles en tiempo real.", "Recordatorios antes de la cita.", "Historial de reservas para tu mascota."],
  },
  services: {
    icon: "✚",
    title: "Servicios y doctores",
    text: "Mira qué ofrece cada veterinaria y conoce el perfil de sus profesionales antes de agendar.",
    items: ["Consulta general, vacunas y urgencias.", "Especialistas y experiencia del equipo.", "Precios o rangos visibles cuando estén disponibles."],
  },
  trust: {
    icon: "✚",
    title: "Atención confiable",
    text: "Ayuda a los dueños a elegir espacios verificados y con información clara para cuidar mejor.",
    items: ["Clínicas verificadas por Peluvi.", "Calificaciones y reseñas de usuarios.", "Información actualizada de contacto y ubicación."],
  },
};

const groomingDetails = {
  schedule: {
    icon: "▦",
    title: "Agenda citas",
    text: "Reserva baños, cortes y spa según disponibilidad del groomer o peluquería.",
    items: ["Horarios disponibles.", "Servicios por tamaño y tipo de pelaje.", "Confirmación rápida desde Peluvi."],
  },
  certified: {
    icon: "✿",
    title: "Groomers certificados",
    text: "Encuentra profesionales con experiencia en cuidado, belleza y trato amable para mascotas.",
    items: ["Perfiles con experiencia.", "Calificaciones de otros usuarios.", "Atención enfocada en bienestar."],
  },
  special: {
    icon: "♡",
    title: "Servicios especializados",
    text: "Accede a cuidados extra según la raza, el pelaje y las necesidades de tu mascota.",
    items: ["Spa y baños medicados.", "Deslanado, uñas y limpieza.", "Cortes por estilo o raza."],
  },
  tracking: {
    icon: "✓",
    title: "Seguimiento de citas",
    text: "Mantente al tanto de cada reserva y guarda el historial de servicios de tu mascota.",
    items: ["Recordatorios antes de la cita.", "Detalle del servicio reservado.", "Historial de cuidado y belleza."],
  },
};

const storeDetails = {
  products: {
    icon: "▣",
    title: "Catálogo aliado",
    text: "Explora alimentos, juguetes y accesorios publicados por tiendas aliadas de Peluvi.",
    items: ["Información organizada por tipo de mascota.", "Datos claros para comparar opciones.", "Contacto con la tienda responsable."],
  },
  offers: {
    icon: "%",
    title: "Novedades y promos",
    text: "Revisa promociones, novedades y productos destacados que las tiendas aliadas quieran comunicar.",
    items: ["Publicaciones de negocios aliados.", "Información actualizada por la tienda.", "Opciones destacadas para consultar directo."],
  },
  delivery: {
    icon: "▱",
    title: "Contacto directo",
    text: "Peluvi funciona como canal para que el usuario consulte disponibilidad y coordine con la tienda.",
    items: ["Botón de contacto o WhatsApp.", "Consulta de disponibilidad y horarios.", "Coordinación directa con el negocio."],
  },
  secure: {
    icon: "✓",
    title: "Aliados verificados",
    text: "Ayuda a elegir negocios con información clara, ubicación y datos de contacto visibles.",
    items: ["Perfiles de tiendas aliadas.", "Ubicación, horarios y medios de contacto.", "Referencias para decidir con más confianza."],
  },
};

const caregiversDetails = {
  verified: {
    icon: "✓",
    title: "Cuidadores verificados",
    text: "Conecta con personas y negocios aliados que ofrecen cuidado para mascotas.",
    items: ["Perfiles con información clara.", "Contacto directo para coordinar el servicio.", "Opciones pensadas para la tranquilidad del dueño."],
  },
  walks: {
    icon: "⌁",
    title: "Paseos programados",
    text: "Encuentra cuidadores que ofrecen paseos y actividades según la rutina de tu mascota.",
    items: ["Consulta disponibilidad y zonas.", "Acuerda horarios directamente.", "Ideal para mascotas con energía o rutinas activas."],
  },
  home: {
    icon: "⌂",
    title: "Cuidado en casa",
    text: "Ubica opciones de visita a domicilio o cuidado por periodos mientras el dueño no está.",
    items: ["Cuidado personalizado.", "Contacto con el cuidador responsable.", "Opciones para viajes, trabajo o días ocupados."],
  },
  tracking: {
    icon: "⌖",
    title: "Seguimiento en tiempo real",
    text: "Peluvi puede ayudar a centralizar actualizaciones y comunicación durante el servicio.",
    items: ["Mensajes y novedades del cuidador.", "Ubicación o recorrido cuando aplique.", "Mayor tranquilidad para el dueño."],
  },
};

const sosDetails = {
  report: {
    icon: "▤",
    title: "Reporta una mascota",
    text: "Crea una alerta con los datos básicos para que la comunidad pueda ayudar más rápido.",
    items: ["Foto, descripción y última ubicación conocida.", "Datos de contacto para recibir información.", "Publicación visible para usuarios cercanos."],
  },
  map: {
    icon: "⌖",
    title: "Mapa en tiempo real",
    text: "Visualiza reportes cercanos y ayuda a conectar pistas con familias que buscan a su mascota.",
    items: ["Reportes por zona.", "Radio cercano para priorizar búsquedas.", "Información útil para actuar rápido."],
  },
  alerts: {
    icon: "!",
    title: "Alertas a la comunidad",
    text: "Peluvi avisa a personas cercanas para aumentar las posibilidades de encontrar a la mascota.",
    items: ["Notificaciones a usuarios de la zona.", "Datos claros para reconocerla.", "Contacto directo con quien reporta."],
  },
  community: {
    icon: "♡",
    title: "Más posibilidades de encontrarla",
    text: "Cada reporte activa una red de apoyo entre dueños, cuidadores, fundaciones y vecinos.",
    items: ["Comunidad atenta a reportes.", "Actualizaciones cuando aparece información.", "Apoyo para reunir mascotas con sus familias."],
  },
};

if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.loop = true;
  heroVideo.playsInline = true;

  const playHeroVideo = () => {
    const attempt = heroVideo.play();
    if (attempt?.catch) {
      attempt.catch(() => {});
    }
  };

  playHeroVideo();
  window.addEventListener("load", playHeroVideo, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && heroVideo.paused) {
      playHeroVideo();
    }
  });
}

function setAdoptionOpen(isOpen) {
  if (!adoptionPanel) return;

  if (isOpen) {
    setVetOpen(false);
    setGroomingOpen(false);
    setStoreOpen(false);
    setCaregiversOpen(false);
    setSosOpen(false);
    adoptionPanel.hidden = false;
    requestAnimationFrame(() => {
      adoptionPanel.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
    adoptionClose?.focus();
    return;
  }

  adoptionPanel.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  window.setTimeout(() => {
    adoptionPanel.hidden = true;
  }, 220);
}

function setVetOpen(isOpen) {
  if (!vetPanel) return;

  if (isOpen) {
    setAdoptionOpen(false);
    setGroomingOpen(false);
    setStoreOpen(false);
    setCaregiversOpen(false);
    setSosOpen(false);
    setVetDetailClosed();
    vetPanel.hidden = false;
    requestAnimationFrame(() => {
      vetPanel.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
    vetClose?.focus();
    return;
  }

  vetPanel.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setVetDetailClosed();
  window.setTimeout(() => {
    vetPanel.hidden = true;
  }, 220);
}

function setGroomingOpen(isOpen) {
  if (!groomingPanel) return;

  if (isOpen) {
    setAdoptionOpen(false);
    setVetOpen(false);
    setStoreOpen(false);
    setCaregiversOpen(false);
    setSosOpen(false);
    setGroomingDetailClosed();
    groomingPanel.hidden = false;
    requestAnimationFrame(() => {
      groomingPanel.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
    groomingClose?.focus();
    return;
  }

  groomingPanel.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setGroomingDetailClosed();
  window.setTimeout(() => {
    groomingPanel.hidden = true;
  }, 220);
}

function setStoreOpen(isOpen) {
  if (!storePanel) return;

  if (isOpen) {
    setAdoptionOpen(false);
    setVetOpen(false);
    setGroomingOpen(false);
    setCaregiversOpen(false);
    setSosOpen(false);
    setStoreDetailClosed();
    storePanel.hidden = false;
    requestAnimationFrame(() => {
      storePanel.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
    storeClose?.focus();
    return;
  }

  storePanel.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setStoreDetailClosed();
  window.setTimeout(() => {
    storePanel.hidden = true;
  }, 220);
}

function setCaregiversOpen(isOpen) {
  if (!caregiversPanel) return;

  if (isOpen) {
    setAdoptionOpen(false);
    setVetOpen(false);
    setGroomingOpen(false);
    setStoreOpen(false);
    setSosOpen(false);
    setCaregiversDetailClosed();
    caregiversPanel.hidden = false;
    requestAnimationFrame(() => {
      caregiversPanel.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
    caregiversClose?.focus();
    return;
  }

  caregiversPanel.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setCaregiversDetailClosed();
  window.setTimeout(() => {
    caregiversPanel.hidden = true;
  }, 220);
}

function setSosOpen(isOpen) {
  if (!sosPanel) return;

  if (isOpen) {
    setAdoptionOpen(false);
    setVetOpen(false);
    setGroomingOpen(false);
    setStoreOpen(false);
    setCaregiversOpen(false);
    setSosDetailClosed();
    sosPanel.hidden = false;
    requestAnimationFrame(() => {
      sosPanel.classList.add("is-open");
      document.body.classList.add("modal-open");
    });
    sosClose?.focus();
    return;
  }

  sosPanel.classList.remove("is-open");
  document.body.classList.remove("modal-open");
  setSosDetailClosed();
  window.setTimeout(() => {
    sosPanel.hidden = true;
  }, 220);
}

adoptionTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  setAdoptionOpen(true);
});

vetTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  setVetOpen(true);
});

groomingTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  setGroomingOpen(true);
});

storeTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  setStoreOpen(true);
});

caregiversTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  setCaregiversOpen(true);
});

sosTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  setSosOpen(true);
});

adoptionClose?.addEventListener("click", () => setAdoptionOpen(false));
vetClose?.addEventListener("click", () => setVetOpen(false));
groomingClose?.addEventListener("click", () => setGroomingOpen(false));
storeClose?.addEventListener("click", () => setStoreOpen(false));
caregiversClose?.addEventListener("click", () => setCaregiversOpen(false));
sosClose?.addEventListener("click", () => setSosOpen(false));

function setVetDetailOpen(key) {
  const detail = vetDetails[key];
  if (!detail || !vetDetailModal) return;

  vetDetailIcon.textContent = detail.icon;
  vetDetailTitle.textContent = detail.title;
  vetDetailText.textContent = detail.text;
  vetDetailList.innerHTML = detail.items.map((item) => `<li>${item}</li>`).join("");
  vetDetailModal.hidden = false;
  vetDetailClose?.focus();
}

function setVetDetailClosed() {
  if (vetDetailModal) {
    vetDetailModal.hidden = true;
  }
}

vetDetailButtons.forEach((button) => {
  button.addEventListener("click", () => setVetDetailOpen(button.dataset.vetDetail));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setVetDetailOpen(button.dataset.vetDetail);
    }
  });
});

vetDetailClose?.addEventListener("click", setVetDetailClosed);
vetDetailModal?.addEventListener("click", (event) => {
  if (event.target === vetDetailModal) {
    setVetDetailClosed();
  }
});

adoptionPanel?.addEventListener("click", (event) => {
  if (event.target === adoptionPanel) {
    setAdoptionOpen(false);
  }
});

vetPanel?.addEventListener("click", (event) => {
  if (event.target === vetPanel) {
    setVetOpen(false);
  }
});

groomingPanel?.addEventListener("click", (event) => {
  if (event.target === groomingPanel) {
    setGroomingOpen(false);
  }
});

storePanel?.addEventListener("click", (event) => {
  if (event.target === storePanel) {
    setStoreOpen(false);
  }
});

caregiversPanel?.addEventListener("click", (event) => {
  if (event.target === caregiversPanel) {
    setCaregiversOpen(false);
  }
});

sosPanel?.addEventListener("click", (event) => {
  if (event.target === sosPanel) {
    setSosOpen(false);
  }
});

function setGroomingDetailOpen(key) {
  const detail = groomingDetails[key];
  if (!detail || !groomingDetailModal) return;

  groomingDetailIcon.textContent = detail.icon;
  groomingDetailTitle.textContent = detail.title;
  groomingDetailText.textContent = detail.text;
  groomingDetailList.innerHTML = detail.items.map((item) => `<li>${item}</li>`).join("");
  groomingDetailModal.hidden = false;
  groomingDetailClose?.focus();
}

function setGroomingDetailClosed() {
  if (groomingDetailModal) {
    groomingDetailModal.hidden = true;
  }
}

groomingDetailButtons.forEach((button) => {
  button.addEventListener("click", () => setGroomingDetailOpen(button.dataset.groomingDetail));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setGroomingDetailOpen(button.dataset.groomingDetail);
    }
  });
});

groomingDetailClose?.addEventListener("click", setGroomingDetailClosed);
groomingDetailModal?.addEventListener("click", (event) => {
  if (event.target === groomingDetailModal) {
    setGroomingDetailClosed();
  }
});

function setStoreDetailOpen(key) {
  const detail = storeDetails[key];
  if (!detail || !storeDetailModal) return;

  storeDetailIcon.textContent = detail.icon;
  storeDetailTitle.textContent = detail.title;
  storeDetailText.textContent = detail.text;
  storeDetailList.innerHTML = detail.items.map((item) => `<li>${item}</li>`).join("");
  storeDetailModal.hidden = false;
  storeDetailClose?.focus();
}

function setStoreDetailClosed() {
  if (storeDetailModal) {
    storeDetailModal.hidden = true;
  }
}

storeDetailButtons.forEach((button) => {
  button.addEventListener("click", () => setStoreDetailOpen(button.dataset.storeDetail));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setStoreDetailOpen(button.dataset.storeDetail);
    }
  });
});

storeDetailClose?.addEventListener("click", setStoreDetailClosed);
storeDetailModal?.addEventListener("click", (event) => {
  if (event.target === storeDetailModal) {
    setStoreDetailClosed();
  }
});

function setCaregiversDetailOpen(key) {
  const detail = caregiversDetails[key];
  if (!detail || !caregiversDetailModal) return;

  caregiversDetailIcon.textContent = detail.icon;
  caregiversDetailTitle.textContent = detail.title;
  caregiversDetailText.textContent = detail.text;
  caregiversDetailList.innerHTML = detail.items.map((item) => `<li>${item}</li>`).join("");
  caregiversDetailModal.hidden = false;
  caregiversDetailClose?.focus();
}

function setCaregiversDetailClosed() {
  if (caregiversDetailModal) {
    caregiversDetailModal.hidden = true;
  }
}

caregiversDetailButtons.forEach((button) => {
  button.addEventListener("click", () => setCaregiversDetailOpen(button.dataset.caregiversDetail));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setCaregiversDetailOpen(button.dataset.caregiversDetail);
    }
  });
});

caregiversDetailClose?.addEventListener("click", setCaregiversDetailClosed);
caregiversDetailModal?.addEventListener("click", (event) => {
  if (event.target === caregiversDetailModal) {
    setCaregiversDetailClosed();
  }
});

function setSosDetailOpen(key) {
  const detail = sosDetails[key];
  if (!detail || !sosDetailModal) return;

  sosDetailIcon.textContent = detail.icon;
  sosDetailTitle.textContent = detail.title;
  sosDetailText.textContent = detail.text;
  sosDetailList.innerHTML = detail.items.map((item) => `<li>${item}</li>`).join("");
  sosDetailModal.hidden = false;
  sosDetailClose?.focus();
}

function setSosDetailClosed() {
  if (sosDetailModal) {
    sosDetailModal.hidden = true;
  }
}

sosDetailButtons.forEach((button) => {
  button.addEventListener("click", () => setSosDetailOpen(button.dataset.sosDetail));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSosDetailOpen(button.dataset.sosDetail);
    }
  });
});

sosDetailClose?.addEventListener("click", setSosDetailClosed);
sosDetailModal?.addEventListener("click", (event) => {
  if (event.target === sosDetailModal) {
    setSosDetailClosed();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && adoptionPanel?.classList.contains("is-open")) {
    setAdoptionOpen(false);
  }
  if (event.key === "Escape" && vetPanel?.classList.contains("is-open")) {
    if (vetDetailModal && !vetDetailModal.hidden) {
      setVetDetailClosed();
    } else {
      setVetOpen(false);
    }
  }
  if (event.key === "Escape" && groomingPanel?.classList.contains("is-open")) {
    if (groomingDetailModal && !groomingDetailModal.hidden) {
      setGroomingDetailClosed();
    } else {
      setGroomingOpen(false);
    }
  }
  if (event.key === "Escape" && storePanel?.classList.contains("is-open")) {
    if (storeDetailModal && !storeDetailModal.hidden) {
      setStoreDetailClosed();
    } else {
      setStoreOpen(false);
    }
  }
  if (event.key === "Escape" && caregiversPanel?.classList.contains("is-open")) {
    if (caregiversDetailModal && !caregiversDetailModal.hidden) {
      setCaregiversDetailClosed();
    } else {
      setCaregiversOpen(false);
    }
  }
  if (event.key === "Escape" && sosPanel?.classList.contains("is-open")) {
    if (sosDetailModal && !sosDetailModal.hidden) {
      setSosDetailClosed();
    } else {
      setSosOpen(false);
    }
  }
});

if (swipePaw) {
  const followCursor = (event) => {
    if (!adoptionPanel?.classList.contains("is-open")) return;

    const centerX = window.innerWidth * 0.72;
    const baseY = window.innerHeight * 0.82;
    const x = Math.max(-130, Math.min(110, (event.clientX - centerX) * 0.24));
    const y = Math.max(-42, Math.min(10, (event.clientY - baseY) * 0.14));
    const rotate = -18 + x * 0.025;

    swipePaw.classList.add("is-following");
    swipePaw.style.transform = `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
  };

  const resetPaw = () => {
    swipePaw.classList.remove("is-following");
    swipePaw.style.transform = "";
  };

  adoptionPanel?.addEventListener("pointermove", followCursor);
  adoptionPanel?.addEventListener("pointerleave", resetPaw);
}

function setChatOpen(isOpen) {
  chatPanel.hidden = !isOpen;
  chatToggle.setAttribute("aria-expanded", String(isOpen));
  chatWidget.classList.toggle("is-open", isOpen);
  if (isOpen) {
    chatInput.focus();
  }
}

function addMessage(role, text) {
  const message = document.createElement("div");
  message.className = `chat-message ${role}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

chatToggle.addEventListener("click", () => setChatOpen(chatPanel.hidden));
chatClose.addEventListener("click", () => setChatOpen(false));

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  addMessage("user", text);
  history.push({ role: "user", content: text });

  const pending = addMessage("bot", "Pensando...");
  chatForm.classList.add("is-loading");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-10) }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No se pudo responder ahora.");
    }

    pending.textContent = data.reply;
    history.push({ role: "assistant", content: data.reply });
  } catch (error) {
    pending.textContent =
      "Aún no puedo conectarme con la IA. Revisa que el servidor tenga OPENAI_API_KEY configurada.";
  } finally {
    chatForm.classList.remove("is-loading");
  }
});

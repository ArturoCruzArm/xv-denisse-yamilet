(() => {
  "use strict";

  const SUPABASE_URL = "https://nzpujmlienzfetqcgsxz.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cHVqbWxpZW56ZmV0cWNnc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODYzMzYsImV4cCI6MjA5MDI2MjMzNn0.xl3lsb-KYj5tVLKTnzpbsdEGoV9ySnswH4eyRuyEH1s";
  const EVENT_SLUG = "xv-denisse-yamilet";
  const WHATSAPP_NUMBER = "5214792154966";
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  const form = document.getElementById("rsvpForm");
  if (!form) return;

  const nameInput = document.getElementById("rsvpName");
  const guestsInput = document.getElementById("rsvpGuests");
  const messageInput = document.getElementById("rsvpMessage");
  const submitButton = document.getElementById("rsvpSubmit");
  const result = document.getElementById("rsvpResult");
  const welcome = document.getElementById("personalizedWelcome");
  const token = new URLSearchParams(window.location.search).get("inv");

  let eventId = null;
  let guest = null;

  async function request(path, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(detail || `Error ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  async function getEventId() {
    if (eventId) return eventId;
    const rows = await request(`eventos?slug=eq.${EVENT_SLUG}&select=id&limit=1`);
    eventId = rows[0]?.id || null;
    if (!eventId) throw new Error("El evento no está disponible.");
    return eventId;
  }

  function setGuestOptions(maximum) {
    const max = Math.max(1, Math.min(Number(maximum) || 1, 20));
    guestsInput.innerHTML = "";
    for (let count = 1; count <= max; count += 1) {
      const option = document.createElement("option");
      option.value = String(count);
      option.textContent = count === 1 ? "1 persona" : `${count} personas`;
      guestsInput.appendChild(option);
    }
    guestsInput.value = String(max);
  }

  async function loadPersonalizedGuest() {
    if (!token) return;
    try {
      const rows = await request(
        `invitados?token=eq.${encodeURIComponent(token)}&select=id,evento_id,nombre,pases_asignados,status,asiste,pases_confirmados,mensaje&limit=1`
      );
      guest = rows[0] || null;
      if (!guest) throw new Error("Enlace no válido");

      nameInput.value = guest.nombre;
      nameInput.readOnly = true;
      setGuestOptions(guest.pases_asignados);
      welcome.hidden = false;
      document.getElementById("guestWelcomeText").textContent = `${guest.nombre}, esta invitación es para ti`;
      document.getElementById("guestPassesText").textContent =
        `${guest.pases_asignados} ${guest.pases_asignados === 1 ? "pase asignado" : "pases asignados"}`;

      if (guest.status === "pendiente" || guest.status === "enviada") {
        await request(`invitados?id=eq.${guest.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "vista", fecha_vista: new Date().toISOString() })
        });
      }
    } catch (error) {
      welcome.hidden = false;
      welcome.innerHTML = "<strong>Este enlace personalizado no es válido.</strong><p>Puedes confirmar con el formulario general.</p>";
      guest = null;
      nameInput.readOnly = false;
    }
  }

  function whatsappUrl({ name, attends, passes, message }) {
    const status = attends ? "Sí asistiré" : "No podré asistir";
    const details = [
      "Hola, confirmo mi respuesta para los XV años de Denisse Yamilet.",
      "",
      `Nombre: ${name}`,
      `Asistencia: ${status}`,
      ...(attends ? [`Personas: ${passes}`] : []),
      ...(message ? [`Mensaje: ${message}`] : [])
    ].join("\n");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(details)}`;
  }

  async function saveResponse(data) {
    const payload = {
      status: data.attends ? "confirmada" : "declinada",
      asiste: data.attends,
      confirmacion_nombre: data.name,
      pases_confirmados: data.attends ? data.passes : 0,
      mensaje: data.message || null,
      fecha_confirmacion: new Date().toISOString()
    };

    if (guest) {
      await request(`invitados?id=eq.${guest.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload)
      });
      return;
    }

    const id = await getEventId();
    await request("invitados", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        evento_id: id,
        nombre: data.name,
        pases_asignados: Math.max(1, data.passes),
        categoria: "otro",
        ...payload
      })
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const data = {
      name: nameInput.value.trim(),
      attends: true,
      passes: Number(guestsInput.value) || 1,
      message: messageInput.value.trim()
    };
    if (!data.name) return;

    submitButton.disabled = true;
    submitButton.textContent = "Guardando respuesta…";
    result.hidden = true;

    try {
      await saveResponse(data);
      const waUrl = whatsappUrl(data);
      result.innerHTML = `
        <strong>Respuesta registrada</strong>
        <p>WhatsApp se abrirá con tu confirmación lista para enviar.</p>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a>`;
      result.hidden = false;
      submitButton.textContent = "Respuesta guardada";
      window.open(waUrl, "_blank", "noopener");
    } catch (error) {
      result.innerHTML = "<strong>No se pudo guardar la respuesta</strong><p>Revisa tu conexión e inténtalo nuevamente.</p>";
      result.hidden = false;
      submitButton.disabled = false;
      submitButton.textContent = "Confirmar y enviar por WhatsApp";
      console.error("RSVP:", error);
    }
  });

  loadPersonalizedGuest();
})();

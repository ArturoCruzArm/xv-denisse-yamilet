(() => {
  "use strict";

  const SUPABASE_URL = "https://nzpujmlienzfetqcgsxz.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cHVqbWxpZW56ZmV0cWNnc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2ODYzMzYsImV4cCI6MjA5MDI2MjMzNn0.xl3lsb-KYj5tVLKTnzpbsdEGoV9ySnswH4eyRuyEH1s";
  const EVENT_SLUG = "xv-denisse-yamilet";
  const BASE_URL = "https://denisse-yamilet.invitados.org";
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };

  let eventId = null;
  let guests = [];

  const form = document.getElementById("guestForm");
  const rows = document.getElementById("guestRows");
  const status = document.getElementById("formStatus");
  const search = document.getElementById("searchGuests");
  const filter = document.getElementById("statusFilter");

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

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  async function load() {
    try {
      const events = await request(`eventos?slug=eq.${EVENT_SLUG}&select=id&limit=1`);
      eventId = events[0]?.id || null;
      if (!eventId) throw new Error("No se encontró el evento.");
      guests = await request(`invitados?evento_id=eq.${eventId}&order=fecha_creacion.asc`);
      render();
    } catch (error) {
      rows.innerHTML = `<tr><td colspan="6" class="empty-row">No se pudieron cargar los invitados.</td></tr>`;
      console.error(error);
    }
  }

  function summary() {
    const confirmed = guests.filter(g => g.status === "confirmada");
    const declined = guests.filter(g => g.status === "declinada");
    const pending = guests.filter(g => !["confirmada", "declinada"].includes(g.status));
    setText("totalGuests", guests.length);
    setText("totalPasses", `${guests.reduce((sum, g) => sum + (g.pases_asignados || 0), 0)} pases`);
    setText("confirmedGuests", confirmed.length);
    setText("confirmedPasses", `${confirmed.reduce((sum, g) => sum + (g.pases_confirmados || 0), 0)} personas`);
    setText("pendingGuests", pending.length);
    setText("declinedGuests", declined.length);
  }

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function render() {
    summary();
    const query = search.value.trim().toLowerCase();
    const state = filter.value;
    const visible = guests.filter(guest =>
      (!query || guest.nombre.toLowerCase().includes(query)) &&
      (state === "all" || guest.status === state)
    );
    if (!visible.length) {
      rows.innerHTML = '<tr><td colspan="6" class="empty-row">No hay invitados en esta vista.</td></tr>';
      return;
    }
    rows.innerHTML = visible.map(guest => {
      const response = guest.status === "confirmada"
        ? `${guest.pases_confirmados || 0} personas`
        : guest.status === "declinada" ? "No asistirá" : "—";
      return `<tr>
        <td><span class="guest-name">${escapeHtml(guest.nombre)}</span><span class="guest-meta">${escapeHtml(guest.categoria || "otro")}${guest.telefono ? ` · ${escapeHtml(guest.telefono)}` : ""}</span></td>
        <td>${guest.pases_asignados}</td>
        <td>${escapeHtml(guest.mesa_asignada || "—")}</td>
        <td><span class="status status-${escapeHtml(guest.status)}">${escapeHtml(guest.status)}</span></td>
        <td>${response}${guest.mensaje ? `<span class="guest-meta">${escapeHtml(guest.mensaje)}</span>` : ""}</td>
        <td><div class="actions">
          <button class="action action-wa" data-action="whatsapp" data-id="${guest.id}">WhatsApp</button>
          <button class="action" data-action="copy" data-id="${guest.id}">Copiar enlace</button>
          <button class="action" data-action="edit" data-id="${guest.id}">Editar</button>
          <button class="action action-danger" data-action="delete" data-id="${guest.id}">Eliminar</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  function invitationLink(guest) {
    return `${BASE_URL}/?inv=${guest.token}`;
  }

  async function sendWhatsApp(guest) {
    const phone = (guest.telefono || "").replace(/\D/g, "");
    const normalized = phone.startsWith("52") ? phone : `52${phone}`;
    const message = [
      `Hola ${guest.nombre}`,
      "",
      "Te invitamos a los XV años de Denisse Yamilet el 19 de septiembre de 2026.",
      "",
      invitationLink(guest),
      "",
      `Tienes ${guest.pases_asignados} ${guest.pases_asignados === 1 ? "pase" : "pases"}.`,
      "Confirma tu asistencia desde el enlace."
    ].join("\n");
    await request(`invitados?id=eq.${guest.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ status: "enviada", fecha_envio: new Date().toISOString() })
    });
    guest.status = "enviada";
    render();
    window.open(phone ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  function startEdit(guest) {
    document.getElementById("guestId").value = guest.id;
    document.getElementById("guestName").value = guest.nombre;
    document.getElementById("guestPhone").value = guest.telefono || "";
    document.getElementById("guestCategory").value = guest.categoria || "otro";
    document.getElementById("guestPasses").value = guest.pases_asignados || 1;
    document.getElementById("guestTable").value = guest.mesa_asignada || "";
    document.getElementById("guestNotes").value = guest.notas || "";
    document.getElementById("cancelEdit").hidden = false;
    document.getElementById("saveGuest").textContent = "Actualizar invitado";
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetForm() {
    form.reset();
    document.getElementById("guestId").value = "";
    document.getElementById("guestPasses").value = "1";
    document.getElementById("cancelEdit").hidden = true;
    document.getElementById("saveGuest").textContent = "Guardar invitado";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const id = document.getElementById("guestId").value;
    const payload = {
      nombre: document.getElementById("guestName").value.trim(),
      telefono: document.getElementById("guestPhone").value.trim() || null,
      categoria: document.getElementById("guestCategory").value,
      pases_asignados: Number(document.getElementById("guestPasses").value) || 1,
      mesa_asignada: document.getElementById("guestTable").value.trim() || null,
      notas: document.getElementById("guestNotes").value.trim() || null
    };
    status.className = "form-status";
    status.textContent = "Guardando…";
    try {
      if (id) {
        const updated = await request(`invitados?id=eq.${id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload)
        });
        const index = guests.findIndex(g => g.id === id);
        if (index >= 0) guests[index] = updated[0];
      } else {
        const created = await request("invitados", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ evento_id: eventId, ...payload })
        });
        guests.push(created[0]);
      }
      resetForm();
      render();
      status.textContent = id ? "Invitado actualizado." : "Invitado agregado.";
    } catch (error) {
      status.className = "form-status error";
      status.textContent = "No se pudo guardar. Revisa los datos e inténtalo nuevamente.";
      console.error(error);
    }
  });

  rows.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const guest = guests.find(item => item.id === button.dataset.id);
    if (!guest) return;
    if (button.dataset.action === "whatsapp") await sendWhatsApp(guest);
    if (button.dataset.action === "copy") {
      await navigator.clipboard.writeText(invitationLink(guest));
      button.textContent = "Copiado";
      setTimeout(() => { button.textContent = "Copiar enlace"; }, 1200);
    }
    if (button.dataset.action === "edit") startEdit(guest);
    if (button.dataset.action === "delete" && confirm(`¿Eliminar a ${guest.nombre}?`)) {
      await request(`invitados?id=eq.${guest.id}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      guests = guests.filter(item => item.id !== guest.id);
      render();
    }
  });

  document.getElementById("cancelEdit").addEventListener("click", resetForm);
  search.addEventListener("input", render);
  filter.addEventListener("change", render);
  document.getElementById("exportButton").addEventListener("click", () => {
    const values = [["Nombre", "Telefono", "Categoria", "Pases", "Mesa", "Estado", "Confirmados", "Mensaje"]];
    guests.forEach(g => values.push([g.nombre, g.telefono || "", g.categoria || "", g.pases_asignados, g.mesa_asignada || "", g.status, g.pases_confirmados || "", g.mensaje || ""]));
    const csv = values.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `invitados-denisse-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  });

  load();
})();

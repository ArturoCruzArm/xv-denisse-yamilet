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
  const categoryFilter = document.getElementById("categoryFilter");

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
    const category = categoryFilter.value;
    const visible = guests.filter(guest =>
      (!query || guest.nombre.toLowerCase().includes(query)) &&
      (state === "all" || guest.status === state) &&
      (category === "all" || guest.categoria === category)
    );
    setText("listSummary", `${visible.length} de ${guests.length} invitaciones · ${visible.reduce((sum, guest) => sum + (guest.pases_asignados || 0), 0)} pases visibles`);
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
          <a class="action" href="${invitationLink(guest)}" target="_blank" rel="noopener noreferrer">Abrir</a>
          <button class="action" data-action="copy" data-id="${guest.id}">Copiar enlace</button>
          <button class="action action-confirm" data-action="confirm" data-id="${guest.id}">Confirmar</button>
          <button class="action action-decline" data-action="decline" data-id="${guest.id}">Declinar</button>
          <button class="action" data-action="reset" data-id="${guest.id}">Restablecer</button>
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

  async function setResponse(guest, response) {
    const now = new Date().toISOString();
    const updates = response === "confirmada"
      ? { status: "confirmada", asiste: true, pases_confirmados: guest.pases_asignados, fecha_confirmacion: now }
      : response === "declinada"
        ? { status: "declinada", asiste: false, pases_confirmados: 0, fecha_confirmacion: now }
        : { status: "pendiente", asiste: null, pases_confirmados: null, fecha_confirmacion: null, fecha_envio: null, fecha_vista: null };
    await request(`invitados?id=eq.${guest.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(updates)
    });
    Object.assign(guest, updates);
    render();
  }

  function parseCsvLine(line) {
    const values = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
      else value += char;
    }
    values.push(value.trim());
    return values;
  }

  async function importCsv(file) {
    const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error("El CSV no contiene registros.");
    const columns = parseCsvLine(lines[0]).map(column => column.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    const column = (...names) => columns.findIndex(item => names.includes(item));
    const nameIndex = column("nombre", "nombre completo", "invitado");
    if (nameIndex < 0) throw new Error("El CSV necesita una columna Nombre.");
    const phoneIndex = column("telefono", "whatsapp", "celular");
    const categoryIndex = column("categoria");
    const passesIndex = column("pases", "numero de pases");
    const tableIndex = column("mesa");
    const notesIndex = column("notas");
    const allowedCategories = ["familia", "padrinos", "amigos", "conocidos", "otro"];
    const payload = lines.slice(1).map(line => {
      const values = parseCsvLine(line);
      const category = (values[categoryIndex] || "otro").toLowerCase();
      return {
        evento_id: eventId,
        nombre: values[nameIndex]?.trim(),
        telefono: phoneIndex >= 0 ? values[phoneIndex]?.trim() || null : null,
        categoria: allowedCategories.includes(category) ? category : "otro",
        pases_asignados: Math.max(1, Math.min(20, Number(values[passesIndex]) || 1)),
        mesa_asignada: tableIndex >= 0 ? values[tableIndex]?.trim() || null : null,
        notas: notesIndex >= 0 ? values[notesIndex]?.trim() || null : null
      };
    }).filter(item => item.nombre);
    if (!payload.length) throw new Error("No se encontraron nombres válidos.");
    const created = await request("invitados", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload)
    });
    guests.push(...created);
    render();
    return created.length;
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
    if (button.dataset.action === "confirm") await setResponse(guest, "confirmada");
    if (button.dataset.action === "decline") await setResponse(guest, "declinada");
    if (button.dataset.action === "reset") await setResponse(guest, "pendiente");
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
  categoryFilter.addEventListener("change", render);
  document.getElementById("refreshButton").addEventListener("click", load);
  document.getElementById("printButton").addEventListener("click", () => window.print());
  document.getElementById("importButton").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    status.className = "form-status";
    status.textContent = "Importando…";
    try {
      const count = await importCsv(file);
      status.textContent = `${count} ${count === 1 ? "invitado importado" : "invitados importados"}.`;
    } catch (error) {
      status.className = "form-status error";
      status.textContent = error.message;
    }
    event.target.value = "";
  });
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

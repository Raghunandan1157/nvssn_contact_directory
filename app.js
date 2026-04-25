(() => {
  const API = `${window.SUPABASE_URL}/rest/v1/${window.NVSSN_TABLE}`;
  const HEADERS = {
    apikey: window.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    grid: $("grid"),
    empty: $("empty"),
    meta: $("meta"),
    resultCount: $("resultCount"),
    search: $("search"),
    clearSearch: $("clearSearch"),
    dept: $("dept"),
    loc: $("loc"),
    mgr: $("mgr"),
    desg: $("desg"),
    clearBtn: $("clearBtn"),
    filterToggle: $("filterToggle"),
    filterPanel: $("filterPanel"),
    activeCount: $("activeCount"),
    modal: $("modal"),
    modalBody: $("modalBody"),
    modalClose: $("modalClose"),
  };

  let DATA = [];

  async function fetchAll() {
    els.meta.textContent = "Loading…";
    try {
      const res = await fetch(`${API}?select=*&order=name.asc`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      DATA = await res.json();
      els.meta.textContent = `${DATA.length} employees`;
      populateFilters();
      render();
    } catch (e) {
      els.meta.textContent = "Error loading data";
      console.error(e);
    }
  }

  function uniqueSorted(key) {
    const set = new Set(
      DATA.map((d) => (d[key] || "").trim()).filter((v) => v && v !== "NA")
    );
    return [...set].sort();
  }

  function populateFilters() {
    const fill = (sel, vals) => {
      sel.innerHTML = `<option value="">All</option>` +
        vals.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join("");
    };
    fill(els.dept, uniqueSorted("department"));
    fill(els.loc, uniqueSorted("work_location"));
    fill(els.mgr, uniqueSorted("manager"));
    fill(els.desg, uniqueSorted("designation"));
  }

  function activeFilterCount() {
    return [els.dept, els.loc, els.mgr, els.desg].filter((s) => s.value).length;
  }

  function filtered() {
    const q = (els.search.value || "").trim().toLowerCase();
    const d = els.dept.value, l = els.loc.value, m = els.mgr.value, ds = els.desg.value;
    return DATA.filter((r) => {
      if (d && (r.department || "") !== d) return false;
      if (l && (r.work_location || "") !== l) return false;
      if (m && (r.manager || "") !== m) return false;
      if (ds && (r.designation || "") !== ds) return false;
      if (!q) return true;
      const blob = [r.name, r.identity, r.phone, r.manager, r.designation, r.department, r.work_location]
        .map((v) => (v || "").toString().toLowerCase()).join(" ");
      return blob.includes(q);
    });
  }

  function render() {
    const list = filtered();
    els.empty.classList.toggle("hidden", list.length !== 0);
    els.resultCount.textContent = list.length === DATA.length
      ? `Showing all ${DATA.length}`
      : `${list.length} of ${DATA.length}`;
    els.grid.innerHTML = list.map(card).join("");
    [...els.grid.querySelectorAll(".card")].forEach((node) => {
      node.addEventListener("click", () => openModal(node.dataset.id));
    });
    const ac = activeFilterCount();
    els.activeCount.textContent = ac;
    els.activeCount.classList.toggle("hidden", ac === 0);
  }

  function initials(name) {
    const parts = (name || "").trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase() || "?";
  }

  function card(r) {
    const phone = (r.phone || "").replace(/\D/g, "");
    const sub = [r.designation, r.work_location].filter(Boolean).map(escapeHtml).join('<span class="sep">·</span>');
    return `
      <article class="card" data-id="${r.id}">
        <div class="avatar">${initials(r.name)}</div>
        <div class="card-main">
          <div class="name">${escapeHtml(r.name || "—")}</div>
          <div class="meta-line">${sub || "—"}</div>
        </div>
        ${phone ? `<a class="call-btn" href="tel:${phone}" onclick="event.stopPropagation()" aria-label="Call ${escapeAttr(r.name)}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.7-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1Z"/></svg>
        </a>` : ""}
      </article>
    `;
  }

  function openModal(id) {
    const r = DATA.find((x) => String(x.id) === String(id));
    if (!r) return;
    const phone = (r.phone || "").replace(/\D/g, "");
    const fields = [
      ["NVSSN ID", r.identity],
      ["Department", r.department],
      ["Designation", r.designation],
      ["Manager", r.manager],
      ["Location", r.work_location],
      ["Phone", r.phone],
      ["Shift", r.working_shifts],
      ["Status", r.status],
      ["Type", r.type],
      ["Employee Type", r.employee_type],
      ["Date of Birth", r.date_of_birth],
      ["Date of Joining", r.date_of_joining],
    ].filter(([, v]) => v && v !== "NA");

    const actions = phone ? `
      <div class="action-row">
        <a class="action call" href="tel:${phone}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.7-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1Z"/></svg>
          Call
        </a>
        <a class="action" href="sms:${phone}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/></svg>
          SMS
        </a>
        <a class="action" href="https://wa.me/${phone.startsWith('91') || phone.length > 10 ? phone : '91' + phone}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-1-.3-.1-.5-.2-.7.1l-.9 1.2c-.2.3-.4.3-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5-.1-.2-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7 0 1.6 1.1 3.1 1.3 3.3.2.2 2.3 3.5 5.5 4.9.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 0a12 12 0 0 0-10.3 18.1L0 24l6-1.6A12 12 0 1 0 12 0Z"/></svg>
          WhatsApp
        </a>
      </div>` : "";

    els.modalBody.innerHTML = `
      <div class="detail-head">
        <div class="avatar">${initials(r.name)}</div>
        <div>
          <h2>${escapeHtml(r.name || "—")}</h2>
          <div class="id">${escapeHtml(r.identity || "—")}</div>
        </div>
      </div>
      ${actions}
      <dl class="detail-grid">
        ${fields.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")}
      </dl>
    `;
    els.modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    els.modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
  const escapeAttr = escapeHtml;

  // Events
  ["input", "change"].forEach((ev) => {
    els.search.addEventListener(ev, render);
    els.dept.addEventListener(ev, render);
    els.loc.addEventListener(ev, render);
    els.mgr.addEventListener(ev, render);
    els.desg.addEventListener(ev, render);
  });
  els.clearSearch.addEventListener("click", () => { els.search.value = ""; render(); els.search.focus(); });
  els.clearBtn.addEventListener("click", () => {
    els.dept.value = ""; els.loc.value = ""; els.mgr.value = ""; els.desg.value = "";
    render();
  });
  els.filterToggle.addEventListener("click", () => {
    const open = els.filterPanel.classList.toggle("hidden");
    els.filterToggle.setAttribute("aria-expanded", String(!open));
  });
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", (e) => { if (e.target === els.modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  fetchAll();
})();

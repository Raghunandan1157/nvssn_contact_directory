(() => {
  const API = `${window.SUPABASE_URL}/rest/v1/${window.NVSSN_TABLE}`;
  const HEADERS = {
    apikey: window.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
  };

  const els = {
    grid: document.getElementById("grid"),
    empty: document.getElementById("empty"),
    meta: document.getElementById("meta"),
    stats: document.getElementById("stats"),
    search: document.getElementById("search"),
    dept: document.getElementById("dept"),
    loc: document.getElementById("loc"),
    mgr: document.getElementById("mgr"),
    desg: document.getElementById("desg"),
    clearBtn: document.getElementById("clearBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    modal: document.getElementById("modal"),
    modalBody: document.getElementById("modalBody"),
    modalClose: document.getElementById("modalClose"),
  };

  let DATA = [];

  async function fetchAll() {
    els.meta.textContent = "Loading employees…";
    const url = `${API}?select=*&order=sl_no.asc`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    DATA = await res.json();
    els.meta.textContent = `${DATA.length} employees · last updated ${new Date().toLocaleString()}`;
    populateFilters();
    render();
  }

  function uniqueSorted(key) {
    const set = new Set(
      DATA.map((d) => (d[key] || "").trim()).filter((v) => v && v !== "NA")
    );
    return [...set].sort();
  }

  function populateFilters() {
    const fill = (sel, vals) => {
      const cur = sel.value;
      sel.innerHTML = `<option value="">All ${sel.id}</option>` +
        vals.map((v) => `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`).join("");
      sel.value = cur;
    };
    fill(els.dept, uniqueSorted("department"));
    fill(els.loc, uniqueSorted("work_location"));
    fill(els.mgr, uniqueSorted("manager"));
    fill(els.desg, uniqueSorted("designation"));
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
    els.grid.innerHTML = list.map(card).join("");
    renderStats(list);
    [...els.grid.querySelectorAll(".card")].forEach((node) => {
      node.addEventListener("click", () => openModal(node.dataset.id));
    });
  }

  function renderStats(list) {
    const total = list.length;
    const depts = new Set(list.map((r) => r.department || "—")).size;
    const locs = new Set(list.map((r) => r.work_location || "—")).size;
    const inNow = list.filter((r) => /^In/i.test(r.status || "")).length;
    els.stats.innerHTML = `
      <span class="chip"><strong>${total}</strong>employees</span>
      <span class="chip"><strong>${depts}</strong>departments</span>
      <span class="chip"><strong>${locs}</strong>locations</span>
      <span class="chip"><strong>${inNow}</strong>currently in</span>
    `;
  }

  function initials(name) {
    const parts = (name || "").trim().split(/\s+/);
    return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase() || "?";
  }

  function statusClass(s) {
    if (!s) return "";
    return /^In/i.test(s) ? "status-in" : "status-out";
  }

  function card(r) {
    return `
      <article class="card" data-id="${r.id}">
        <div class="row1">
          <div class="avatar">${initials(r.name)}</div>
          <div>
            <div class="name">${escapeHtml(r.name || "—")}</div>
            <div class="id">${escapeHtml(r.identity || "—")}</div>
          </div>
        </div>
        <div class="tagline">${escapeHtml(r.designation || "—")}</div>
        <div class="tags">
          ${r.department ? `<span class="tag dept">${escapeHtml(r.department)}</span>` : ""}
          ${r.work_location ? `<span class="tag loc">${escapeHtml(r.work_location)}</span>` : ""}
          ${r.status ? `<span class="tag ${statusClass(r.status)}">${escapeHtml(r.status)}</span>` : ""}
        </div>
        <div class="row-bottom">
          <a class="phone" href="tel:${escapeAttr(r.phone || '')}" onclick="event.stopPropagation()">${escapeHtml(r.phone || "—")}</a>
          <span class="id">${escapeHtml(r.manager ? "↳ " + r.manager : "")}</span>
        </div>
      </article>
    `;
  }

  function openModal(id) {
    const r = DATA.find((x) => String(x.id) === String(id));
    if (!r) return;
    const fields = [
      ["NVSSN ID", r.identity],
      ["Department", r.department],
      ["Designation", r.designation],
      ["Manager", r.manager],
      ["Work Location", r.work_location],
      ["Phone", r.phone],
      ["Working Shifts", r.working_shifts],
      ["Status", r.status],
      ["Type", r.type],
      ["Employee Type", r.employee_type],
      ["Licenses", r.licenses],
      ["Date of Birth", r.date_of_birth],
      ["Date of Joining", r.date_of_joining],
      ["App Version", r.app_version],
      ["Last Sync (Mobile)", r.last_sync_mobile],
      ["Last Location Update", r.last_location],
      ["DBID", r.dbid],
      ["Created By", r.created_by],
    ];
    els.modalBody.innerHTML = `
      <div class="detail-head">
        <div class="avatar">${initials(r.name)}</div>
        <div>
          <h2>${escapeHtml(r.name || "—")}</h2>
          <div class="id">${escapeHtml(r.identity || "—")}</div>
        </div>
      </div>
      <dl class="detail-grid">
        ${fields.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v || "—")}</dd>`).join("")}
      </dl>
    `;
    els.modal.classList.remove("hidden");
  }

  function closeModal() { els.modal.classList.add("hidden"); }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // Events
  ["input", "change"].forEach((ev) => {
    els.search.addEventListener(ev, render);
    els.dept.addEventListener(ev, render);
    els.loc.addEventListener(ev, render);
    els.mgr.addEventListener(ev, render);
    els.desg.addEventListener(ev, render);
  });
  els.clearBtn.addEventListener("click", () => {
    els.search.value = ""; els.dept.value = ""; els.loc.value = "";
    els.mgr.value = ""; els.desg.value = ""; render();
  });
  els.refreshBtn.addEventListener("click", () => fetchAll().catch(showError));
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", (e) => { if (e.target === els.modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function showError(err) {
    els.meta.textContent = "Error: " + err.message;
    console.error(err);
  }

  fetchAll().catch(showError);
})();

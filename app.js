(() => {
  const API = `${window.SUPABASE_URL}/rest/v1/${window.NVSSN_TABLE}`;
  const FN_URL = `${window.SUPABASE_URL}/functions/v1/nvssn-replace-employees`;
  const HEADERS = {
    apikey: window.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`,
  };

  const ADMIN_USER = "NVSSSN";
  const ADMIN_PASS = "Nvssn@4321";

  const $ = (id) => document.getElementById(id);
  const els = {
    grid: $("grid"), empty: $("empty"), meta: $("meta"),
    resultCount: $("resultCount"),
    search: $("search"), clearSearch: $("clearSearch"),
    dept: $("dept"), loc: $("loc"), mgr: $("mgr"), desg: $("desg"),
    clearBtn: $("clearBtn"),
    filterToggle: $("filterToggle"), filterPanel: $("filterPanel"),
    activeCount: $("activeCount"),
    modal: $("modal"), modalBody: $("modalBody"), modalClose: $("modalClose"),
    settingsBtn: $("settingsBtn"), settingsModal: $("settingsModal"),
    settingsClose: $("settingsClose"),
    loginPane: $("loginPane"), adminPane: $("adminPane"),
    loginForm: $("loginForm"), loginUser: $("loginUser"),
    loginPass: $("loginPass"), loginErr: $("loginErr"),
    fileInput: $("fileInput"), fileText: $("fileText"), fileLabel: $("fileLabel"),
    parseInfo: $("parseInfo"),
    uploadBtn: $("uploadBtn"), uploadStatus: $("uploadStatus"),
    logoutBtn: $("logoutBtn"),
  };

  let DATA = [];
  let parsedRows = null;

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

    const wa = phone ? (phone.length > 10 ? phone : "91" + phone) : "";
    const cardUrl = buildBusinessCardUrl(r);
    const callBtn = phone ? `
        <a class="action call" href="tel:${phone}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.7-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1Z"/></svg>
          Call
        </a>
        <a class="action" href="sms:${phone}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/></svg>
          SMS
        </a>
        <a class="action" href="https://wa.me/${wa}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.8-2-1-.3-.1-.5-.2-.7.1l-.9 1.2c-.2.3-.4.3-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.4 0-.5-.1-.2-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.7 0 1.6 1.1 3.1 1.3 3.3.2.2 2.3 3.5 5.5 4.9.8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 0a12 12 0 0 0-10.3 18.1L0 24l6-1.6A12 12 0 1 0 12 0Z"/></svg>
          WhatsApp
        </a>` : "";
    const bcardBtn = `
        <a class="action bcard" href="${cardUrl}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-9 4a2 2 0 1 1-2 2 2 2 0 0 1 2-2Zm4 9H7v-.8c0-1.3 2.7-2 4-2s4 .7 4 2Zm6-3h-5v-1h5Zm0-2h-5v-1h5Zm0-2h-5V9h5Z"/></svg>
          Business Card
        </a>`;
    const actions = (phone || cardUrl) ? `<div class="action-row">${callBtn}${bcardBtn}</div>` : "";

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
    showModal(els.modal);
  }

  function buildBusinessCardUrl(r) {
    const base = window.BUSINESS_CARD_URL;
    if (!base) return "";
    const HIDE = "​"; // zero-width space; forces override of card defaults
    const cardData = {
      name: r.name || "",
      designation: r.designation || "",
      company: window.NVSSN_COMPANY || "",
      phone: (r.phone || "").trim() || HIDE,
      email: window.NVSSN_EMAIL || HIDE,
      website: window.NVSSN_WEBSITE || "",
      location: r.work_location || "",
    };
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(cardData))));
    return `${base}?data=${encodeURIComponent(enc)}`;
  }

  function showModal(m) { m.classList.remove("hidden"); document.body.style.overflow = "hidden"; }
  function hideModal(m) { m.classList.add("hidden"); document.body.style.overflow = ""; }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }
  const escapeAttr = escapeHtml;

  // ===== Settings / Auth =====
  const isLoggedIn = () => sessionStorage.getItem("nvssn_admin") === "1";

  function showAdminPane() {
    els.loginPane.classList.add("hidden");
    els.adminPane.classList.remove("hidden");
  }
  function showLoginPane() {
    els.adminPane.classList.add("hidden");
    els.loginPane.classList.remove("hidden");
    els.loginErr.classList.add("hidden");
    els.loginUser.value = ""; els.loginPass.value = "";
    resetUploadUI();
  }

  function openSettings() {
    if (isLoggedIn()) showAdminPane(); else showLoginPane();
    showModal(els.settingsModal);
  }

  function resetUploadUI() {
    parsedRows = null;
    els.fileInput.value = "";
    els.fileText.textContent = "Choose Excel file (.xlsx)";
    els.fileLabel.classList.remove("has-file");
    els.parseInfo.textContent = "";
    els.uploadBtn.disabled = true;
    els.uploadStatus.textContent = "";
    els.uploadStatus.className = "hint";
  }

  // ===== Excel parsing =====
  const COL_MAP = {
    "SL NO.": "sl_no", "SL NO": "sl_no", "SLNO": "sl_no",
    "NAME": "name",
    "MANAGER": "manager",
    "IDENTITY": "identity",
    "DEPARTMENT": "department",
    "EMAIL": "phone", "PHONE": "phone",
    "DESIGNATIONS": "designation", "DESIGNATION": "designation",
    "WORKING SHIFTS": "working_shifts",
    "STATUS": "status",
    "WORK LOCATION": "work_location",
    "TYPE": "type",
    "EMPLOYEE TYPE": "employee_type",
    "BUSINESS UNIT": "business_unit",
    "LICENSES": "licenses",
    "COST CENTER": "cost_center",
    "ROLES": "roles",
    "APP VERSION": "app_version",
    "DESKTOP VERSION": "desktop_version",
    "LAST DESKTOP STARTED": "last_desktop_started",
    "LAST SYNC DESKTOP": "last_sync_desktop",
    "LAST SYNC MOBILE": "last_sync_mobile",
    "LAST LOCATION": "last_location",
    "LOCATION": "location",
    "ADDRESS": "address",
    "DATE OF BIRTH": "date_of_birth",
    "DATE OF JOINING": "date_of_joining",
    "DBID": "dbid",
    "CREATED BY": "created_by",
  };

  const DATE_KEYS = new Set(["date_of_birth", "date_of_joining"]);

  function parseDateValue(v) {
    if (v == null || v === "" || v === "NA") return null;
    if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
    if (typeof v === "number") {
      // Excel serial date
      const ms = (v - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d)) return d.toISOString().slice(0, 10);
    }
    if (typeof v === "string") {
      const s = v.trim();
      const tryFormats = [
        /^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{4})$/i,
        /^(\d{4})-(\d{2})-(\d{2})$/,
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      ];
      const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
      let m = s.match(tryFormats[0]);
      if (m) return `${m[3]}-${String(months[m[2].toLowerCase()]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
      m = s.match(tryFormats[1]);
      if (m) return s;
      m = s.match(tryFormats[2]);
      if (m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    }
    return null;
  }

  function parseWorkbook(wb) {
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });
    if (rows.length === 0) throw new Error("Sheet has no data rows");

    const headers = Object.keys(rows[0]);
    const headerKey = (h) => COL_MAP[String(h).trim().toUpperCase()];
    const knownHeaders = headers.filter(headerKey);
    if (!knownHeaders.find((h) => headerKey(h) === "name") ||
        !knownHeaders.find((h) => headerKey(h) === "identity")) {
      throw new Error("Required columns Name and Identity not found");
    }

    const out = [];
    for (const row of rows) {
      const rec = {};
      for (const h of headers) {
        const k = headerKey(h);
        if (!k) continue;
        let v = row[h];
        if (k === "sl_no") {
          const n = parseInt(v, 10);
          rec[k] = Number.isFinite(n) ? n : null;
        } else if (DATE_KEYS.has(k)) {
          rec[k] = parseDateValue(v);
        } else {
          if (v == null) rec[k] = null;
          else rec[k] = String(v).trim();
        }
      }
      if (rec.name && rec.identity) out.push(rec);
    }
    return out;
  }

  function handleFile(file) {
    els.uploadStatus.textContent = "";
    els.uploadStatus.className = "hint";
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
        const rows = parseWorkbook(wb);
        if (rows.length === 0) throw new Error("No valid rows found");
        parsedRows = rows;
        els.fileText.textContent = file.name;
        els.fileLabel.classList.add("has-file");
        els.parseInfo.textContent = `Parsed ${rows.length} rows. Click Upload to replace database.`;
        els.uploadBtn.disabled = false;
      } catch (err) {
        parsedRows = null;
        els.uploadBtn.disabled = true;
        els.parseInfo.textContent = "";
        els.uploadStatus.textContent = "Parse error: " + err.message;
        els.uploadStatus.className = "hint error";
      }
    };
    reader.onerror = () => {
      els.uploadStatus.textContent = "Could not read file";
      els.uploadStatus.className = "hint error";
    };
    reader.readAsArrayBuffer(file);
  }

  async function doUpload() {
    if (!parsedRows || parsedRows.length === 0) return;
    if (!confirm(`This will erase all current data and insert ${parsedRows.length} rows. Continue?`)) return;
    els.uploadBtn.disabled = true;
    els.uploadStatus.textContent = "Uploading… do not close.";
    els.uploadStatus.className = "hint";
    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: {
          ...HEADERS,
          "Content-Type": "application/json",
          "x-nvssn-pass": ADMIN_PASS,
        },
        body: JSON.stringify(parsedRows),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      els.uploadStatus.textContent = `Done. ${json.inserted} rows inserted.`;
      els.uploadStatus.className = "hint success";
      await fetchAll();
      setTimeout(resetUploadUI, 1500);
    } catch (err) {
      els.uploadStatus.textContent = "Upload failed: " + err.message;
      els.uploadStatus.className = "hint error";
      els.uploadBtn.disabled = false;
    }
  }

  // ===== Events =====
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
  els.modalClose.addEventListener("click", () => hideModal(els.modal));
  els.modal.addEventListener("click", (e) => { if (e.target === els.modal) hideModal(els.modal); });

  els.settingsBtn.addEventListener("click", openSettings);
  els.settingsClose.addEventListener("click", () => hideModal(els.settingsModal));
  els.settingsModal.addEventListener("click", (e) => { if (e.target === els.settingsModal) hideModal(els.settingsModal); });

  els.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const u = els.loginUser.value.trim();
    const p = els.loginPass.value;
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem("nvssn_admin", "1");
      els.loginErr.classList.add("hidden");
      showAdminPane();
    } else {
      els.loginErr.textContent = "Invalid credentials";
      els.loginErr.classList.remove("hidden");
    }
  });

  els.fileInput.addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  });
  els.uploadBtn.addEventListener("click", doUpload);
  els.logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("nvssn_admin");
    showLoginPane();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!els.modal.classList.contains("hidden")) hideModal(els.modal);
    else if (!els.settingsModal.classList.contains("hidden")) hideModal(els.settingsModal);
  });

  fetchAll();
})();
